package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"kovan-panel/internal/db"
	"github.com/gofiber/fiber/v2"
)

type APIKeyCreateRequest struct {
	Name string `json:"name"`
}

// GenerateRandomKey güvenli bir rastgele string üretir.
func GenerateRandomKey() string {
	b := make([]byte, 20)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return "kvp_" + hex.EncodeToString(b) // kovan_panel_...
}

func CreateAPIKey(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	var req APIKeyCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	newKey := GenerateRandomKey()
	_, err := db.DB.Exec("INSERT INTO api_keys (user_id, name, key) VALUES (?, ?, ?)", userId, req.Name, newKey)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "API anahtarı oluşturulamadı"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"key":    newKey,
	})
}

func ListAPIKeys(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	rows, err := db.DB.Query("SELECT id, name, key, created_at FROM api_keys WHERE user_id = ?", userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı hatası"})
	}
	defer rows.Close()

	var keys []fiber.Map
	for rows.Next() {
		var id int
		var name, key, createdAt string
		rows.Scan(&id, &name, &key, &createdAt)
		
		// Anahtarın sadece başını ve sonunu gösterelim (Güvenlik)
		maskedKey := key[:8] + "..." + key[len(key)-4:]

		keys = append(keys, fiber.Map{
			"id":         id,
			"name":       name,
			"key_masked": maskedKey,
			"created_at": createdAt,
		})
	}
	return c.JSON(fiber.Map{"status": "success", "data": keys})
}

func DeleteAPIKey(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	keyId := c.Params("id")

	_, err := db.DB.Exec("DELETE FROM api_keys WHERE id = ? AND user_id = ?", keyId, userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Silme hatası"})
	}

	return c.JSON(fiber.Map{"status": "success"})
}
