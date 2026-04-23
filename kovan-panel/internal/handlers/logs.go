package handlers

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/gofiber/websocket/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
)

// WsLogs, Docker loglarını WebSocket üzerinden istemciye akıtır.
func WsLogs(c *websocket.Conn) {
	userId := c.Locals("user_id").(int)
	id := c.Params("id") // instance id
	
	var subdomain string
	err := db.DB.QueryRow("SELECT subdomain FROM instances WHERE id = ? AND user_id = ?", id, userId).Scan(&subdomain)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte("Hata: Uygulama bulunamadı.\n"))
		c.Close()
		return
	}

	containerName := fmt.Sprintf("kovan-%s", subdomain)
	ctx := context.Background()

	// Docker Logs Stream'i al
	logStream, err := docker.StreamLogs(ctx, containerName)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("Log bağlantı hatası: %v\n", err)))
		c.Close()
		return
	}
	defer logStream.Close()

	// WebSocket'ten gelen mesajları (veya pingleri) dinle (bağlantının canlı kalması için)
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, err := c.ReadMessage(); err != nil {
				logStream.Close()
				break
			}
		}
	}()

	// Heartbeat (Ping) döngüsü
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				if err := c.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			}
		}
	}()

	// Docker loglarını oku ve WebSocket'e yaz
	for {
		header := make([]byte, 8)
		_, err := io.ReadFull(logStream, header)
		if err != nil {
			if err != io.EOF {
				c.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("\n[Log Hatası: %v]\n", err)))
			}
			break
		}

		// Header'ın son 4 byte'ı payload uzunluğunu belirtir (BigEndian)
		count := uint32(header[4])<<24 | uint32(header[5])<<16 | uint32(header[6])<<8 | uint32(header[7])
		payload := make([]byte, count)
		_, err = io.ReadFull(logStream, payload)
		if err != nil {
			break
		}

		if err := c.WriteMessage(websocket.TextMessage, payload); err != nil {
			break
		}
	}
}
