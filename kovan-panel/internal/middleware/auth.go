package middleware

import (
	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
	"strings"
)

// AuthRequired, API uç noktalarını koruyan Bearer token tabanlı basit bir middleware'dir.
func AuthRequired(c *fiber.Ctx) error {
	// 1. Önce API Key kontrolü (Step 6 DX)
	apiKey := c.Get("X-API-Key")
	if apiKey != "" {
		var userId int
		err := db.DB.QueryRow("SELECT user_id FROM api_keys WHERE key = ?", apiKey).Scan(&userId)
		if err == nil {
			c.Locals("user_id", userId)
			return c.Next()
		}
	}

	// 2. Token Kontrolü (Geleneksel Giriş)
	authHeader := c.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return c.Status(401).JSON(fiber.Map{"error": "Yetkisiz erişim. Lütfen giriş yapın veya API Key kullanın."})
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	var userId int
	err := db.DB.QueryRow("SELECT id FROM users WHERE token = ?", token).Scan(&userId)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Geçersiz veya süresi dolmuş token."})
	}

	// Kullanıcı ID'sini sonraki işlemlerde kullanılmak üzere sakla
	c.Locals("user_id", userId)
	return c.Next()
}

// WsAuthRequired, WebSocket bağlantılarını Query parametresi üzerinden doğrular.
func WsAuthRequired(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return c.Status(401).SendString("Token gerekli")
	}

	var userId int
	err := db.DB.QueryRow("SELECT id FROM users WHERE token = ?", token).Scan(&userId)
	if err != nil {
		return c.Status(401).SendString("Geçersiz token")
	}

	c.Locals("user_id", userId)
	return c.Next()
}
