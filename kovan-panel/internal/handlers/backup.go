package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
	"kovan-panel/internal/utils"
)

// CreateBackup, uygulamanın volume içeriğini zippeyerek yedek alır.
func CreateBackup(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("instId")

	var subdomain string
	err := db.DB.QueryRow("SELECT subdomain FROM instances WHERE id = ? AND user_id = ?", instanceId, userId).Scan(&subdomain)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Uygulama bulunamadı."})
	}

	cwd, _ := os.Getwd()
	sourceDir := filepath.Join(cwd, "storage", fmt.Sprintf("kovan-%s", subdomain))
	
	// Yedekler klasörünü oluştur
	backupsDir := filepath.Join(cwd, "storage", "backups", fmt.Sprintf("kovan-%s", subdomain))
	os.MkdirAll(backupsDir, 0755)

	timestamp := time.Now().Format("20060102-150405")
	filename := fmt.Sprintf("backup-%s.zip", timestamp)
	targetPath := filepath.Join(backupsDir, filename)

	// Sıkıştır
	if err := utils.ZipSource(sourceDir, targetPath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Yedekleme hatası: " + err.Error()})
	}

	// Dosya boyutunu al
	fileInfo, _ := os.Stat(targetPath)
	size := fileInfo.Size()

	// DB'ye kaydet
	_, err = db.DB.Exec("INSERT INTO backups (instance_id, filename, size) VALUES (?, ?, ?)", instanceId, filename, size)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Veritabanı kayıt hatası: " + err.Error()})
	}

	// 3. S3'e Yükle (v3 Step 4 - Remote Storage)
	go func() {
		absPath, _ := filepath.Abs(targetPath)
		if err := utils.UploadToS3(userId, absPath); err != nil {
			fmt.Printf("⚠️ S3 Yedekleme Hatası: %v\n", err)
		} else {
			fmt.Printf("✅ Yedek S3'e başarıyla yüklendi: %s\n", filename)
		}
	}()

	return c.JSON(fiber.Map{
		"status":   "success",
		"message":  "Yedekleme başarıyla tamamlandı.",
		"filename": filename,
	})
}

// ListBackups, bir uygulamaya ait yedekleri listeler.
func ListBackups(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("instId")

	// Güvenlik kontrolü
	var exists int
	db.DB.QueryRow("SELECT COUNT(*) FROM instances WHERE id = ? AND user_id = ?", instanceId, userId).Scan(&exists)
	if exists == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Uygulama bulunamadı."})
	}

	rows, err := db.DB.Query("SELECT id, filename, size, created_at FROM backups WHERE instance_id = ? ORDER BY created_at DESC", instanceId)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Yedekler listelenemedi."})
	}
	defer rows.Close()

	var backups []fiber.Map
	for rows.Next() {
		var id int
		var filename string
		var size int64
		var createdAt string
		rows.Scan(&id, &filename, &size, &createdAt)
		backups = append(backups, fiber.Map{
			"id": id,
			"filename": filename,
			"size": size,
			"created_at": createdAt,
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": backups,
	})
}

// RestoreBackup, uygulamayı seçilen yedeğe döndürür.
func RestoreBackup(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	instanceId := c.Params("instId")
	backupId := c.Params("backupId")

	var filename, subdomain, image, port, containerPort, hostPath, targetPath, envVarsStr string
	var cpuLimit float64
	var memoryLimit int64

	fmt.Printf("🔍 Restore Denemesi -> User: %d, Instance: %s, Backup: %s\n", userId, instanceId, backupId)

	err := db.DB.QueryRow(`
		SELECT b.filename, i.subdomain, i.image, i.port, i.container_port, i.host_path, i.target_path, i.cpu_limit, i.memory_limit, i.env_vars
		FROM backups b 
		JOIN instances i ON b.instance_id = i.id 
		WHERE b.id = ? AND i.id = ? AND i.user_id = ?`, 
		backupId, instanceId, userId).Scan(&filename, &subdomain, &image, &port, &containerPort, &hostPath, &targetPath, &cpuLimit, &memoryLimit, &envVarsStr)
	
	if err != nil {
		fmt.Printf("❌ Restore DB Hatası: %v\n", err)
		return c.Status(404).JSON(fiber.Map{"error": "Yedek veya uygulama veritabanında bulunamadı. Detay: " + err.Error()})
	}

	cwd, _ := os.Getwd()
	backupPath := filepath.Join(cwd, "storage", "backups", fmt.Sprintf("kovan-%s", subdomain), filename)
	targetDir := filepath.Join(cwd, "storage", fmt.Sprintf("kovan-%s", subdomain))

	// 2. Dosya Yerelde Yoksa S3'ten İndir (v3 Step 4)
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		fmt.Printf("☁️ Yedek yerelde bulunamadı, S3'ten indiriliyor: %s\n", filename)
		backupsDir := filepath.Dir(backupPath)
		os.MkdirAll(backupsDir, 0755)
		if err := utils.DownloadFromS3(userId, filename, backupsDir); err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Yedek dosyası yerelde veya S3'te bulunamadı."})
		}
	}

	// 3. Konteyneri Durdur ve Sil
	containerName := fmt.Sprintf("kovan-%s", subdomain)
	docker.StopAndRemoveContainer(c.Context(), containerName)

	// 4. Mevcut Verileri Temizle ve Yedeği Aç
	os.RemoveAll(targetDir)
	os.MkdirAll(targetDir, 0755)
	
	// Unzip işlemi
	if err := utils.Unzip(backupPath, filepath.Dir(targetDir)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Geri yükleme hatası: " + err.Error()})
	}

	// 4. Konteyneri Orijinal Konfigürasyonla Yeniden Başlat
	var envVars []string
	json.Unmarshal([]byte(envVarsStr), &envVars)

	networkName := fmt.Sprintf("kovan-user-%d", userId)
	docker.EnsureNetworkExists(c.Context(), networkName)

	_, err = docker.CreateAndStartContainer(c.Context(), containerName, image, port, containerPort, hostPath, targetPath, cpuLimit, memoryLimit, envVars, networkName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Uygulama başlatılamadı: " + err.Error()})
	}
	
	return c.JSON(fiber.Map{
		"status": "success",
		"message": "Uygulama başarıyla yedeğe döndürüldü ve başlatıldı.",
	})
}
