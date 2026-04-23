# Kovan Panel v1 - Yol Haritası ve Görevler

Bu belge, projenin ilk sürümüne (v1) ulaşması için belirlenmiş kesin mimari tercihleri ve izlenecek adım adım görevleri içermektedir.

## 🛠 Teknik Mimari Kararları (v1)
- **Backend API:** Go (Golang) + **Fiber Framework**
- **Frontend Panel:** **Next.js** (React)
- **Veritabanı:** SQLite
- **Proxy/Yönlendirme:** Caddy (Sadece Subdomain testleri: `*.kovan.local`)
- **Konteyner Yönetimi:** Docker SDK for Go (Özelleştirilebilir ve hazır imaj seçimi destekli)

---

## 📌 Adım 1: Backend İskeleti ve Fiber Entegrasyonu
Dağınık haldeki PoC (Proof of Concept) dosyalarımızı temiz ve modüler bir Go API yapısına taşıyoruz.
- [x] Go Fiber projesinin başlatılması (`go mod init`, fiber paketinin yüklenmesi).
- [x] Standart klasör yapısının kurulması (Örn: `cmd/api/`, `internal/handlers/`, `internal/routes/`, `internal/models/`).
- [x] Fiber sunucusunun ayağa kaldırılması ve `GET /health` gibi temel kontrol endpoint'inin yazılması.

## 📌 Adım 2: Veritabanı ve Durum Yönetimi (State Management)
- [x] SQLite bağlantısının (`database.go`) `internal/db/` altına entegre edilmesi.
- [x] `apps` veya `instances` tablosunun oluşturulması (Sütunlar: id, name, subdomain, image_tag, port, status, env_vars).
- [x] Port çakışmalarını önlemek için dinamik boş port atama (Auto-Port Allocation) algoritmasının yazılması.

## 📌 Adım 3: Esnek İmaj Yönetimi (Katalog Servisi)
Müşterinin Docker dosyası yazmadan direkt teknoloji seçebilmesi için bir "Uygulama Kataloğu" mantığı kuracağız.
- [x] Desteklenen hazır teknolojilerin (Node.js, PHP+Apache, Python, Nginx vb.) Docker Hub etiketlerinin (tag) bir konfigürasyonda veya veritabanında tanımlanması.
- [x] Frontend'e bu hazır şablonları sunacak `GET /api/templates` endpoint'inin oluşturulması.

## 📌 Adım 4: Docker Orkestrasyon Servisi
- [x] Eski `deploy.go` mantığının `internal/docker/` altına taşınması ve Fiber ile entegre edilmesi.
- [x] Kullanıcının seçtiği imajın (Örn: `php:8.2-apache`) Docker Hub'dan dinamik olarak çekilmesi (Pull) işleminin API üzerinden yapılması.
- [x] Konteyner Yaşam Döngüsü endpoint'lerinin oluşturulması:
  - `POST /api/instances` (Oluştur ve Başlat)
  - `POST /api/instances/:id/stop` (Durdur)
  - `POST /api/instances/:id/start` (Başlat)
  - `DELETE /api/instances/:id` (Sil)

## 📌 Adım 5: Caddy ve Subdomain Yönlendirmesi
İlk aşamada gerçek domain yerine sadece alt alan adları (Örn: `app1.kovan.local`) kullanacağız.
- [x] `manager.go` içerisindeki JSON Caddy Config yapısının `internal/proxy/` altına entegre edilmesi.
- [x] Yeni bir konteyner başlatıldığında veya durdurulduğunda, Caddy'ye anlık olarak `*.kovan.local` rotasını bildirecek Zero-Downtime senkronizasyonunun yazılması.
- [x] Caddy'nin yerel ağda subdomain yönlendirmesi yapabilmesi için gerekli ana `Caddyfile` konfigürasyonunun hazırlanması.

## 📌 Adım 6: Next.js Frontend Paneli
Backend hazır olduktan sonra müşterinin kullanacağı görsel arayüzü inşa edeceğiz.
- [x] `npx create-next-app` ile frontend projesinin (Tercihen TailwindCSS ile) `kovan-ui` klasörüne kurulması.
- [x] **Dashboard Sayfası:** Müşterinin aktif sitelerini ve durumlarını (Çalışıyor/Durdu) görebileceği liste.
- [x] **Yeni Site Ekleme (Wizard):** Müşterinin proje adını girdiği, listeden (Node, PHP, Nginx) teknolojiyi seçtiği ve tek tıkla oluşturduğu arayüz.
- [x] Fiber API ile Next.js arasındaki CORS ve API iletişiminin ayarlanması.
