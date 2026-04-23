package docker

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

var cli *client.Client

// InitDocker Docker istemcisini başlatır.
func InitDocker() error {
	var err error
	cli, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	return err
}

// PullImage belirtilen imajı Docker Hub'dan indirir.
func PullImage(ctx context.Context, imageName string) error {
	out, err := cli.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		return err
	}
	defer out.Close()
	// İndirme sürecini loglamak istersen:
	io.Copy(os.Stdout, out)
	return nil
}

// CreateAndStartContainer yeni bir konteyner oluşturur ve başlatır.
func CreateAndStartContainer(ctx context.Context, containerName, imageName, hostPort, containerPort string) (string, error) {
	// Önce varsa eskiyi (çakışanı) silelim
	cli.ContainerRemove(ctx, containerName, container.RemoveOptions{Force: true})

	portBindings := nat.PortMap{
		nat.Port(containerPort + "/tcp"): []nat.PortBinding{
			{
				HostIP:   "0.0.0.0",
				HostPort: hostPort,
			},
		},
	}

	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: imageName,
		ExposedPorts: nat.PortSet{
			nat.Port(containerPort + "/tcp"): struct{}{},
		},
	}, &container.HostConfig{
		PortBindings: portBindings,
	}, nil, nil, containerName)

	if err != nil {
		return "", fmt.Errorf("konteyner oluşturulamadı: %v", err)
	}

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("konteyner başlatılamadı: %v", err)
	}

	return resp.ID, nil
}

// StopContainer belirtilen konteyneri durdurur.
func StopContainer(ctx context.Context, containerName string) error {
	// 10 saniye bekleme süresi verebiliriz veya nil geçebiliriz
	return cli.ContainerStop(ctx, containerName, container.StopOptions{})
}

// RemoveContainer belirtilen konteyneri tamamen siler.
func RemoveContainer(ctx context.Context, containerName string) error {
	return cli.ContainerRemove(ctx, containerName, container.RemoveOptions{Force: true})
}
