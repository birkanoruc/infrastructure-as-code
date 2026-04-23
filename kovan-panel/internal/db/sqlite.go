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
		custom_domain TEXT DEFAULT '',
		image_tag TEXT NOT NULL,
		port INTEGER UNIQUE NOT NULL,
		status TEXT DEFAULT 'stopped',
		env_vars TEXT,
		git_url TEXT DEFAULT '',
		user_id INTEGER DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := DB.Exec(schema)
	if err != nil {
		log.Fatalf("❌ Tablolar oluşturulamadı: %v", err)
	}

	// Users Tablosu
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		token TEXT UNIQUE NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	DB.Exec(createUsersTable)

	// Basit Migration: Önceden tablo varsa custom_domain ve user_id ekle (hata verirse yoksay)
	DB.Exec("ALTER TABLE instances ADD COLUMN custom_domain TEXT DEFAULT '';")
	DB.Exec("ALTER TABLE instances ADD COLUMN user_id INTEGER DEFAULT 1;")
	DB.Exec("ALTER TABLE instances ADD COLUMN git_url TEXT DEFAULT '';")

	log.Println("✅ Veritabanı (SQLite) başarıyla başlatıldı ve tablolar hazır.")
}
