# Nerede kaldık — Argos
SON GÜNCELLEME: 30-08-2026 | HEAD: 372d09c | testler: 32/32 yeşil

## Şu an ne durumdayız
- **Arayüzde üç seçenek var, C seçildi.** A (`/`) ve B (`/b/`) birer fikir
  olarak duruyor, silinmiyor; **bütün geliştirme C üzerinde** (`/c/`).
- C'nin ana ekranı telefonda ve masaüstünde onaylandı. Masaüstü bir pano:
  üç sütun, kendi modülleri var (ayın günleri, kategori/ay, saate göre,
  alışkanlık/ay).
- **Ayrıntılı sayfalar aşaması başladı.** İlki bitti: harcama (`#harcama`).
- Kod bölündü: `c/ortak.js` iki ekranın ortak görsel dili, `c/ana.js` ana
  ekran, `c/harcama.js` ayrıntı sayfası.

## Gezinme kararı (bu oturumda verildi)
**Blok başlığı kapıdır.** Kalıcı sekme çubuğu elendi: ekranın altından yer
yiyor ve tıklanabilir öğe sayısını ikiye katlıyor. Ana ekranda "BUGÜN"
başlığı `#harcama`ya açılıyor, sayfada "← BUGÜN" geri dönüyor. Hash
tabanlı rota, tarayıcının geri tuşu çalışıyor.

## Sıradaki iş
1. **Kullanıcı harcama ayrıntı sayfasını değerlendirsin.** Anlaşınca
   sıradaki sayfaya geçilecek — parça parça ilerleniyor.
2. Sonraki sayfa: **alışkanlık ayrıntısı** (uzun geçmiş, ısı haritası,
   seri tarihçesi).
3. **Abonelik sayfası açılmayacak** — dört abonelik ana ekranda tam
   görünüyor, sayfa boş bir kabuk olurdu. Yenileme günleri girilirse
   takvim görünümü yeniden düşünülür.
4. Telefon düzeninde kullanıcının biriktirdiği "detaylar" var; masaüstü
   oturunca konuşulacak (27-08'den beri bekliyor).

## Veri durumu
- **Gerçek veri (4173) harcamada boş.** Ayrıntı sayfası orada dört küçük
  "kayıt yok" bloğu gösteriyor — doğru davranış, doğrulandı.
- Dolu ekran örnek veriyle (4174) doğrulanıyor. Örnek veri **bugüne göre**
  üretiliyor; gün dönünce `scratchpad/b-turlar/ornek-veri-uret.js` yeniden
  çalıştırılmalı.
- Kullanıcı: *"tüm geliştirmelere gerçek veriyi zamanla gireceğiz, test
  verisi yeterli."*

## Dokunulmayacaklar
- **İşaretleme testi 4173'te yapılmaz** — o sunucu `C:\ws\veri`'ye yazar.
  İki kez oldu, ikisinde de elle geri alındı. Her zaman 4174.
- `C:\ws\veri\` altındaki `onay-*.json`, `harcama/*.json`, `abonelik.json`
  Claude'un dosyaları; Argos yalnız `onay-app-*.json`'a yazar.
- A ve B silinmez.
- GitHub deposu açma ve token üretme — kullanıcının kararı.

## CEVAPLANMAMIŞ SORULAR
Beşi de 27-08-2026'da soruldu, **ikinci kez taşınıyor**:
- **F1 TV periyodu aylık mı?**
- **Aboneliklerin yenileme günleri** — dördü de bilinmiyor, ekranda
  "Sıradaki ödeme" kutusu bu yüzden boş görünüyor.
- **EUR kuru tahmini** — yalnız USD ölçüldü.
- **"Ana" alışkanlık spor seçildi**, sorulmadan.
- **Google Fonts CDN'den yükleniyor.** Çevrimdışı PWA'da yazı tipleri
  düşer; gömülecek mi, sistem yazı tipine mi dönülecek?

Yeni (30-08-2026):
- **Geçmiş aylara gezinme** istenecek mi? Ayrıntı sayfası şimdilik yalnız
  içinde bulunulan ayı çiziyor; veri katmanı tek ay yüklüyor.

## İlgili notlar
- Roadmap ve bağımlılık haritası: `PROJECT_PLAN.md`
- Ders kalıpları: `LESSONS.md`
- Kararlar ve mimari: `C:\ws\projeler\Argos\`
- Devlog: `C:\ws\projeler\Argos\calisma\oturum-loglari\`
