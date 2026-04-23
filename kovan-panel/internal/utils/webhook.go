package utils

import (
	"bytes"
	"encoding/json"
	"kovan-panel/internal/db"
	"net/http"
	"time"
)

type WebhookPayload struct {
	Event     string      `json:"event"`
	Timestamp string      `json:"timestamp"`
	Instance  string      `json:"instance"`
	Data      interface{} `json:"data"`
}

// TriggerWebhook, belirli bir kullanıcı ve olay tipi için kayıtlı tüm webhook'ları tetikler.
func TriggerWebhook(userId int, event string, instanceName string, data interface{}) {
	rows, err := db.DB.Query("SELECT url, events FROM webhooks WHERE user_id = ?", userId)
	if err != nil {
		return
	}
	defer rows.Close()

	payload := WebhookPayload{
		Event:     event,
		Timestamp: time.Now().Format(time.RFC3339),
		Instance:  instanceName,
		Data:      data,
	}
	jsonPayload, _ := json.Marshal(payload)

	for rows.Next() {
		var url, eventsJSON string
		rows.Scan(&url, &eventsJSON)

		var events []string
		json.Unmarshal([]byte(eventsJSON), &events)

		// Olay tipi bu webhook için kayıtlı mı?
		match := false
		for _, e := range events {
			if e == event {
				match = true
				break
			}
		}

		if match {
			// Arka planda gönder (Non-blocking)
			go func(webhookUrl string) {
				http.Post(webhookUrl, "application/json", bytes.NewBuffer(jsonPayload))
			}(url)
		}
	}
}
