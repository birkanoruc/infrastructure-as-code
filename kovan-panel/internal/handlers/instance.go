package handlers

import (
	"context"
	"database/sql"
	"fmt"
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
	Name         string `json:"name"`
	Subdomain    string `json:"subdomain"`
	CustomDomain string `json:"custom_domain"`
	GitURL       string `json:"git_url"` // Yeni: GitHub Repo URL
	TemplateID   string `json:"template_id"`
}

// GetTemplateByID yardımcı fonksiyonu
// GetTemplateByID şablon bilgilerini getirir.
func GetTemplateByID(id string) map[string]interface{} {
	// İleride bu veritabanından çekilecek, şimdilik statik eşleştirme
	templates := map[string]map[string]interface{}{
		"nginx":        {"image": "nginx:alpine", "port": "80", "mount_path": "/usr/share/nginx/html"},
		"php-8-apache": {"image": "php:8.2-apache", "port": "80", "mount_path": "/var/www/html"},
		"node-18":      {"image": "node:18-alpine", "port": "3000", "mount_path": "/app"},
		"python-3-11":  {"image": "python:3.11-alpine", "port": "8000", "mount_path": "/app"},
	}
	return templates[id]
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
	insertQuery := `INSERT INTO instances (name, subdomain, custom_domain, git_url, image_tag, port, status, user_id) VALUES (?, ?, ?, ?, ?, ?, 'creating', ?)`
	res, err := db.DB.Exec(insertQuery, req.Name, req.Subdomain, req.CustomDomain, req.GitURL, imageName, hostPort, userId)
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
	} else {
		// Varsayılan bir index dosyası oluştur (eğer boşsa)
		defaultFile := filepath.Join(hostPath, "index.html")
		if _, err := os.Stat(defaultFile); os.IsNotExist(err) {
			os.WriteFile(defaultFile, []byte(fmt.Sprintf("<h1>Kovan: %s calisiyor!</h1>", req.Name)), 0644)
		}
	}

	// 4. Docker İmajını Çek ve Konteyneri Ayağa Kaldır
	ctx := context.Background()
	containerName := fmt.Sprintf("kovan-%s", req.Subdomain)
	
	if err := docker.PullImage(ctx, imageName); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "İmaj indirilemedi: " + err.Error()})
	}

	_, err = docker.CreateAndStartContainer(ctx, containerName, imageName, strconv.Itoa(hostPort), containerPort, hostPath, targetPath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Konteyner başlatılamadı: " + err.Error()})
	}

	// Durumu Güncelle
	db.DB.Exec(`UPDATE instances SET status = 'running' WHERE id = ?`, id)

	// 4. Caddy Router'ı Güncelle (Zero Downtime)
	if err := proxy.SyncRoutes(); err != nil {
		// Loglayabiliriz ama işlemi kesmeye gerek yok
		fmt.Printf("Uyarı: Caddy senkronizasyon hatası: %v\n", err)
	}

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
	rows, err := db.DB.Query("SELECT id, name, subdomain, custom_domain, git_url, image_tag, port, status, created_at FROM instances WHERE user_id = ? ORDER BY id DESC", userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı okuma hatası"})
	}
	defer rows.Close()

	var instances []map[string]interface{}
	for rows.Next() {
		var id, port int
		var name, subdomain, imageTag, status, createdAt string
		var customDomain, gitUrl sql.NullString
		if err := rows.Scan(&id, &name, &subdomain, &customDomain, &gitUrl, &imageTag, &port, &status, &createdAt); err != nil {
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
			"created_at":    createdAt,
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
