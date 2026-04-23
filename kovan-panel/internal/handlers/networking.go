package handlers

import (
	"context"
	"fmt"
	"kovan-panel/internal/docker"

	"github.com/docker/docker/api/types/network"
	"github.com/gofiber/fiber/v2"
)

// GetNetworkStatus, kullanıcının izole ağındaki tüm detayları döndürür.
func GetNetworkStatus(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(int)
	networkName := fmt.Sprintf("kovan-user-%d", userId)

	// Docker'dan ağ detaylarını al
	cli := docker.GetClient()
	inspect, err := cli.NetworkInspect(context.Background(), networkName, network.InspectOptions{})
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Ağ bulunamadı. Henüz bir uygulama oluşturmamış olabilirsiniz.",
		})
	}

	type ConnectedApp struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		IPAddress string `json:"ip_address"`
		MacAddr   string `json:"mac_address"`
	}

	var apps []ConnectedApp
	for containerId, endpoint := range inspect.Containers {
		// Konteyner ismini temizle (başına / ekliyor Docker)
		cleanName := endpoint.Name
		if len(cleanName) > 0 && cleanName[0] == '/' {
			cleanName = cleanName[1:]
		}

		apps = append(apps, ConnectedApp{
			ID:        containerId[:12],
			Name:      cleanName,
			IPAddress: endpoint.IPv4Address,
			MacAddr:   endpoint.MacAddress,
		})
	}

	return c.JSON(fiber.Map{
		"network_name": inspect.Name,
		"network_id":   inspect.ID[:12],
		"driver":       inspect.Driver,
		"subnet":       inspect.IPAM.Config[0].Subnet,
		"gateway":      inspect.IPAM.Config[0].Gateway,
		"apps":         apps,
	})
}
