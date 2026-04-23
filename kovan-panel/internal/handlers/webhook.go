package handlers

import (
	"encoding/json"
	"kovan-panel/internal/db"
	"github.com/gofiber/fiber/v2"
)

type WebhookCreateRequest struct {
	Name   string   `json:"name"`
	URL    string   `json:"url"`
	Events []string `json:"events"`
}

func CreateWebhook(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	var req WebhookCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	eventsJSON, _ := json.Marshal(req.Events)
	_, err := db.DB.Exec("INSERT INTO webhooks (user_id, name, url, events) VALUES (?, ?, ?, ?)", 
		userId, req.Name, req.URL, string(eventsJSON))
	
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Webhook oluşturulamadı"})
	}

	return c.JSON(fiber.Map{"status": "success"})
}

func ListWebhooks(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	rows, err := db.DB.Query("SELECT id, name, url, events, created_at FROM webhooks WHERE user_id = ?", userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı hatası"})
	}
	defer rows.Close()

	var webhooks []fiber.Map
	for rows.Next() {
		var id int
		var name, url, eventsJSON, createdAt string
		rows.Scan(&id, &name, &url, &eventsJSON, &createdAt)
		
		var events []string
		json.Unmarshal([]byte(eventsJSON), &events)

		webhooks = append(webhooks, fiber.Map{
			"id":         id,
			"name":       name,
			"url":        url,
			"events":     events,
			"created_at": createdAt,
		})
	}
	return c.JSON(fiber.Map{"status": "success", "data": webhooks})
}

func DeleteWebhook(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	webhookId := c.Params("id")

	_, err := db.DB.Exec("DELETE FROM webhooks WHERE id = ? AND user_id = ?", webhookId, userId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Silme hatası"})
	}

	return c.JSON(fiber.Map{"status": "success"})
}
