package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
	"kovan-panel/internal/proxy"
	"kovan-panel/internal/utils"
)

type CreateInstanceRequest struct {
	Name         string  `json:"name"`
	Subdomain    string  `json:"subdomain"`
	CustomDomain string  `json:"custom_domain"`
	GitURL       string  `json:"git_url"`
	TemplateID   string  `json:"template_id"`
	CPULimit     float64 `json:"cpu_limit"`    // Yeni: v3
	MemoryLimit  int64   `json:"memory_limit"` // Yeni: v3
}

// GetTemplateByID şablon bilgilerini veritabanından getirir.
func GetTemplateByID(id string) map[string]interface{} {
	var name, description, image, category, mountPath string
	var portsJSON, envVarsJSON string
	err := db.DB.QueryRow("SELECT name, description, image, ports, env_vars, category, mount_path FROM templates WHERE id = ?", id).
		Scan(&name, &description, &image, &portsJSON, &envVarsJSON, &category, &mountPath)
	
	if err != nil {
		return nil
	}

	var ports []int
	json.Unmarshal([]byte(portsJSON), &ports)
	
	firstPort := "80"
	if len(ports) > 0 {
		firstPort = strconv.Itoa(ports[0])
	}

	return map[string]interface{}{
		"name":        name,
		"description": description,
		"image":       image,
		"port":        firstPort,
		"mount_path":  mountPath,
		"category":    category,
		"env_vars":    envVarsJSON,
	}
}

// CreateInstance yeni bir uygulama ayağa kaldırır.
func CreateInstance(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	
	var req CreateInstanceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	tpl := GetTemplateByID(req.TemplateID)
	if tpl == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz şablon ID"})
	}

	imageName := tpl["image"].(string)
	containerPort := tpl["port"].(string)
	targetPath := tpl["mount_path"].(string)

	// 1. Dinamik Port Bul
	hostPort, err := utils.GetAvailablePort()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Boş port bulunamadı"})
	}

	// 2. Veritabanına Kaydet
	insertQuery := `INSERT INTO instances (name, subdomain, custom_domain, git_url, image_tag, port, status, cpu_limit, memory_limit, user_id) VALUES (?, ?, ?, ?, ?, ?, 'creating', ?, ?, ?)`
	res, err := db.DB.Exec(insertQuery, req.Name, req.Subdomain, req.CustomDomain, req.GitURL, imageName, hostPort, req.CPULimit, req.MemoryLimit, userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı kayıt hatası (Subdomain kullanılıyor olabilir)"})
	}
	id, _ := res.LastInsertId()

	// 3. Dosya Sistemi Hazırlığı (Host üzerinde klasör oluştur)
	cwd, _ := os.Getwd()
	hostPath := filepath.Join(cwd, "storage", fmt.Sprintf("kovan-%s", req.Subdomain))
	os.MkdirAll(hostPath, 0755)

	// Eğer Git URL varsa, repoyu klasöre klonla
	if req.GitURL != "" {
		// Klasör boş değilse (tekrar oluşturma durumu), içeriği temizle
		os.RemoveAll(hostPath)
		os.MkdirAll(hostPath, 0755)
		
		cmd := exec.Command("git", "clone", req.GitURL, ".")
		cmd.Dir = hostPath
		if err := cmd.Run(); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Git clone hatası: " + err.Error()})
		}
	} else if tpl["category"] != "database" {
		// Varsayılan bir index dosyası oluştur (Sadece web uygulamaları için, DB'ler temiz dizin ister)
		defaultFile := filepath.Join(hostPath, "index.html")
		if _, err := os.Stat(defaultFile); os.IsNotExist(err) {
			os.WriteFile(defaultFile, []byte(fmt.Sprintf("<h1>Kovan: %s calisiyor!</h1>", req.Name)), 0644)
		}
	}

	// 4. Docker İmajını Çek ve Konteyneri Ayağa Kaldır
	ctx := context.Background()
	containerName := fmt.Sprintf("kovan-%s", req.Subdomain)
	networkName := fmt.Sprintf("kovan-user-%d", userId)

	// Kullanıcı ağının varlığından emin ol (v3 Step 5)
	if err := docker.EnsureNetworkExists(ctx, networkName); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ağ oluşturulamadı: " + err.Error()})
	}
	
	if err := docker.PullImage(ctx, imageName); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "İmaj indirilemedi: " + err.Error()})
	}

	var envVars []string
	json.Unmarshal([]byte(tpl["env_vars"].(string)), &envVars)

	_, err = docker.CreateAndStartContainer(ctx, containerName, imageName, strconv.Itoa(hostPort), containerPort, hostPath, targetPath, req.CPULimit, req.MemoryLimit, envVars, networkName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Konteyner başlatılamadı: " + err.Error()})
	}

	// Durumu ve Konfigürasyonu Güncelle (Restore için gerekli)
	envVarsJSON, _ := json.Marshal(envVars)
	db.DB.Exec(`
		UPDATE instances SET 
			status = 'running', 
			image = ?, 
			port = ?, 
			container_port = ?, 
			host_path = ?, 
			target_path = ?, 
			cpu_limit = ?, 
			memory_limit = ?, 
			env_vars = ?
		WHERE id = ?`, 
		imageName, strconv.Itoa(hostPort), containerPort, hostPath, targetPath, req.CPULimit, req.MemoryLimit, string(envVarsJSON), id)

	// 4. Caddy Router'ı Güncelle (Zero Downtime)
	if err := proxy.SyncRoutes(); err != nil {
		// Loglayabiliriz ama işlemi kesmeye gerek yok
		fmt.Printf("Uyarı: Caddy senkronizasyon hatası: %v\n", err)
	}

	// Webhook Tetikle (v3 Step 6)
	utils.TriggerWebhook(userId, "deploy.success", req.Name, fiber.Map{
		"subdomain": req.Subdomain,
		"domain":    fmt.Sprintf("%s.kovan.local", req.Subdomain),
	})

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Uygulama başarıyla oluşturuldu ve yönlendirildi!",
		"port":    hostPort,
		"domain":  fmt.Sprintf("%s.kovan.local", req.Subdomain),
	})
}

