package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
	"kovan-panel/internal/routes"
)

func main() {
	// Veritabanını başlat
	db.InitDB()

	// Docker istemcisini başlat
	if err := docker.InitDocker(); err != nil {
		log.Fatalf("Docker başlatılamadı: %v", err)
	}
	log.Println("🐳 Docker SDK başarıyla bağlandı.")

	// Fiber uygulamasını başlat
	app := fiber.New(fiber.Config{
		AppName: "Kovan Panel API v1",
	})

	// Middleware'leri ekle
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // İleride sadece Next.js adresine izin vereceğiz
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	// Rotaları ayarla
	routes.SetupRoutes(app)

	// Sunucuyu başlat
	log.Println("🚀 Sunucu 3000 portunda başlatılıyor...")
	if err := app.Listen(":3000"); err != nil {
		log.Fatalf("Sunucu başlatılamadı: %v", err)
	}
}
