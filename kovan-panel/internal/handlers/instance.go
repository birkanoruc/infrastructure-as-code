package handlers

import (
	"context"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
	"kovan-panel/internal/proxy"
	"kovan-panel/internal/utils"
)

type CreateInstanceRequest struct {
	Name      string `json:"name"`
	Subdomain string `json:"subdomain"`
	TemplateID string `json:"template_id"`
}

// GetTemplateByID yardımcı fonksiyonu
func getTemplateByID(id string) map[string]interface{} {
	// İleride bu veritabanından çekilecek, şimdilik statik eşleştirme
	templates := map[string]map[string]interface{}{
		"nginx":        {"image": "nginx:alpine", "port": "80"},
		"php-8-apache": {"image": "php:8.2-apache", "port": "80"},
		"node-18":      {"image": "node:18-alpine", "port": "3000"},
		"python-3-11":  {"image": "python:3.11-alpine", "port": "8000"},
	}
	return templates[id]
}

// CreateInstance yeni bir uygulama ayağa kaldırır.
func CreateInstance(c *fiber.Ctx) error {
	var req CreateInstanceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	tpl := getTemplateByID(req.TemplateID)
	if tpl == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz şablon ID"})
	}

	imageName := tpl["image"].(string)
	containerPort := tpl["port"].(string)

	// 1. Dinamik Port Bul
	hostPort, err := utils.GetAvailablePort()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Boş port bulunamadı"})
	}

	// 2. Veritabanına Kaydet
	insertQuery := `INSERT INTO instances (name, subdomain, image_tag, port, status) VALUES (?, ?, ?, ?, 'creating')`
	res, err := db.DB.Exec(insertQuery, req.Name, req.Subdomain, imageName, hostPort)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı kayıt hatası (Subdomain kullanılıyor olabilir)"})
	}
	id, _ := res.LastInsertId()

	// 3. Docker İmajını Çek ve Konteyneri Ayağa Kaldır
	ctx := context.Background()
	containerName := fmt.Sprintf("kovan-%s", req.Subdomain)
	
	// İmajı çekmek biraz sürebilir, şimdilik asenkron yapmıyoruz test için beklesin
	if err := docker.PullImage(ctx, imageName); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "İmaj indirilemedi: " + err.Error()})
	}

	_, err = docker.CreateAndStartContainer(ctx, containerName, imageName, strconv.Itoa(hostPort), containerPort)
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
	rows, err := db.DB.Query("SELECT id, name, subdomain, image_tag, port, status, created_at FROM instances ORDER BY id DESC")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı okuma hatası"})
	}
	defer rows.Close()

	var instances []map[string]interface{}
	for rows.Next() {
		var id, port int
		var name, subdomain, imageTag, status, createdAt string
		if err := rows.Scan(&id, &name, &subdomain, &imageTag, &port, &status, &createdAt); err != nil {
			continue
		}
		instances = append(instances, map[string]interface{}{
			"id":         id,
			"name":       name,
			"subdomain":  subdomain,
			"image_tag":  imageTag,
			"port":       port,
			"status":     status,
			"created_at": createdAt,
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