// ListInstances veritabanındaki tüm uygulamaları getirir.
func ListInstances(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	rows, err := db.DB.Query("SELECT id, name, subdomain, custom_domain, git_url, image_tag, port, status, cpu_limit, memory_limit, created_at, allowed_ips FROM instances WHERE user_id = ? ORDER BY id DESC", userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı okuma hatası"})
	}
	defer rows.Close()

	var instances []map[string]interface{}
	for rows.Next() {
		var id, port int
		var name, subdomain, imageTag, status, createdAt string
		var customDomain, gitUrl, allowedIps sql.NullString
		var cpuLimit float64
		var memoryLimit int64
		if err := rows.Scan(&id, &name, &subdomain, &customDomain, &gitUrl, &imageTag, &port, &status, &cpuLimit, &memoryLimit, &createdAt, &allowedIps); err != nil {
			continue
		}
		
		cdStr := ""
		if customDomain.Valid {
			cdStr = customDomain.String
		}

		instances = append(instances, map[string]interface{}{
			"id":            id,
			"name":          name,
			"subdomain":     subdomain,
			"custom_domain": cdStr,
			"git_url":       gitUrl.String,
			"image_tag":     imageTag,
			"port":          port,
			"status":        status,
			"cpu_limit":     cpuLimit,
			"memory_limit":  memoryLimit,
			"created_at":    createdAt,
			"allowed_ips":   allowedIps.String,
		})
	}

	// Boş slice dönerse null yerine [] dönmesi için
	if instances == nil {
		instances = make([]map[string]interface{}, 0)
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   instances,
	})
}
// GetInstanceLogs, uygulamanın geçmiş loglarını döndürür.
func GetInstanceLogs(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	id := c.Params("id")

	var subdomain string
	err := db.DB.QueryRow("SELECT subdomain FROM instances WHERE id = ? AND user_id = ?", id, userId).Scan(&subdomain)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Uygulama bulunamadı."})
	}

	containerName := fmt.Sprintf("kovan-%s", subdomain)
	ctx := context.Background()

	// Docker'dan son 1000 satırı çek (Follow: false)
	reader, err := docker.StreamLogs(ctx, containerName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Loglar çekilemedi: " + err.Error()})
	}
	defer reader.Close()

	// Docker multiplexed formatını temizle
	var logsText string
	for {
		header := make([]byte, 8)
		_, err := io.ReadFull(reader, header)
		if err != nil {
			break
		}
		count := uint32(header[4])<<24 | uint32(header[5])<<16 | uint32(header[6])<<8 | uint32(header[7])
		payload := make([]byte, count)
		_, err = io.ReadFull(reader, payload)
		if err != nil {
			break
		}
		logsText += string(payload)
	}

	return c.SendString(logsText)
}
