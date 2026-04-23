package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
)

// getSafePath, kullanıcının sadece kendi storage alanına eriştiğinden emin olur.
func getSafePath(userId int, instanceId string, subPath string) (string, error) {
	var subdomain string
	err := db.DB.QueryRow("SELECT subdomain FROM instances WHERE id = ? AND user_id = ?", instanceId, userId).Scan(&subdomain)
	if err != nil {
		return "", fmt.Errorf("uygulama bulunamadı")
	}

	cwd, _ := os.Getwd()
	basePath := filepath.Join(cwd, "storage", fmt.Sprintf("kovan-%s", subdomain))
	
	// Temizle ve birleştir
	fullPath := filepath.Join(basePath, filepath.Clean("/"+subPath))

	// Path Traversal koruması: fullPath her zaman basePath ile başlamalı
	if !strings.HasPrefix(fullPath, basePath) {
		return "", fmt.Errorf("geçersiz dizin erişimi")
	}

	return fullPath, nil
}

func ListFiles(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("id")
	subPath := c.Query("path", ".")

	fullPath, err := getSafePath(userId, instanceId, subPath)
	if err != nil {
		return c.Status(403).JSON(fiber.Map{"error": err.Error()})
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Dizin okunamadı"})
	}

	var result []map[string]interface{}
	for _, entry := range entries {
		info, _ := entry.Info()
		result = append(result, map[string]interface{}{
			"name":  entry.Name(),
			"isDir": entry.IsDir(),
			"size":  info.Size(),
			"time":  info.ModTime().Format("2006-01-02 15:04"),
		})
	}

	return c.JSON(fiber.Map{"status": "success", "data": result})
}

func GetFileContent(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("id")
	filePath := c.Query("path")

	if filePath == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Dosya yolu gerekli"})
	}

	fullPath, err := getSafePath(userId, instanceId, filePath)
	if err != nil {
		return c.Status(403).JSON(fiber.Map{"error": err.Error()})
	}

	content, err := os.ReadFile(fullPath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Dosya okunamadı"})
	}

	return c.JSON(fiber.Map{"status": "success", "content": string(content)})
}

func SaveFileContent(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("id")
	
	type SaveRequest struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}

	var req SaveRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	fullPath, err := getSafePath(userId, instanceId, req.Path)
	if err != nil {
		return c.Status(403).JSON(fiber.Map{"error": err.Error()})
	}

	err = os.WriteFile(fullPath, []byte(req.Content), 0644)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Dosya kaydedilemedi"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "Dosya kaydedildi"})
}
