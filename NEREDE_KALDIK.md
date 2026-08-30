# Nerede kaldık — Argos
SON GÜNCELLEME: 30-08-2026 | HEAD: 0978e00 | testler: 38/38 yeşil

## Şu an ne durumdayız
- **Arayüzde üç seçenek var, C seçildi.** A (`/`) ve B (`/b/`) birer fikir
  olarak duruyor, silinmiyor; **bütün geliştirme C üzerinde** (`/c/`).
- C'nin ana ekranı telefonda ve masaüstünde onaylandı. Masaüstü bir pano:
  üç sütun, kendi modülleri var (ayın günleri, kategori/ay, saate göre,
  alışkanlık/ay).
- **Harcamanın ayrıntı ağacı bitti.** Dört sayfa:
  `#harcama/<ay>` · `#kategori/<ay>/<ad>` · `#gun/<tarih>` · `#yer/<ay>/<ad>`
- Kod bölündü: `c/ortak.js` ortak görsel dil, `c/ana.js` ana ekran,
  `c/harcama.js` dört ayrıntı sayfası.

## Gezinme kararları
- **Blok başlığı değil BLOĞUN TAMAMI kapıdır.** Önce başlığa küçük bir
  düğme konmuştu; kullanıcı "kutunun tamamını kullanmak yerine üzerine
  buton koymuşsun" dedi. Bağlantı artık `::after` ile bloğu kaplıyor.
- **Kalıcı sekme çubuğu yok.** Ekranın altından yer yiyor ve tıklanabilir
  öğe sayısını ikiye katlıyordu.
- **Hash tabanlı rota**, tarayıcının kendi geri tuşu çalışıyor.
- **Ay parametresi rotanın içinde** (`#kategori/2026-08/market`): bir
  yerde saklansaydı "geri" her zaman bu aya götürürdü ve geçmiş ayda
  gezinen biri her tıklamada bugüne fırlardı.
- **İleri ok bugünün ayında kapanır**, yeri korunur (sönük). Kaybolunca
  ay adı sağa kayıyor ve ay değiştirmek yerleşimi oynatan bir işlem gibi
  görünüyordu.

## Sıradaki iş
1. **Kullanıcı harcama ağacını değerlendirsin.** Kullanıcının sözü:
   "burada ne istediğimizi tam bitirelim, sonra devam ederiz alışkanlık
   gibi kısımlardan."
2. Sonraki: **alışkanlık ayrıntısı** (uzun geçmiş, ısı haritası, seri
   tarihçesi).
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
- **Geçmiş ay verisi ne kadar geriye gidiyor?** Ay gezinmesi geçmişte
  sınırsız; kayıt tutulmamış bir ay boş görünüyor. Uygulamanın "ne zaman
  başladığı" bilgisi yok ve şimdilik gerekmedi.

## İlgili notlar
- Roadmap ve bağımlılık haritası: `PROJECT_PLAN.md`
- Ders kalıpları: `LESSONS.md`
- Kararlar ve mimari: `C:\ws\projeler\Argos\`
- Devlog: `C:\ws\projeler\Argos\calisma\oturum-loglari\`
