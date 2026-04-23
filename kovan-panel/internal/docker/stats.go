package docker

import (
	"context"
	"encoding/json"
	"io"
)

type ContainerStats struct {
	CPUPercentage float64 `json:"cpu_percentage"`
	MemoryUsageMB float64 `json:"memory_usage_mb"`
	MemoryLimitMB float64 `json:"memory_limit_mb"`
}

// GetContainerStats, Docker Stats API'sinden anlık CPU ve RAM verilerini çeker.
func GetContainerStats(ctx context.Context, containerName string) (*ContainerStats, error) {
	// stream=false ile sadece o anki snapshot'ı (anlık durumu) alıyoruz
	stats, err := cli.ContainerStats(ctx, containerName, false)
	if err != nil {
		return nil, err
	}
	defer stats.Body.Close()

	body, err := io.ReadAll(stats.Body)
	if err != nil {
		return nil, err
	}

	var v map[string]interface{}
	if err := json.Unmarshal(body, &v); err != nil {
		return nil, err
	}

	// Güvenli tip dönüşümleri için yardımcı fonksiyonlar
	getFloat := func(m map[string]interface{}, key string) float64 {
		if val, ok := m[key].(float64); ok {
			return val
		}
		return 0.0
	}

	// CPU Hesaplaması
	var cpuDelta, systemDelta float64
	cpuPercent := 0.0

	if cpuStats, ok := v["cpu_stats"].(map[string]interface{}); ok {
		if cpuUsage, ok := cpuStats["cpu_usage"].(map[string]interface{}); ok {
			cpuDelta = getFloat(cpuUsage, "total_usage")
		}
		systemDelta = getFloat(cpuStats, "system_cpu_usage")
	}

	if precpuStats, ok := v["precpu_stats"].(map[string]interface{}); ok {
		if precpuUsage, ok := precpuStats["cpu_usage"].(map[string]interface{}); ok {
			cpuDelta -= getFloat(precpuUsage, "total_usage")
		}
		systemDelta -= getFloat(precpuStats, "system_cpu_usage")
	}

	if systemDelta > 0.0 && cpuDelta > 0.0 {
		cpuPercent = (cpuDelta / systemDelta) * 100.0
	}

	// RAM (Bellek) Hesaplaması
	memUsage := 0.0
	memLimit := 0.0
	if memoryStats, ok := v["memory_stats"].(map[string]interface{}); ok {
		memUsage = getFloat(memoryStats, "usage") / 1024 / 1024
		memLimit = getFloat(memoryStats, "limit") / 1024 / 1024
	}

	return &ContainerStats{
		CPUPercentage: cpuPercent,
		MemoryUsageMB: memUsage,
		MemoryLimitMB: memLimit,
	}, nil
}
