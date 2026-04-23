package models

import "time"

type Instance struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Subdomain string    `json:"subdomain"`
	ImageTag  string    `json:"image_tag"`
	Port      int       `json:"port"`
	Status    string    `json:"status"`   // "running", "stopped", "failed" vb.
	EnvVars   string    `json:"env_vars"` // JSON string
	CreatedAt time.Time `json:"created_at"`
}
