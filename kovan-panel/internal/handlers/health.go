package handlers

import "github.com/gofiber/fiber/v2"

// HealthCheck apinin ayakta olup olmadığını test etmek için kullanılır.
func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Kovan Panel API is running smoothly! 🚀",
	})
}
