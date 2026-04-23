package handlers

import (
	"encoding/json"
	"kovan-panel/internal/db"
	"kovan-panel/internal/models"

	"github.com/gofiber/fiber/v2"
)

// GetTemplates, desteklenen tüm imaj şablonlarını (kataloğu) döndürür.
func GetTemplates(c *fiber.Ctx) error {
	rows, err := db.DB.Query("SELECT id, name, description, image, ports, env_vars, category, mount_path FROM templates")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Şablonlar okunamadı"})
	}
	defer rows.Close()

	var templates []models.Template
	for rows.Next() {
		var t models.Template
		var portsJSON, envVarsJSON string
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.Image, &portsJSON, &envVarsJSON, &t.Category, &t.MountPath); err != nil {
			continue
		}

		json.Unmarshal([]byte(portsJSON), &t.Ports)
		json.Unmarshal([]byte(envVarsJSON), &t.EnvVars)

		templates = append(templates, t)
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   templates,
	})
}
