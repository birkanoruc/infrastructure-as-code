# Kovan Panel v2 - İleri Seviye Özellikler ve Yol Haritası

Bu belge, v1 sürümünde (Çekirdek Orkestrasyon ve Panel) inşa ettiğimiz sağlam temellerin üzerine eklenecek olan ileri seviye (v2) özelliklerin planlamasını içerir.

## 📌 Adım 1: Gerçek Zamanlı Kaynak Tüketimi İzleme (Monitoring)
Müşterilere sistem kaynaklarının (CPU, RAM) kullanımını canlı olarak (Live) göstereceğiz.
- [x] Go API'de Docker Stats API'sine bağlanarak anlık metrikleri okuyan bir servis yazmak.
- [x] Fiber üzerinden WebSocket (veya SSE) kanalı açıp canlı veriyi frontend'e akıtmak.
- [x] Next.js (kovan-ui) paneline, veriyi grafiksel veya anlık sayaçlarla (Gauge/Line chart) gösteren şık bir "Sistem Metrikleri" bileşeni eklemek.

## 📌 Adım 2: Web Tabanlı Terminal (Web SSH)
Müşterinin bilgisayarında SSH açık olmasa bile panel üzerinden doğrudan kendi konteynerine komut gönderebilmesi.
- [x] Go API üzerinden `docker exec` komutunu başlatan ve I/O (Input/Output) akışını bir WebSocket'e bağlayan altyapıyı hazırlamak.
- [x] Next.js üzerinde `xterm.js` kütüphanesini kullanarak tarayıcı içinde çalışan siyah ekranlı bir sanal terminal inşa etmek.

## 📌 Adım 3: Gerçek Domain ve Otomatik SSL (HTTPS)
`.kovan.local` yerine gerçek domain kullanımını ve otomatik SSL kurulumunu sağlamak.
- [x] Arayüzde müşterinin kendi gerçek domainini (Örn: `benimsitem.com`) ekleyebileceği bir alan oluşturmak.
- [x] Veritabanında (instances) domain kayıtlarını özelleştirilebilir hale getirmek.
- [x] Caddy konfigürasyonunu (JSON), Let's Encrypt kullanarak otomatik SSL alacak şekilde (TLS yapılandırmasıyla) güncellemek.

## 📌 Adım 4: Kullanıcı Girişi (Authentication & Multi-Tenant)
Şu an herkes paneli görebiliyor. Bunu güvenli bir yapıya (Multi-tenant) taşıyacağız.
- [x] Go tarafında Güvenli Token tabanlı Auth mekanizması ve `users` veritabanı tablosu oluşturmak.
- [x] Tüm API endpoint'lerini "Sadece Yetkili Kullanıcılar" girebilecek şekilde Middleware ile korumak.
- [x] Next.js tarafında Login / Register sayfalarını tasarlamak ve kullanıcı oturum yönetimini kurmak.
- [x] Her müşterinin **sadece kendi oluşturduğu** siteleri görebilmesini sağlamak.

## 📌 Adım 5: Gelişmiş Dosya Yöneticisi (File Manager)
Müşterinin kodu yükleyebilmesi veya değiştirebilmesi için konteynerin içine (veya bir volume'a) dosya yükleme özelliği.
- [x] Konteynerler için host makinede izole kalıcı alanlar (Docker Bind Mounts) tanımlamak.
- [x] Go API üzerinden, seçili konteynerin klasörlerini listeleyen, dosya yüklemeye ve indirmeye olanak tanıyan uç noktalar yazmak.
- [x] Next.js'te modern bir "Dosya Gezgini" arayüzü tasarlamak.

## 📌 Adım 6: CI/CD ve GitHub Entegrasyonu
Müşterinin hazır şablonlardan ziyade doğrudan GitHub reposundan uygulamasını canlıya alması.
- [x] GitHub Repolarını doğrudan klonlayarak (Git clone) uygulama ayağa kaldırma desteği.
- [x] Dosya Yöneticisi üzerinden tek tıkla "Git Pull & Redeploy" (Yeniden Dağıtım) mekanizması.
- [x] Dashboard'da GitHub projeleri için özel durum göstergeleri.
- [x] Veritabanı şemasının GitURL bilgisini saklayacak şekilde güncellenmesi.

---
*Not: Bu hedefler sırasıyla geliştirilecek olup, her adım bir yazılımcı olarak seni daha ileri düzey (Senior) konseptlere taşıyacaktır.*
