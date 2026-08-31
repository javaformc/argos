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
2. **Abonelik yenileme günleri** — kullanıcı "söyleyeceğim" dedi
   (31-08-2026). Girilince "Sıradaki ödeme" kutusu çalışmaya başlar.
3. **Harcama girişi** — "zamanla ekleyeceğiz" (31-08-2026). Gerçek veri
   akmadan ay sayfaları boş görünmeye devam eder.
4. **Alışkanlık ayrıntı sayfaları** — harcamadaki desenin aynısı. Veri
   zaten dolu, gerçek veriyle test edilebilir.
5. **P10 — abonelik listesi ekranı** planda açık. Daha önce "sayfa
   açılmasın" denmişti (dört abonelik ana ekranda tam görünüyor);
   yenileme günleri girilirse takvim görünümü yeniden değerlendirilecek.

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
27-08-2026'da soruldu, **üçüncü kez taşınıyor** (kullanıcı sürekli
atlıyor; bir sonraki oturumda önce bunlar sorulmalı):
- **F1 TV periyodu aylık mı?**
- **EUR kuru tahmini** — yalnız USD ölçüldü.
- **"Ana" alışkanlık spor seçildi**, sorulmadan.

Kapandı: Google Fonts sorusu (yazı tipi 30-08'de gömüldü), aboneliklerin
yenileme günleri (kullanıcı söyleyeceğini bildirdi, 3. maddede takipte).

## İlgili notlar
- Roadmap ve bağımlılık haritası: `PROJECT_PLAN.md`
- Ders kalıpları: `LESSONS.md`
- Kararlar ve mimari: `C:\ws\projeler\Argos\`
- Devlog: `C:\ws\projeler\Argos\calisma\oturum-loglari\`
