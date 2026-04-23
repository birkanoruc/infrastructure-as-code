package docker

import (
	"context"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
)

// AttachTerminal, container içinde yeni bir shell process'i başlatır ve çift yönlü I/O bağlantısını (HijackedResponse) döndürür.
func AttachTerminal(ctx context.Context, containerName string) (*types.HijackedResponse, error) {
	// 1. Exec oluştur (sh shell'i açacağız, çoğu imajda bash yerine garanti olarak sh bulunur)
	execConfig := container.ExecOptions{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
		Cmd:          []string{"/bin/sh"},
	}

	execID, err := cli.ContainerExecCreate(ctx, containerName, execConfig)
	if err != nil {
		return nil, err
	}

	// 2. Exec'e bağlan (Attach) ve soketi al
	attachConfig := container.ExecAttachOptions{
		Tty: true,
	}

	resp, err := cli.ContainerExecAttach(ctx, execID.ID, attachConfig)
	if err != nil {
		return nil, err
	}

	return &resp, nil
}
