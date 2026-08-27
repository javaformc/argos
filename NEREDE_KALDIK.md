# Nerede kaldık — Argos
SON GÜNCELLEME: 27-08-2026 | HEAD: (ilk commit) | testler: 22/22 yeşil

## Bu oturumda ne yapıldı
- **İskelet kuruldu.** `C:\MY_Code\argos`, git init, `.githooks` yolu ayarlı,
  pre-commit `precommit.txt`'yi okuyor.
- **Hesap çekirdeği** (`js/hesap.js`) — para çevrimi + `ceil` yuvarlama,
  onay birleştirme, seri, harcama kırılımı, abonelik yenileme. Saf
  fonksiyonlar; "bugün" hep parametre, sistem saatine bakmaz.
- **Veri katmanı** (`js/veri.js`) — kaynak-bağımsız. Şu an tek uygulama
  `yerelKaynak`; GitHub uygulaması P5'te aynı arayüzü dolduracak.
- **Dev sunucu** (`dev/sunucu.js`) — kodu proje kökünden, veriyi
  `C:\ws\veri`'den servis eder. Yazmayı yalnız `onay-app-*.json`'a izinli
  tutar; mimarideki dosya sahipliği burada kodla zorlanıyor.
- **Ana ekran** (`index.html`, `stil.css`, `js/ana.js`) — nöbet şeridi,
  ana alışkanlık + tek tuş onay, bugünkü harcama kırılımı, abonelik.
- Görsel kontrol 390×844'te yapıldı; üç kırık bulunup düzeltildi
  (aşağıda). Tek tuş onay örnek veri üzerinde uçtan uca çalıştı.

## Şu an ne durumdayız
- Branch `master`, çalışma ağacı temiz, 22 test yeşil.
- Milestone 1'in üç parçası da kodlandı; **onay bekliyor** (P1–P3).
- Veri gerçekte boş: harcama `[]`, onay `[]`. Ekran bugün boş görünür,
  bu doğru davranış — dolu hali örnek veriyle doğrulandı.

## Sıradaki iş
1. Kullanıcı ana ekranı değerlendirsin (Milestone 1 onayı).
2. Onay gelirse `milestone-1-onaylandi` tag'i, sonra P4: `argos-veri`
   private deposu + token akışı.
3. P4 beklerken yapılabilecek bağımsız iş yok — P5 ve P6 P4'e bağlı.
   Tıkanırsa P9/P10 (harcama kırılım ve abonelik ekranları) yerel
   kaynakla ilerleyebilir.

## SENDEN İSTENENLER
- **Ana ekranı değerlendir (~5 dk).** `node dev/sunucu.js` çalıştır,
  http://localhost:4173 aç. Beğenmediğin yeri söyle — kod okumana gerek yok.
- GitHub hesabı: `argos` (public) ve `argos-veri` (private) depolarını
  açmak için hesabın hazır olması gerekiyor (~10 dk, P4'te).

## Bu oturumda verilen kararlar
- **Çalışma modu `otomatik`** — vault `kararlar.md > Çalışma bölüşümü`
  zaten "Claude yazar, kullanıcı değerlendirir" diyordu, yeniden sorulmadı.
- **Veri kod deposuna kopyalanmaz.** Dev sunucu vault'taki `C:\ws\veri`'yi
  servis eder; `veri/` `.gitignore`'da. İki kaynak olsaydı hangisinin
  doğru olduğu belirsizleşirdi.
- **Nöbet şeridinde "kayıt yok" ile "kaçırıldı" ayrı gösterilir.** İlk
  düzenleme ikisini aynı gösteriyordu ve olmayan bir başarısızlığı ekrana
  yazıyordu.
- **Buton adı duruma göre değişmez** ("Yaptım" sabit); yapılıp yapılmadığı
  dolu/boş hali ve durum satırıyla anlatılır.
- **Yenileme günü bilinmeyen abonelik için tahmin üretilmez**; ekranda
  "yenileme günü bilinmiyor" diye açıkça yazılır.
- **Gündüz harcama üstte, akşam (22:00+) alışkanlık üstte** — CSS `order`
  ile, `kararlar.md > Ana ekran saate göre yeniden sıralanır` uyarınca.

## CEVAPLANMAMIŞ SORULAR
- **F1 TV periyodu aylık mı?** (27-08-2026 — vault devlogundan taşındı,
  doğrulanmadı)
- **Aboneliklerin yenileme günleri** hiçbiri bilinmiyor; ekranda dört
  abonelik de "bilinmiyor" olarak görünüyor. (27-08-2026)
- **EUR kuru tahmini**, yalnız USD ölçüldü. (27-08-2026)
- **"Ana" alışkanlık spor seçildi**, kullanıcıya sorulmadı. (27-08-2026)
- **Google Fonts CDN'den yükleniyor.** Çevrimdışı PWA'da yazı tipleri
  düşer; P7'de gömülecek mi, sistem yazı tipine mi dönülecek?
  (27-08-2026 — yeni)

## Dokunulmayacaklar
- `C:\ws\veri\` altındaki `onay-*.json`, `harcama/*.json`, `abonelik.json`
  Claude'un yazdığı dosyalar; Argos kodu bunlara yazmaz.
- GitHub deposu açma ve token üretme — kullanıcının kararı, tek başına
  yapılmaz.

## İlgili notlar
- Roadmap ve bağımlılık haritası: `PROJECT_PLAN.md`
- Kararlar ve mimari: `C:\ws\projeler\Argos\`
- Devlog: `C:\ws\projeler\Argos\calisma\oturum-loglari\`
