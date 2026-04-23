# Infrastructure as Code (Hosting Kontrol Paneli)

Bu proje, modern standartlarla geliştirilmiş, "sunucuyu donanım yığını değil, programlanabilir nesne olarak gören" yeni nesil bir hosting kontrol paneli ve altyapı otomasyonu sistemidir.

## 🏗 Mimari (Büyük Resim)

Sistemimiz temelde 3 ana katmandan oluşmaktadır:

### 1. Katman: Trafik Polisi (Caddy)
- **Görevi:** Gelen tüm HTTP/HTTPS isteklerini karşılamak, domain-müşteri eşleştirmesini yapmak ve SSL sertifikalarını otomatik yönetmek.
- **Teknoloji:** Caddy (Reverse Proxy olarak)
- **Çalışma Mantığı:** Go backend'imiz Caddy'ye dinamik olarak talimatlar vererek gelen isteklerin doğru iç ağ adreslerine (örneğin `172.17.0.5:80`) yönlendirilmesini sağlar.

### 2. Katman: İzole Odalar (Konteynerler)
- **Görevi:** Müşterilerin uygulamalarını birbirinden izole etmek. Hatalı kodların, aşırı kaynak tüketiminin veya güvenlik ihlallerinin diğer müşterileri (ve ana sunucuyu) etkilemesini engellemek.
- **Teknoloji:** Docker (veya Podman)
- **Çalışma Mantığı:** Her müşteriye özel bir Docker Container atanır. Klasik hosting'in aksine, müşteriler kendi ihtiyaçlarına göre farklı dil ve sürüm ortamlarına (Örn: Bir müşteri PHP 8.3 kullanırken diğeri 7.4 kullanabilir) sahip olabilirler.

### 3. Katman: Beyin (Go Backend & Orchestrator)
- **Görevi:** Tüm sistemi koordine eden orkestra şefi olmak. Veritabanını tutmak, kullanıcı arayüzü/API sunmak ve altyapı bileşenleriyle konuşmak.
- **Teknoloji:** Go (Golang)
- **Çalışma Mantığı:**
  - **Docker SDK for Go:** Konteynerleri programatik olarak oluşturur, başlatır, durdurur ve yönetir.
  - **Caddy API:** HTTP üzerinden JSON formatında yapılandırmalar göndererek yönlendirme ayarlarını sunucuyu yeniden başlatmadan anlık günceller.
  - **Linux Statics:** Sistem kaynaklarını (`/proc` dizini veya kernel sistem çağrıları üzerinden) okuyarak CPU/RAM tüketim bilgilerini gerçek zamanlı olarak panele yansıtır.

## 🚀 Yol Haritası ve İlk Bebek Adımları

Projeyi geliştirirken hem öğrenecek hem de inşa edeceğiz. İlk aşamadaki hedeflerimiz şunlar:

1. **Docker Entegrasyonu (Go ile):** Go ile basit bir CLI yazarak, `docker run` komutunu simüle edecek ve bir test (Nginx vb.) konteynerini kod üzerinden ayağa kaldıracağız.
2. **Caddy Dinamik Yönlendirme:** Caddy'yi ayağa kaldırıp, Admin API'sine (`localhost:2019`) `curl` veya Go üzerinden JSON göndererek dışarıdan gelen bir isteği oluşturduğumuz konteynere yönlendirmeyi test edeceğiz.

## 📚 Öğrenilecek Kritik Kavramlar

Bu projenin sonunda sadece bir sistem inşa etmiş olmayacak, aşağıdaki kavramları bir Senior Developer seviyesinde kavramış olacağız:
- **Reverse Proxy:** Trafiği neden doğrudan konteynere almıyoruz da araya bir katman koyuyoruz?
- **Virtual Hosts (vHosts):** Tek bir IP adresi arkasında binlerce farklı domain nasıl yönlendiriliyor?
- **Container Networking:** İzole edilmiş Docker konteynerlerine dış dünyadan trafik nasıl güvenli şekilde ulaştırılır?
- **Unix Sockets:** Go backend'i, Docker Daemon ile HTTP yerine Unix Socket üzerinden nasıl daha hızlı ve güvenli haberleşir?
