package utils

import (
	"fmt"
	"kovan-panel/internal/db"
)

// GetAvailablePort, veritabanına bakarak çakışmayan boş bir port atar.
// Örneğin başlangıç portunu 8000 alıyoruz ve 9000'e kadar tarıyoruz.
func GetAvailablePort() (int, error) {
	startPort := 8000
	maxPort := 9000

	for p := startPort; p <= maxPort; p++ {
		var exists bool
		query := `SELECT EXISTS(SELECT 1 FROM instances WHERE port=? LIMIT 1)`
		err := db.DB.QueryRow(query, p).Scan(&exists)
		if err != nil {
			return 0, err
		}

		if !exists {
			return p, nil
		}
	}

	return 0, fmt.Errorf("boş port bulunamadı (Tüm portlar dolu)")
}
