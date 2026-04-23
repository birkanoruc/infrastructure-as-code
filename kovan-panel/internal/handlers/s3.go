package handlers

import (
	"kovan-panel/internal/db"
	"github.com/gofiber/fiber/v2"
)

type S3SettingsRequest struct {
	Endpoint  string `json:"endpoint"`
	AccessKey string `json:"access_key"`
	SecretKey string `json:"secret_key"`
	Bucket    string `json:"bucket"`
	Region    string `json:"region"`
	IsActive  bool   `json:"is_active"`
}

func UpdateS3Settings(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	var req S3SettingsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	activeInt := 0
	if req.IsActive {
		activeInt = 1
	}

	// Eğer şifre maskeli gelmişse (********), eski şifreyi koru
	if req.SecretKey == "********" {
		_, err := db.DB.Exec(`
			UPDATE s3_settings SET 
				endpoint=?, access_key=?, bucket=?, region=?, is_active=?
			WHERE user_id=?`,
			req.Endpoint, req.AccessKey, req.Bucket, req.Region, activeInt, userId)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "S3 ayarları güncellenemedi"})
		}
	} else {
		_, err := db.DB.Exec(`
			INSERT INTO s3_settings (user_id, endpoint, access_key, secret_key, bucket, region, is_active)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(user_id) DO UPDATE SET
				endpoint=excluded.endpoint,
				access_key=excluded.access_key,
				secret_key=excluded.secret_key,
				bucket=excluded.bucket,
				region=excluded.region,
				is_active=excluded.is_active`,
			userId, req.Endpoint, req.AccessKey, req.SecretKey, req.Bucket, req.Region, activeInt)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "S3 ayarları kaydedilemedi"})
		}
	}

	return c.JSON(fiber.Map{"status": "success", "message": "S3 ayarları güncellendi"})
}

func GetS3Settings(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	var endpoint, accessKey, secretKey, bucket, region string
	var isActive int

	err := db.DB.QueryRow("SELECT endpoint, access_key, secret_key, bucket, region, is_active FROM s3_settings WHERE user_id = ?", userId).
		Scan(&endpoint, &accessKey, &secretKey, &bucket, &region, &isActive)

	if err != nil {
		return c.JSON(fiber.Map{"status": "success", "data": nil})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"endpoint":   endpoint,
			"access_key": accessKey,
			"secret_key": "********", // Güvenlik için gizle
			"bucket":     bucket,
			"region":     region,
			"is_active":  isActive == 1,
		},
	})
}
