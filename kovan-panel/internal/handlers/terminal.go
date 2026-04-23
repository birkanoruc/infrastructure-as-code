package handlers

import (
	"context"
	"fmt"
	"io"

	"github.com/gofiber/websocket/v2"
	"kovan-panel/internal/db"
	"kovan-panel/internal/docker"
)

// WsTerminal, tarayıcıdan gelen tuş vuruşlarını Docker'a, Docker çıktılarını ise tarayıcıya aktarır.
func WsTerminal(c *websocket.Conn) {
	userId := c.Locals("user_id").(int)
	id := c.Params("id") // instance id
	
	// Veritabanından subdomain'i bul
	var subdomain string
	err := db.DB.QueryRow("SELECT subdomain FROM instances WHERE id = ? AND status = 'running' AND user_id = ?", id, userId).Scan(&subdomain)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte("Hata: Uygulama bulunamadı veya çalışmıyor.\r\n"))
		c.Close()
		return
	}

	containerName := fmt.Sprintf("kovan-%s", subdomain)
	ctx := context.Background()

	// Docker Terminal bağlantısı (soketi) al
	hijackedResp, err := docker.AttachTerminal(ctx, containerName)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("Terminal bağlantı hatası: %v\r\n", err)))
		c.Close()
		return
	}
	defer hijackedResp.Close()

	// Goroutine: Docker -> WebSocket (Terminal çıktısını alıp tarayıcıya gönderir)
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := hijackedResp.Reader.Read(buf)
			if err != nil {
				if err != io.EOF {
					c.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("\r\n[Bağlantı Koptu: %v]\r\n", err)))
				} else {
					c.WriteMessage(websocket.TextMessage, []byte("\r\n[Oturum Kapatıldı]\r\n"))
				}
				c.Close()
				return
			}
			if n > 0 {
				c.WriteMessage(websocket.TextMessage, buf[:n])
			}
		}
	}()

	// Ana Döngü: WebSocket -> Docker (Klavye girdilerini tarayıcıdan alıp Docker'a yazar)
	for {
		messageType, msg, err := c.ReadMessage()
		if err != nil {
			break // WebSocket bağlantısı kesildi (Kullanıcı sayfayı kapattı vb.)
		}
		
		// Gelen klavye vuruşunu doğrudan Docker shell'ine yaz
		if messageType == websocket.TextMessage || messageType == websocket.BinaryMessage {
			hijackedResp.Conn.Write(msg)
		}
	}
}
