package handlers

import (
	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/models"
)

// GetTemplates, desteklenen tüm imaj şablonlarını (kataloğu) döndürür.
func GetTemplates(c *fiber.Ctx) error {
	// Şimdilik konfigürasyon olarak bellekte tutuyoruz.
	// İleride veritabanından veya bir config dosyasından okunabilir.
	templates := []models.Template{
		{
			ID:          "nginx",
			Name:        "Nginx Static Web Server",
			Description: "Statik web siteleri, HTML projeleri veya SPA'lar (React/Vue/Angular) için yüksek performanslı web sunucusu.",
			Image:       "nginx:alpine",
			Ports:       []int{80},
		},
		{
			ID:          "php-8-apache",
			Name:        "PHP 8.2 + Apache",
			Description: "Klasik PHP uygulamaları, Laravel altyapıları veya basit betikler için hazır ortam.",
			Image:       "php:8.2-apache",
			Ports:       []int{80},
		},
		{
			ID:          "node-18",
			Name:        "Node.js 18",
			Description: "Backend API'ler, Express.js, NestJS veya diğer JavaScript/TypeScript projeleri için.",
			Image:       "node:18-alpine",
			Ports:       []int{3000}, // Genelde Node.js projeleri 3000 kullanır
			EnvVars:     []string{"NODE_ENV=production"},
		},
		{
			ID:          "python-3-11",
			Name:        "Python 3.11",
			Description: "Flask, FastAPI veya temel Python betikleri için minimal ve hızlı ortam.",
			Image:       "python:3.11-alpine",
			Ports:       []int{8000},
		},
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   templates,
	})
}
