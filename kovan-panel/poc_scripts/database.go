package main

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

type Customer struct {
	ID     int
	Name   string
	Domain string
	Port   string
}

// Veritabanını hazırla
func InitDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./kovan.db")
	if err != nil {
		return nil, err
	}

	// Müşteriler tablosunu oluştur
	statement := `CREATE TABLE IF NOT EXISTS customers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		domain TEXT,
		port TEXT UNIQUE
	);`
	_, err = db.Exec(statement)
	return db, err
}

// Yeni müşteri ekle
func AddCustomer(db *sql.DB, name, domain, port string) error {
	statement := `INSERT INTO customers (name, domain, port) VALUES (?, ?, ?)`
	_, err := db.Exec(statement, name, domain, port)
	return err
}

// Tüm müşterileri getir
func GetCustomers(db *sql.DB) ([]Customer, error) {
	rows, err := db.Query("SELECT id, name, domain, port FROM customers")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var c Customer
		if err := rows.Scan(&c.ID, &c.Name, &c.Domain, &c.Port); err != nil {
			return nil, err
		}
		customers = append(customers, c)
	}
	return customers, nil
}