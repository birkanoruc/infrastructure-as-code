package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"

	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/db"
)

type AuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Şifreleri güvenli tutmak için basit bir SHA-256 hash fonksiyonu
// (Normalde bcrypt kullanılır ancak harici paket gereksinimini azaltmak için sha256 seçildi)
func hashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password + "kovan_gizli_tuz")) // Basit bir salt
	return hex.EncodeToString(h.Sum(nil))
}

func generateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func Register(c *fiber.Ctx) error {
	var req AuthRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	if req.Username == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Kullanıcı adı ve şifre zorunludur"})
	}

	hashedPassword := hashPassword(req.Password)
	token := generateToken()

	_, err := db.DB.Exec("INSERT INTO users (username, password, token) VALUES (?, ?, ?)", req.Username, hashedPassword, token)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Bu kullanıcı adı zaten alınmış"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"message": "Kayıt başarılı",
		"token": token,
	})
}

func Login(c *fiber.Ctx) error {
	var req AuthRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Geçersiz istek"})
	}

	hashedPassword := hashPassword(req.Password)

	var token string
	err := db.DB.QueryRow("SELECT token FROM users WHERE username = ? AND password = ?", req.Username, hashedPassword).Scan(&token)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Hatalı kullanıcı adı veya şifre"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"message": "Giriş başarılı",
		"token": token,
	})
}
