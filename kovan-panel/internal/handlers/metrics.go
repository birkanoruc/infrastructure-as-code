package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/websocket/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
)

// WsMetrics WebSocket üzerinden her 3 saniyede bir çalışan uygulamaların metriklerini gönderir.
func WsMetrics(c *websocket.Conn) {
	userId := c.Locals("user_id").(int)
	for {
		// Veritabanından durumu "running" olan uygulamaları çek
		rows, err := db.DB.Query("SELECT id, subdomain FROM instances WHERE status = 'running' AND user_id = ?", userId)
		if err != nil {
			break
		}

		results := make(map[string]interface{})
		ctx := context.Background()

		for rows.Next() {
			var id int
			var subdomain string
			if err := rows.Scan(&id, &subdomain); err != nil {
				continue
			}
			
			containerName := fmt.Sprintf("kovan-%s", subdomain)
			stats, err := docker.GetContainerStats(ctx, containerName)
			if err == nil {
				// ID'yi string key olarak kullanıyoruz (JSON objesi için)
				results[fmt.Sprintf("%d", id)] = stats
			}
		}
		rows.Close()

		// Frontend'e JSON olarak fırlatıyoruz
		if err := c.WriteJSON(results); err != nil {
			// Bağlantı koptuysa veya hata varsa döngüyü kırıp WebSocket'i kapat
			break
		}

		// 3 saniyede bir güncelle
		time.Sleep(3 * time.Second)
	}
}
