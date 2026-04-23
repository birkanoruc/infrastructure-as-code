package db

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

// Global veritabanı değişkenimiz
var DB *sql.DB

// InitDB veritabanı bağlantısını sağlar ve tabloları oluşturur.
func InitDB() {
	var err error
	DB, err = sql.Open("sqlite3", "./kovan.db")
	if err != nil {
		log.Fatalf("❌ Veritabanı açılamadı: %v", err)
	}

	createTables()
}

func createTables() {
	schema := `
	CREATE TABLE IF NOT EXISTS instances (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		subdomain TEXT UNIQUE NOT NULL,
		image_tag TEXT NOT NULL,
		port INTEGER UNIQUE NOT NULL,
		status TEXT DEFAULT 'stopped',
		env_vars TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := DB.Exec(schema)
	if err != nil {
		log.Fatalf("❌ Tablolar oluşturulamadı: %v", err)
	}
	log.Println("✅ Veritabanı (SQLite) başarıyla başlatıldı ve tablolar hazır.")
}
