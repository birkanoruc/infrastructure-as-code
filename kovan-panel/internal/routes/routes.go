package routes

import (
	"github.com/gofiber/fiber/v2"
	"kovan-panel/internal/handlers"
)

// SetupRoutes tüm API rotalarını tanımlar
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Sağlık kontrolü
	api.Get("/health", handlers.HealthCheck)

	// Katalog (İmaj Şablonları)
	api.Get("/templates", handlers.GetTemplates)

	// Uygulama (Instance) Yönetimi
	instances := api.Group("/instances")
	instances.Get("/", handlers.ListInstances)
	instances.Post("/", handlers.CreateInstance)
}
