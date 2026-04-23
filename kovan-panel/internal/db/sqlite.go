package db

import (
	"database/sql"
	"fmt"
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
		custom_domain TEXT,
		image TEXT,
		port TEXT,
		container_port TEXT,
		host_path TEXT,
		target_path TEXT,
		cpu_limit REAL,
		memory_limit INTEGER,
		env_vars TEXT,
		status TEXT DEFAULT 'running',
		image_tag TEXT NOT NULL,
		port INTEGER UNIQUE NOT NULL,
		git_url TEXT DEFAULT '',
		memory_limit INTEGER DEFAULT 0,
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
	
	// Templates Tablosu
	createTemplatesTable := `
	CREATE TABLE IF NOT EXISTS templates (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT,
		image TEXT NOT NULL,
		ports TEXT, -- JSON array string
		env_vars TEXT, -- JSON array string
		category TEXT DEFAULT 'web',
		mount_path TEXT
	);`
	DB.Exec(createTemplatesTable)
	
	// Backups Tablosu
	createBackupsTable := `
	CREATE TABLE IF NOT EXISTS backups (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		instance_id INTEGER NOT NULL,
		filename TEXT NOT NULL,
		size INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(instance_id) REFERENCES instances(id)
	);`
	DB.Exec(createBackupsTable)

	seedTemplates()

	// Otomatik Migration: Eksik kolonları ekle
	columns := []string{
		"image", "container_port", "host_path", "target_path", "cpu_limit", "memory_limit", "env_vars", "allowed_ips",
	}
	for _, col := range columns {
		_, _ = DB.Exec(fmt.Sprintf("ALTER TABLE instances ADD COLUMN %s TEXT", col))
	}

	// Basit Migration: Önceden tablo varsa custom_domain ve user_id ekle (hata verirse yoksay)
	DB.Exec("ALTER TABLE instances ADD COLUMN custom_domain TEXT DEFAULT '';")
	DB.Exec("ALTER TABLE instances ADD COLUMN user_id INTEGER DEFAULT 1;")
	DB.Exec("ALTER TABLE instances ADD COLUMN git_url TEXT DEFAULT '';")
	DB.Exec("ALTER TABLE instances ADD COLUMN cpu_limit REAL DEFAULT 0;")
	DB.Exec("ALTER TABLE instances ADD COLUMN memory_limit INTEGER DEFAULT 0;")

	// API Keys Tablosu (v3 Step 6)
	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS api_keys (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		name TEXT,
		key TEXT UNIQUE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatal(err)
	}

	// Webhooks Tablosu (v3 Step 6)
	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS webhooks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		name TEXT,
		url TEXT,
		events TEXT, -- JSON array: ["deploy.success", "deploy.error"]
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatal(err)
	}

	// S3 Ayarları Tablosu (v3 Step 4 - Remote Storage)
	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS s3_settings (
		user_id INTEGER PRIMARY KEY,
		endpoint TEXT,
		access_key TEXT,
		secret_key TEXT,
		bucket TEXT,
		region TEXT,
		is_active INTEGER DEFAULT 0
	)`)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("✅ Veritabanı (SQLite) başarıyla başlatıldı ve tablolar hazır.")
}

func seedTemplates() {
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM templates").Scan(&count)
	if count > 0 {
		return
	}

	templates := []struct {
		ID, Name, Desc, Image, Category, MountPath string
		Ports, EnvVars                             string
	}{
		{"nginx", "Nginx Static Web Server", "Statik web siteleri ve HTML projeleri için.", "nginx:alpine", "web", "/usr/share/nginx/html", "[80]", "[]"},
		{"php-8-apache", "PHP 8.2 + Apache", "Laravel ve klasik PHP uygulamaları için.", "php:8.2-apache", "web", "/var/www/html", "[80]", "[]"},
		{"node-18", "Node.js 18", "Backend API ve JS projeleri için.", "node:18-alpine", "web", "/app", "[3000]", "[\"NODE_ENV=production\"]"},
		{"python-3-11", "Python 3.11", "Flask ve FastAPI projeleri için.", "python:3.11-alpine", "web", "/app", "[8000]", "[]"},
		// Veritabanları (Adım 2)
		{"postgres-15", "PostgreSQL 15", "Güçlü ilişkisel veritabanı.", "postgres:15-alpine", "database", "/var/lib/postgresql/data", "[5432]", "[\"POSTGRES_PASSWORD=kovan-pass\"]"},
		{"mysql-8", "MySQL 8.0", "Popüler ilişkisel veritabanı.", "mysql:8.0", "database", "/var/lib/mysql", "[3306]", "[\"MYSQL_ROOT_PASSWORD=kovan-pass\"]"},
		{"redis-7", "Redis 7.0", "Hızlı key-value depolama.", "redis:7.0-alpine", "database", "/data", "[6379]", "[]"},
	}

	for _, t := range templates {
		DB.Exec(`INSERT INTO templates (id, name, description, image, ports, env_vars, category, mount_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			t.ID, t.Name, t.Desc, t.Image, t.Ports, t.EnvVars, t.Category, t.MountPath)
	}
	log.Println("🌱 Şablonlar (Templates) veritabanına eklendi.")
}
