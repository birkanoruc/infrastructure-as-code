package backup

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"kovan-panel/internal/db"
	"kovan-panel/internal/utils"
)

// StartCron, arka planda periyodik yedekleme işlemini başlatır.
func StartCron() {
	log.Println("🕒 Otomatik yedekleme servisi başlatıldı (Her 12 saatte bir çalışacak).")
	
	ticker := time.NewTicker(12 * time.Hour)
	go func() {
		for {
			select {
			case <-ticker.C:
				runScheduledBackups()
			}
		}
	}()
}

func runScheduledBackups() {
	log.Println("🔄 Otomatik yedekleme işlemi başladı...")
	
	// Tüm aktif uygulamaları çek
	rows, err := db.DB.Query("SELECT id, subdomain FROM instances")
	if err != nil {
		log.Printf("❌ Yedekleme listesi çekilemedi: %v", err)
		return
	}
	defer rows.Close()

	cwd, _ := os.Getwd()

	for rows.Next() {
		var id int
		var subdomain string
		rows.Scan(&id, &subdomain)

		sourceDir := filepath.Join(cwd, "storage", fmt.Sprintf("kovan-%s", subdomain))
		backupsDir := filepath.Join(cwd, "storage", "backups", fmt.Sprintf("kovan-%s", subdomain))
		os.MkdirAll(backupsDir, 0755)

		timestamp := time.Now().Format("20060102-150405")
		filename := fmt.Sprintf("auto-backup-%s.zip", timestamp)
		targetPath := filepath.Join(backupsDir, filename)

		// Yedekle
		if err := utils.ZipSource(sourceDir, targetPath); err != nil {
			log.Printf("❌ [%s] otomatik yedekleme hatası: %v", subdomain, err)
			continue
		}

		// DB'ye kaydet
		fileInfo, _ := os.Stat(targetPath)
		db.DB.Exec("INSERT INTO backups (instance_id, filename, size) VALUES (?, ?, ?)", id, filename, fileInfo.Size())
		
		log.Printf("✅ [%s] otomatik yedeklendi.", subdomain)
	}
}
