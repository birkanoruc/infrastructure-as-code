# Kovan Hosting Panel (Infrastructure as Code)

Kovan, modern standartlarla geliştirilmiş, "sunucuyu donanım yığını değil, programlanabilir nesne olarak gören" yeni nesil bir hosting kontrol paneli ve altyapı otomasyonu sistemidir. Docker tabanlı konteyner yönetimi, dinamik Caddy yönlendirmesi ve modern bir web arayüzü ile PaaS (Platform as a Service) deneyimi sunar.

## 🚀 Mevcut Özellikler (v2)

Sistemimiz v2 aşamasıyla beraber aşağıdaki gelişmiş özelliklere sahip olmuştur:

### 🔐 Güvenlik ve Çoklu Kullanıcı (Multi-Tenancy)
- **JWT Tabanlı Kimlik Doğrulama:** Tüm API uç noktaları güvenli token mekanizmasıyla korunur.
- **İzole Kullanıcı Alanları:** Her kullanıcı sadece kendi oluşturduğu servisleri görebilir ve yönetebilir.

### 📊 Gerçek Zamanlı İzleme (Monitoring)
- **Live Metrics:** Konteynerlerin CPU ve RAM kullanımı WebSocket üzerinden anlık olarak takip edilebilir.
- **Sistem Durumu:** Tüm servislerin çalışma durumu canlı olarak panoda görüntülenir.

### 💻 Web Tabanlı Terminal (Web SSH)
- **xterm.js Entegrasyonu:** Tarayıcı üzerinden doğrudan konteyner içine erişim sağlayan tam fonksiyonel sanal terminal.
- **Docker Exec Stream:** Go backend üzerinden güvenli I/O akışı.

### 📁 Gelişmiş Dosya Yöneticisi
- **İzole Dosya Yapısı:** Docker Bind Mounts kullanılarak her servis için özel depolama alanları.
- **Dosya İşlemleri:** Tarayıcı üzerinden dosya yükleme, indirme ve dizin yönetimi.

### 🌐 Domain ve SSL Yönetimi
- **Otomatik HTTPS:** Caddy API entegrasyonu ile Let's Encrypt tabanlı otomatik SSL sertifikası üretimi.
- **Özel Domain Desteği:** Kullanıcıların kendi alan adlarını (benimsitem.com) kolayca sisteme bağlayabilmesi.

### 🛠 CI/CD ve Git Entegrasyonu
- **GitHub Desteği:** Doğrudan GitHub reposundan uygulama ayağa kaldırma.
- **Tek Tıkla Güncelleme:** "Git Pull & Redeploy" mekanizması ile uygulamaları kolayca güncel tutma.

## 🏗 Mimari Yapı

Sistem 3 ana katmandan oluşur:

1.  **Caddy (Trafik Polisi):** Dinamik Reverse Proxy ve otomatik SSL yönetimi.
2.  **Docker (İzole Odalar):** Uygulamaların birbirinden tamamen izole şekilde çalıştırıldığı konteyner ekosistemi.
3.  **Go Backend (Beyin):** Docker SDK ve Caddy API'sini koordine eden, Fiber framework'ü ile güçlendirilmiş orkestra merkezi.
4.  **Next.js Frontend (Yüz):** Tailwind CSS ve modern UI bileşenleriyle donatılmış kullanıcı arayüzü.

## 🛠 Teknoloji Yığını

- **Backend:** Go (Golang), Fiber, Docker SDK, Caddy API, SQLite
- **Frontend:** Next.js 15+, React 19, Tailwind CSS, xterm.js, Lucide Icons
- **Altyapı:** Docker, Caddy Server

## 🏁 Başlangıç

### Gereksinimler
- Docker & Docker Compose
- Go 1.22+
- Node.js 20+

### Kurulum

1. **Backend'i Başlatın:**
   ```bash
   cd kovan-panel
   go run cmd/api/main.go
   ```

2. **Frontend'i Başlatın:**
   ```bash
   cd kovan-ui
   npm install
   npm run dev
   ```

---

## 🔮 Gelecek (v3 Planları)

Sistemi daha da profesyonelleştirmek için planlanan geliştirmeler:
- **Kaynak Sınırlandırma (Quotas):** Kullanıcı bazlı CPU/RAM limitleri.
- **Otomatik Yedekleme:** Veritabanı ve dosya sistemi için periyodik backup mekanizması.
- **One-Click Apps:** WordPress, Database (MySQL/Postgres) gibi popüler servislerin şablonlarla kurulması.
- **Log Yönetimi:** Konteyner loglarının geçmişe dönük incelenebilmesi.
- **API Key Desteği:** Dış entegrasyonlar için programatik erişim.
