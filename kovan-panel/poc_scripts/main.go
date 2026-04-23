package main

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

func main() {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		panic(err)
	}
	defer cli.Close()

	imageName := "nginx:alpine"

	// 1. İmajı Docker Hub'dan çekiyoruz (Eğer lokalde yoksa)
	fmt.Printf("%s imajı indiriliyor...\n", imageName)

	out, err := cli.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		panic(err)
	}
	defer out.Close()
	io.Copy(os.Stdout, out)

	// 2. Konteyner Yapılandırması
	containerConfig := &container.Config{
		Image: imageName,
		ExposedPorts: nat.PortSet{
			"80/tcp": struct{}{},
		},
	}

	// 3. Host Yapılandırması - Kaynak Sınırları ve Port
	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory:   128 * 1024 * 1024, // Sadece 128MB RAM kullanabilsin
			NanoCPUs: 500000000,         // Sadece 0.5 CPU çekirdeği kullanabilsin
		},
		PortBindings: nat.PortMap{
			"80/tcp": []nat.PortBinding{
				{
					HostIP:   "0.0.0.0",
					HostPort: "8081", // Çakışma olmaması için bu sefer 8081 yapalım
				},
			},
		},
	}
    
    // Konteyner ismini de değiştirelim (Örn: "sinirli-kovan")
    resp, err := cli.ContainerCreate(ctx, containerConfig, hostConfig, nil, nil, "sinirli-kovan")
	if err != nil {
		panic(err)
	}

	// 5. Konteyneri Başlat
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		panic(err)
	}

	fmt.Printf("\n🚀 Konteyner başarıyla başlatıldı! ID: %s\n", resp.ID[:10])
	fmt.Println("Tarayıcından http://127.0.0.1:8080 adresine giderek kontrol edebilirsin.")
}