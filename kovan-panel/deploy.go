package main

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

func main() {
	// Ayarlar
	customerName := "mustafa" // Bunu yarın bir gün API'den alacaksın
	customerPort := "9001"    // Bunu otomatiğe bağlayacağız ama şimdilik sabit verelim
	domain := "127.0.0.1"

	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		panic(err)
	}

	// 1. Konteyneri Oluştur ve Başlat
	fmt.Printf("📦 %s için konteyner hazırlanıyor...\n", customerName)
	
	containerName := fmt.Sprintf("kovan-%s", customerName)
	
	// Önce varsa eskiyi silelim (temizlik)
	cli.ContainerRemove(ctx, containerName, container.RemoveOptions{Force: true})

	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "nginx:alpine",
	}, &container.HostConfig{
		PortBindings: nat.PortMap{
			"80/tcp": []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: customerPort}},
		},
	}, nil, nil, containerName)

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		panic(err)
	}

	// 2. Caddy'yi Güncelle (Kısa bir bekleme ekleyelim ki konteyner tam otursun)
	// 2. Caddy'yi Güncelle (Sadece Rotaları Değiştiriyoruz)
	time.Sleep(1 * time.Second)
	fmt.Println("🚦 Rota güncelleniyor...")

caddyPayload := fmt.Sprintf(`{
		"admin": {
			"listen": "0.0.0.0:2019"
		},
		"apps": {
			"http": {
				"servers": {
					"srv0": {
						"listen": [":80"],
						"routes": [
							{
								"match": [{"host": ["%s"]}],
								"handle": [{
									"handler": "reverse_proxy",
									"upstreams": [{"dial": "host.docker.internal:%s"}]
								}]
							}
						]
					}
				}
			}
		}
	}`, domain, customerPort)

	// URL'yi tekrar ana yükleme noktasına çekiyoruz
	caddyURL := "http://127.0.0.1:2019/load"

	req, err := http.NewRequest("POST", caddyURL, bytes.NewBuffer([]byte(caddyPayload)))
	if err != nil {
		fmt.Printf("Request hatası: %v\n", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	caddyResp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("Caddy'ye ulaşılamadı: %v\n", err)
		return
	}
	defer caddyResp.Body.Close()

	if caddyResp.StatusCode >= 200 && caddyResp.StatusCode < 300 {
		fmt.Printf("✅ %s başarıyla yayında! Port: %s\n", customerName, customerPort)
	} else {
		fmt.Printf("Caddy reddetti: %d\n", caddyResp.StatusCode)
	}
}