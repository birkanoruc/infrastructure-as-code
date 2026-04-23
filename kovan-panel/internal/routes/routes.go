package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"kovan-panel/internal/handlers"
	"kovan-panel/internal/middleware"
)

// SetupRoutes tüm API rotalarını tanımlar
func SetupRoutes(app *fiber.App) {
	// WebSocket bağlantıları için middleware
	app.Use("/ws", middleware.WsAuthRequired)

	// WebSocket Uç Noktaları
	app.Get("/ws/metrics", websocket.New(handlers.WsMetrics))
	app.Get("/ws/terminal/:id", websocket.New(handlers.WsTerminal))

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// Sağlık kontrolü ve Public Rotalar
	api.Get("/health", handlers.HealthCheck)
	api.Get("/templates", handlers.GetTemplates)

	// Uygulama (Instance) Yönetimi (SADECE GİRİŞ YAPANLAR)
	instances := api.Group("/instances", middleware.AuthRequired)
	instances.Get("/", handlers.ListInstances)
	instances.Post("/", handlers.CreateInstance)

	// Dosya Yönetimi
	instances.Get("/:id/files", handlers.ListFiles)
	instances.Get("/:id/files/content", handlers.GetFileContent)
	instances.Post("/:id/files/content", handlers.SaveFileContent)
	instances.Post("/:id/redeploy", handlers.GitPullAndRedeploy)
}
