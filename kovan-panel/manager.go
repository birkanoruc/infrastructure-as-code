package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// Caddy'nin anlayacağı JSON yapısını Go nesnelerine döküyoruz
type CaddyConfig struct {
	Admin Admin `json:"admin"`
	Apps  Apps  `json:"apps"`
}

type Admin struct {
	Listen string `json:"listen"`
}

type Apps struct {
	HTTP HTTP `json:"http"`
}

type HTTP struct {
	Servers map[string]Server `json:"servers"`
}

type Server struct {
	Listen []string `json:"listen"`
	Routes []Route  `json:"routes"`
}

type Route struct {
	Match  []Match  `json:"match"`
	Handle []Handle `json:"handle"`
}

type Match struct {
	Host []string `json:"host"`
}

type Handle struct {
	Handler   string     `json:"handler"`
	Upstreams []Upstream `json:"upstreams"`
}

type Upstream struct {
	Dial string `json:"dial"`
}

func main() {
	// İki müşterimiz olduğunu hayal edelim
	routes := []Route{
		createRoute("localhost", "9001"), // Mustafa
		createRoute("ahmet.local", "9002"), // Ahmet (Test için)
	}

	config := CaddyConfig{
		Admin: Admin{Listen: "0.0.0.0:2019"},
		Apps: Apps{
			HTTP: HTTP{
				Servers: map[string]Server{
					"srv0": {
						Listen: []string{":80"},
						Routes: routes,
					},
				},
			},
		},
	}

	// Go nesnesini JSON'a çevir (Marshal)
	jsonData, _ := json.MarshalIndent(config, "", "  ")

	// Caddy'ye gönder
	resp, err := http.Post("http://127.0.0.1:2019/load", "application/json", bytes.NewBuffer(jsonData))
	if err == nil && resp.StatusCode == 200 {
		fmt.Println("🚀 Çoklu müşteri rotası başarıyla güncellendi!")
		fmt.Printf("Şu an aktif rota sayısı: %d\n", len(routes))
	} else {
		fmt.Println("Hata oluştu.")
	}
}

// Yardımcı fonksiyon: Rota oluşturmayı kolaylaştırır
func createRoute(domain, port string) Route {
	return Route{
		Match: []Match{{Host: []string{domain}}},
		Handle: []Handle{{
			Handler:   "reverse_proxy",
			Upstreams: []Upstream{{Dial: "host.docker.internal:" + port}},
		}},
	}
}