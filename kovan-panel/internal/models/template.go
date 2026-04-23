package models

// Template, müşterinin seçebileceği hazır uygulama kalıplarını temsil eder.
type Template struct {
	ID          string   `json:"id"`          // Örn: "php-apache"
	Name        string   `json:"name"`        // Örn: "PHP 8.2 + Apache"
	Description string   `json:"description"` // Kullanıcıya gösterilecek kısa açıklama
	Image       string   `json:"image"`       // Docker Hub imaj tag'i (Örn: php:8.2-apache)
	Ports       []int    `json:"ports"`       // İmajın varsayılan dinlediği portlar
	EnvVars     []string `json:"env_vars"`    // İmaj için gerekli varsayılan ortam değişkenleri
	Category    string   `json:"category"`    // Örn: "web", "database"
	MountPath   string   `json:"mount_path"`  // Örn: "/var/www/html"
}
