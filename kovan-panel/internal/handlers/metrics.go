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
	
	// Bağlantı ayarları: Pong mesajlarını dinle ve deadline'ı güncelle
	c.SetReadLimit(1024) // Metrikler için büyük veriye gerek yok
	
	done := make(chan struct{})
	
	// Read Loop ( detect disconnects & handle pings)
	go func() {
		defer close(done)
		for {
			// İstemciden gelen mesajları oku (Ping/Pong için gerekli)
			if _, _, err := c.ReadMessage(); err != nil {
				return
			}
		}
	}()

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()
	
	heartbeat := time.NewTicker(20 * time.Second)
	defer heartbeat.Stop()
	
	for {
		select {
		case <-done:
			return
		case <-heartbeat.C:
			// Bağlantıyı canlı tutmak için Ping gönder
			c.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := c.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		case <-ticker.C:
			// Veritabanından durumu "running" olan uygulamaları çek
			rows, err := db.DB.Query("SELECT id, subdomain FROM instances WHERE status = 'running' AND user_id = ?", userId)
			if err != nil {
				continue
			}

			results := make(map[string]interface{})
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)

			for rows.Next() {
				var id int
				var subdomain string
				if err := rows.Scan(&id, &subdomain); err != nil {
					continue
				}
				
				containerName := fmt.Sprintf("kovan-%s", subdomain)
				stats, err := docker.GetContainerStats(ctx, containerName)
				if err == nil {
					results[fmt.Sprintf("%d", id)] = stats
				}
			}
			rows.Close()
			cancel()

			// Yazma işlemi için kısa bir deadline koy
			c.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := c.WriteJSON(results); err != nil {
				return
			}
		}
	}
}
