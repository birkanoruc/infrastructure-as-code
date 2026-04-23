package handlers

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
)

func GitPullAndRedeploy(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("id")

	// 1. Instance bilgilerini al
	var name, subdomain, imageTag, port string
	err := db.DB.QueryRow("SELECT name, subdomain, image_tag, port FROM instances WHERE id = ? AND user_id = ?", instanceId, userId).Scan(&name, &subdomain, &imageTag, &port)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Uygulama bulunamadı"})
	}

	cwd, _ := os.Getwd()
	hostPath := filepath.Join(cwd, "storage", fmt.Sprintf("kovan-%s", subdomain))

	// 2. Git Pull işlemini gerçekleştir
	if _, err := os.Stat(filepath.Join(hostPath, ".git")); err == nil {
		cmd := exec.Command("git", "pull")
		cmd.Dir = hostPath
		if err := cmd.Run(); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Git pull hatası: " + err.Error()})
		}
	} else {
		return c.Status(400).JSON(fiber.Map{"error": "Bu uygulama Git ile kurulmamış"})
	}

	// 3. Konteyneri Yeniden Başlat (Kodun güncellenmesi için mount zaten var ama restart iyidir)
	ctx := context.Background()
	containerName := fmt.Sprintf("kovan-%s", subdomain)
	
	// Template verisini bul (mount_path için)
	tpl := GetTemplateByID(imageTag) // Bu fonksiyon instance.go içinde public olmalı veya burada tekrar tanımlanmalı
	if tpl == nil {
		return c.Status(500).JSON(fiber.Map{"error": "Template bulunamadı"})
	}
	targetPath := tpl["mount_path"].(string)
	containerPort := tpl["port"].(string)

	// Durdur ve Yeniden Başlat
	docker.StopContainer(ctx, containerName)
	_, err = docker.CreateAndStartContainer(ctx, containerName, tpl["image"].(string), port, containerPort, hostPath, targetPath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Yeniden başlatma hatası: " + err.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "Uygulama başarıyla güncellendi ve yeniden başlatıldı"})
}
