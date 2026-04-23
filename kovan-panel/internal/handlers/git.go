package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
	"kovan-panel/internal/utils"
)

func GitPullAndRedeploy(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("id")

	// 1. Instance bilgilerini al
	var name, subdomain, image, port, containerPort, targetPath, envVarsStr string
	var cpuLimit float64
	var memoryLimit int64
	err := db.DB.QueryRow(`
		SELECT name, subdomain, image, port, container_port, target_path, cpu_limit, memory_limit, env_vars 
		FROM instances WHERE id = ? AND user_id = ?`, 
		instanceId, userId).Scan(&name, &subdomain, &image, &port, &containerPort, &targetPath, &cpuLimit, &memoryLimit, &envVarsStr)
	
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

	// 3. Konteyneri Yeniden Başlat
	ctx := context.Background()
	containerName := fmt.Sprintf("kovan-%s", subdomain)
	networkName := fmt.Sprintf("kovan-user-%d", userId)

	docker.EnsureNetworkExists(ctx, networkName)

	var envVars []string
	json.Unmarshal([]byte(envVarsStr), &envVars)

	docker.StopAndRemoveContainer(ctx, containerName)
	_, err = docker.CreateAndStartContainer(ctx, containerName, image, port, containerPort, hostPath, targetPath, cpuLimit, memoryLimit, envVars, networkName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Yeniden başlatma hatası: " + err.Error()})
	}

	// Webhook Tetikle (v3 Step 6)
	utils.TriggerWebhook(userId, "deploy.success", name, fiber.Map{
		"subdomain": subdomain,
		"method":    "git-pull",
	})

	return c.JSON(fiber.Map{"status": "success", "message": "Uygulama başarıyla güncellendi ve yeniden başlatıldı"})
}
