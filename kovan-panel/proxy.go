package main

import (
	"bytes"
	"fmt"
	"net/http"
)

func main() {
	// Caddy'ye gönderilecek "Yönlendirme Emri"
	var caddyConfig = `{
		"apps": {
			"http": {
				"servers": {
					"srv0": {
						"listen": [":80"],
						"routes": [
							{
								"match": [{"host": ["127.0.0.1"]}],
								"handle": [
									{
										"handler": "reverse_proxy",
										"upstreams": [{"dial": "host.docker.internal:8081"}]
									}
								]
							}
						]
					}
				}
			}
		}
	}`

	// Caddy Admin API'sine (127.0.0.1:2019) gönderiyoruz
	resp, err := http.Post("http://127.0.0.1:2019/load", "application/json", bytes.NewBuffer([]byte(caddyConfig)))
	if err != nil {
		fmt.Printf("Go Hatası: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		fmt.Println("🚀 Başardık! Caddy'nin beynini Go ile uzaktan güncelledik.")
		fmt.Println("Şimdi tarayıcında http://127.0.0.1 adresini yenile.")
	} else {
		fmt.Printf("Caddy kabul etmedi. Hata Kodu: %d\n", resp.StatusCode)
	}
}