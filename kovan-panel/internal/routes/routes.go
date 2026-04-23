package routes

import (
	"fmt"
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
	app.Get("/ws/logs/:id", websocket.New(handlers.WsLogs))

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// Sağlık kontrolü ve Public Rotalar
	api.Get("/health", handlers.HealthCheck)
	api.Get("/templates", handlers.GetTemplates)
	api.Get("/networking", middleware.AuthRequired, handlers.GetNetworkStatus)

	// Uygulama (Instance) Yönetimi (SADECE GİRİŞ YAPANLAR)
	instances := api.Group("/instances", middleware.AuthRequired)
	instances.Get("/", handlers.ListInstances)
	instances.Get("/:id/logs", handlers.GetInstanceLogs)
	instances.Post("/", handlers.CreateInstance)

	// Dosya Yönetimi
	instances.Get("/:id/files", handlers.ListFiles)
	instances.Get("/:id/files/content", handlers.GetFileContent)
	instances.Post("/:id/files/content", handlers.SaveFileContent)
	instances.Post("/:id/redeploy", handlers.GitPullAndRedeploy)
	instances.Post("/:id/firewall", handlers.UpdateFirewall)

	// API Key Yönetimi (v3 Step 6)
	keys := api.Group("/keys", middleware.AuthRequired)
	keys.Get("/", handlers.ListAPIKeys)
	keys.Post("/", handlers.CreateAPIKey)
	keys.Delete("/:id", handlers.DeleteAPIKey)

	// Webhook Yönetimi (v3 Step 6)
	webhooks := api.Group("/webhooks", middleware.AuthRequired)
	webhooks.Get("/", handlers.ListWebhooks)
	webhooks.Post("/", handlers.CreateWebhook)
	webhooks.Delete("/:id", handlers.DeleteWebhook)

	// S3 Ayarları (v3 Step 4)
	s3 := api.Group("/s3", middleware.AuthRequired)
	s3.Get("/", handlers.GetS3Settings)
	s3.Post("/", handlers.UpdateS3Settings)

	// Yedekleme Rotaları (Top-level routes to definitely avoid 404)
	app.Post("/api/instances/:instId/backups/:backupId/restore", middleware.AuthRequired, handlers.RestoreBackup)
	app.Get("/api/instances/:instId/backups", middleware.AuthRequired, handlers.ListBackups)
	app.Post("/api/instances/:instId/backups", middleware.AuthRequired, handlers.CreateBackup)

	// Debug: Kayıtlı rotaları listele
	for _, route := range app.Stack() {
		for _, r := range route {
			fmt.Printf("Mapped: %s %s\n", r.Method, r.Path)
		}
	}
}
