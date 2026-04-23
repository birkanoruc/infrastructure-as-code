package proxy

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"kovan-panel/internal/db"
)

// Caddy'nin anlayacağı JSON yapısı
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
	Host     []string  `json:"host,omitempty"`
	RemoteIP *RemoteIP `json:"remote_ip,omitempty"`
}
type RemoteIP struct {
	Ranges []string `json:"ranges"`
}
type Handle struct {
	Handler    string     `json:"handler"`
	Upstreams  []Upstream `json:"upstreams,omitempty"`
	StatusCode int        `json:"status_code,omitempty"`
}
type Upstream struct {
	Dial string `json:"dial"`
}

// SyncRoutes, veritabanındaki tüm çalışan siteleri bulur ve Caddy'ye anlık yükler.
func SyncRoutes() error {
	rows, err := db.DB.Query("SELECT subdomain, custom_domain, port, allowed_ips FROM instances WHERE status = 'running'")
	if err != nil {
		return fmt.Errorf("veritabanı okuma hatası: %v", err)
	}
	defer rows.Close()

	var routes []Route
	count := 0

	for rows.Next() {
		var subdomain string
		var customDomain sql.NullString
		var port int
		var allowedIpsStr sql.NullString
		
		if err := rows.Scan(&subdomain, &customDomain, &port, &allowedIpsStr); err != nil {
			continue
		}

		domain := fmt.Sprintf("%s.kovan.local", subdomain)
		hosts := []string{domain}
		if customDomain.Valid && customDomain.String != "" {
			hosts = append(hosts, customDomain.String)
		}
		
		upstream := fmt.Sprintf("host.docker.internal:%d", port)

		// Firewall Mantığı
		var allowedIps []string
		if allowedIpsStr.Valid && allowedIpsStr.String != "" {
			json.Unmarshal([]byte(allowedIpsStr.String), &allowedIps)
		}

		if len(allowedIps) > 0 {
			// Sadece belirli IP'lere izin ver
			routes = append(routes, Route{
				Match: []Match{{
					Host:     hosts,
					RemoteIP: &RemoteIP{Ranges: allowedIps},
				}},
				Handle: []Handle{{
					Handler:   "reverse_proxy",
					Upstreams: []Upstream{{Dial: upstream}},
				}},
			})
			// Diğer her şeyi engelle
			routes = append(routes, Route{
				Match: []Match{{Host: hosts}},
				Handle: []Handle{{
					Handler:    "static_response",
					StatusCode: 403,
				}},
			})
		} else {
			// Herkese açık
			routes = append(routes, Route{
				Match: []Match{{Host: hosts}},
				Handle: []Handle{{
					Handler:   "reverse_proxy",
					Upstreams: []Upstream{{Dial: upstream}},
				}},
			})
		}
		count++
	}

	config := CaddyConfig{
		Admin: Admin{Listen: "0.0.0.0:2019"},
		Apps: Apps{
			HTTP: HTTP{
				Servers: map[string]Server{
					"srv0": {
						// Caddy'nin hem 80 hem 443 portlarını dinlemesi (Otomatik SSL için gerekli)
						Listen: []string{":80", ":443"},
						Routes: routes,
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(config)
	if err != nil {
		return err
	}

	// Caddy'nin Admin API'sine yapılandırmayı gönder
	resp, err := http.Post("http://127.0.0.1:2019/load", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("caddy API'sine ulaşılamadı: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("🚦 Caddy güncellendi! Aktif rota sayısı: %d\n", count)
		return nil
	}

	return fmt.Errorf("caddy reddetti, status: %d", resp.StatusCode)
}
