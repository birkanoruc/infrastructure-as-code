package utils

import (
	"context"
	"fmt"
	"kovan-panel/internal/db"
	"os/exec"
	"path/filepath"
)

// UploadToS3, bir dosyayı Docker üzerinden amazon/aws-cli kullanarak S3'e yükler.
func UploadToS3(userId int, filePath string) error {
	// 1. Kullanıcının S3 ayarlarını getir
	var endpoint, accessKey, secretKey, bucket, region string
	var isActive int
	err := db.DB.QueryRow("SELECT endpoint, access_key, secret_key, bucket, region, is_active FROM s3_settings WHERE user_id = ?", userId).
		Scan(&endpoint, &accessKey, &secretKey, &bucket, &region, &isActive)
	
	if err != nil || isActive == 0 {
		// Ayar yoksa veya aktif değilse sessizce atla (Hata değil, tercih)
		return nil
	}

	fileName := filepath.Base(filePath)
	absPath, _ := filepath.Abs(filePath)
	dir := filepath.Dir(absPath)

	// 2. Docker komutunu hazırla
	// AWS CLI container kullanarak yükleme yapıyoruz. 
	// Endpoint desteği için --endpoint-url kullanıyoruz (Minio/R2 desteği için).
	cmdArgs := []string{
		"run", "--rm",
		"-v", fmt.Sprintf("%s:/data", dir),
		"-e", fmt.Sprintf("AWS_ACCESS_KEY_ID=%s", accessKey),
		"-e", fmt.Sprintf("AWS_SECRET_ACCESS_KEY=%s", secretKey),
		"-e", fmt.Sprintf("AWS_DEFAULT_REGION=%s", region),
		"amazon/aws-cli",
		"--endpoint-url", endpoint,
		"s3", "cp", fmt.Sprintf("/data/%s", fileName), fmt.Sprintf("s3://%s/backups/%s", bucket, fileName),
	}

	cmd := exec.Command("docker", cmdArgs...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("S3 yükleme hatası: %v, Çıktı: %s", err, string(output))
	}

	return nil
}

// DownloadFromS3, bir yedeği S3'ten yerel dizine indirir.
func DownloadFromS3(userId int, fileName string, targetDir string) error {
	var endpoint, accessKey, secretKey, bucket, region string
	err := db.DB.QueryRow("SELECT endpoint, access_key, secret_key, bucket, region FROM s3_settings WHERE user_id = ?", userId).
		Scan(&endpoint, &accessKey, &secretKey, &bucket, &region)
	
	if err != nil {
		return fmt.Errorf("S3 ayarları bulunamadı")
	}

	absTargetDir, _ := filepath.Abs(targetDir)

	cmdArgs := []string{
		"run", "--rm",
		"-v", fmt.Sprintf("%s:/data", absTargetDir),
		"-e", fmt.Sprintf("AWS_ACCESS_KEY_ID=%s", accessKey),
		"-e", fmt.Sprintf("AWS_SECRET_ACCESS_KEY=%s", secretKey),
		"-e", fmt.Sprintf("AWS_DEFAULT_REGION=%s", region),
		"amazon/aws-cli",
		"--endpoint-url", endpoint,
		"s3", "cp", fmt.Sprintf("s3://%s/backups/%s", bucket, fileName), fmt.Sprintf("/data/%s", fileName),
	}

	cmd := exec.Command("docker", cmdArgs...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("S3 indirme hatası: %v, Çıktı: %s", err, string(output))
	}

	return nil
}
