# Nerede kaldık — Argos
SON GÜNCELLEME: 31-08-2026 | HEAD: 1e4bcb2 | testler: 40/40 yeşil

## Şu an ne durumdayız
**Argos yayında ve uçtan uca çalışıyor.** https://javaformc.github.io/argos/c/

30-08-2026'da Milestone 2'nin beş parçası da bitti; kullanıcı telefonundan
iki alışkanlık işaretledi ve ikisi de depoya commit olarak düştü.

- Arayüzde üç seçenek var, **C seçildi**. A (`/`) ve B (`/b/`) fikir olarak
  duruyor, silinmiyor; bütün geliştirme `/c/` üzerinde.
- Harcamanın ayrıntı ağacı bitti: `#harcama/<ay>` · `#kategori/<ay>/<ad>` ·
  `#gun/<tarih>` · `#yer/<ay>/<ad>`
- Obsidian'da **Custom Frames** eklentisiyle sekme olarak açılıyor.

## İki depo, iki rol
| Depo | Görünürlük | İçerik |
|---|---|---|
| `javaformc/argos` | public | kod; GitHub Pages buradan yayınlıyor |
| `javaformc/argos-veri` | **private** | harcama, alışkanlık, abonelik |

Veri `C:\MY_Code\argos-veri` klasöründe (Drive'ın dışında).
**Yazmadan önce `git pull --ff-only`, yazdıktan sonra `git push`** —
gerekçesi proje `CLAUDE.md > Veri senkronu`. Atlanırsa telefonun işareti
sessizce ezilir.

## Sıradaki iş
1. **Milestone 2 onayı bekliyor.** Kullanıcı biraz kullanacak; onay
   gelince `milestone-2-onaylandi` tag'i atılacak.
2. **Harcama girişi** — "zamanla ekleyeceğiz" (31-08-2026). Gerçek veri
   akmadan ay sayfaları boş görünmeye devam eder.
3. **Alışkanlık ayrıntı sayfaları** — harcamadaki desenin aynısı. Veri
   zaten dolu, gerçek veriyle test edilebilir.
4. **P10 — abonelik listesi ekranı** planda açık. Daha önce "sayfa
   açılmasın" denmişti (dört abonelik ana ekranda tam görünüyor).
   Yenileme günleri 31-08'de girildi; takvim görünümü yeniden
   değerlendirilebilir ama hâlâ dört satırlık bir veri.

## Bu oturumda öğrenilen üç tuzak
Üçü de `LESSONS.md`'de:
- Bash heredoc bu ortamda `\\` dizisini tek `\` yapıyor; ters bölü içeren
  metni Edit ile yaz.
- `String.replace`'te yerine koymayı fonksiyonla ver, `$` desenleri
  içeriği kesiyor.
- İki taraflı veride pull/push disiplini.

Ayrıca: **`env(safe-area-inset-top)` iPhone 13'te standalone kipte sıfır
dönüyor.** Çentik boşluğu `max(env(...), 44px)` ile garantiye alındı.

## Dokunulmayacaklar
- **İşaretleme testi 4173'te yapılmaz** — o sunucu gerçek veriye yazar.
  Tek tuş onayı denemek için her zaman 4174 (örnek veri).
- A ve B silinmez.
- `C:\ws\veri-eski-2026-08-30` — taşınan verinin eski hâli, kullanıcı
  isterse kaldırır.

## CEVAPLANMAMIŞ SORULAR
27-08-2026'da soruldu, **üçüncü kez taşınıyor**:
- **EUR kuru tahmini** — yalnız USD ölçüldü, EUR doğrulanmadı.
- **"Ana" alışkanlık spor seçildi**, sorulmadan.

Kapandı: Google Fonts (yazı tipi 30-08'de gömüldü) · F1 TV periyodu
(aylık, 31-08) · abonelik yenileme günleri (31-08 girildi).

## İlgili notlar
- Roadmap ve bağımlılık haritası: `PROJECT_PLAN.md`
- Ders kalıpları: `LESSONS.md`
- Kararlar ve mimari: `C:\ws\projeler\Argos\`
- Devlog: `C:\ws\projeler\Argos\calisma\oturum-loglari\`
