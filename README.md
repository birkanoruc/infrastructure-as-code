# 🐝 Kovan PaaS (Platform as a Service)

Kovan, modern altyapı ihtiyaçları için tasarlanmış, Docker tabanlı, yüksek güvenlikli ve geliştirici dostu bir **Next-Gen Hosting Platformu**dur. Sunucuyu bir donanım yığını değil, programlanabilir bir orkestra olarak yönetmenizi sağlar.

---

## 💎 v3 Kurumsal Özellikler

Sistemimiz v3 aşamasıyla beraber "Hobi" seviyesinden "Enterprise-Ready" seviyesine yükseltilmiştir:

### 🛡️ Gelişmiş Güvenlik ve Ağ İzolasyonu
- **İzole Docker Ağları:** Her kullanıcı için özel `kovan-user-{id}` ağları oluşturulur. Konteynerler sadece kendi ağlarındaki veritabanlarıyla konuşabilir.
- **Firewall (IP Whitelisting):** Uygulamalarınıza sadece sizin belirlediğiniz IP adreslerinden erişilmesini sağlayın.
- **Otomatik SSL:** Caddy API entegrasyonu ile tüm domainler için anında ve ücretsiz HTTPS (Let's Encrypt).

### ☁️ Veri Güvenliği ve Bulut Yedekleme
- **S3 Remote Storage:** Yedeklerinizi AWS S3, Cloudflare R2 veya Minio üzerine otomatik gönderin.
- **Tek Tıkla Restore:** Geçmiş yedeklerden saniyeler içinde geri dönün (Yerel veya S3 fark etmeksizin).
- **Periyodik Yedekleme:** Veri kaybına karşı otomatik volume yedekleme mekanizması.

### ⚙️ Kaynak Yönetimi ve Monitorlama
- **CPU & RAM Quotas:** Uygulama başına kaynak limiti (Örn: 0.5 CPU, 512MB RAM) tanımlayarak sunucu sağlığını koruyun.
- **Canlı Metrikler:** WebSocket üzerinden anlık CPU/RAM kullanım grafikleri ve log akışı.
- **ANSI Log Viewer:** xterm.js tabanlı, renkli ve indirilebilir canlı log izleyici.

### 🚀 Geliştirici Deneyimi (DX)
- **API Key Yönetimi:** CI/CD süreçleriniz ve dış entegrasyonlar için programatik erişim anahtarları.
- **Webhook Desteği:** Deployment başarılı olduğunda veya hata aldığında dış sistemlere (Discord, Slack, vb.) bildirim gönderin.
- **GitOps Entegrasyonu:** GitHub repolarından tek tıkla deployment ve otomatik güncelleme.
- **Dark/Light Mode:** Göz yormayan, modern ve tamamen özelleştirilebilir dashboard tasarımı.

---

## 🏗️ Mimari Yapı

Kovan, birbirini tamamlayan 4 ana katman üzerine inşa edilmiştir:

1.  **Caddy (Edge Proxy):** Dinamik trafik yönetimi ve otomatik SSL orkestrasyonu.
2.  **Docker (Runtime):** Uygulamaların izole ve kısıtlanabilir konteynerlerde çalıştırılması.
3.  **Go Backend (Brain):** Docker SDK ve Caddy API'sini koordine eden, yüksek performanslı kontrol merkezi.
4.  **Next.js Frontend (Interface):** Tailwind CSS 4 ve modern bileşenlerle donatılmış kullanıcı paneli.

---

## 🛠️ Teknoloji Yığını

- **Backend:** Go (Golang), Fiber, Docker SDK, Caddy API, SQLite, Docker-CLI based S3 Helper
- **Frontend:** Next.js 15+, React 19, Tailwind CSS 4, xterm.js, Lucide Icons, LocalStorage Theme System
- **Altyapı:** Docker, Caddy Server, Isolated Bridge Networks

---

## 🏁 Hızlı Başlangıç

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

## 🗺️ v3+ Gelecek Vizyonu
- **One-Click Marketplace:** WordPress, PostgreSQL, Redis gibi servislerin tek tıkla kurulması.
- **Load Balancing:** Uygulama trafiğinin birden fazla konteyner arasında dağıtılması.
- **Auto-Scaling:** Yüke göre konteyner sayısının otomatik artırılması/azaltılması.

---
*Kovan, altyapınızı programlamanıza olanak tanır.*
