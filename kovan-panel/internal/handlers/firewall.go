package handlers

import (
	"encoding/json"
	"kovan-panel/internal/db"
	"kovan-panel/internal/proxy"
	"github.com/gofiber/fiber/v2"
)

type FirewallUpdateRequest struct {
	AllowedIPs []string `json:"allowed_ips"`
}

// UpdateFirewall, uygulamanın IP beyaz listesini günceller.
func UpdateFirewall(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("id")

	var req FirewallUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek formatı"})
	}

	// Yetki kontrolü ve güncelleme
	envVarsJSON, _ := json.Marshal(req.AllowedIPs)
	_, err := db.DB.Exec("UPDATE instances SET allowed_ips = ? WHERE id = ? AND user_id = ?", 
		string(envVarsJSON), instanceId, userId)
	
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı güncelleme hatası"})
	}

	// Caddy'yi yeni IP'lerle güncelle
	if err := proxy.SyncRoutes(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Proxy güncellenemedi: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"message": "Firewall kuralları güncellendi.",
	})
}
