# Nerede kaldık — Argos
SON GÜNCELLEME: 31-08-2026 | HEAD: 033fa3b | testler: 49/49 yeşil

## Argos bitti ve kullanımda
**https://javaformc.github.io/argos/c/** — telefonda ana ekranda,
bilgisayarda Obsidian sekmesinde (Custom Frames).

**Üç milestone da onaylandı ve tag'lendi (31-08-2026).** Roadmap'te
işaretlenmemiş parça kalmadı. Bundan sonrası kullanım sırasında çıkan
istekler ve düzeltmeler — plan dosyası artık yeni parça beklemiyor.

## Ekranlar
| Rota | Ne gösterir |
|---|---|
| (boş) | ana ekran — bugün |
| `#harcama/<ay>` | ayın tamamı: halka, ay grafiği, birikimli, hafta günü, saat, nereye, en büyük 5, gün gün döküm |
| `#kategori/<ay>/<ad>` | o kalem: günlük maliyet, işlem başına, o kategorinin günleri ve mekânları |
| `#gun/<tarih>` | o gün: toplam, kategori halkası, ayın içindeki yeri |
| `#yer/<ay>/<ad>` | o mekân: ziyaret başına, o mekânın günleri |
| `#aliskanlik/<id>` | ısı haritası, haftanın günü deseni, rekor, işaret dökümü |
| `#abonelik` | ödeme takvimi, pay (aylık + yıllık), sırayla tam liste |

**Kapılar:** ana ekrandaki bloğun/kartın TAMAMI tıklanabilir (küçük bir ok
işaret eder). Kategori barları, halka dilimleri, ay grafiği sütunları ve
gün başlıkları da kapı. Dokunmatikte grafik sütunu iki aşamalı: ilk
dokunuş tutarı yazar, ikincisi o güne gider.

## İki depo
| Depo | Görünürlük | İçerik |
|---|---|---|
| `javaformc/argos` | public | kod; GitHub Pages buradan yayınlıyor |
| `javaformc/argos-veri` | **private** | harcama, alışkanlık, abonelik |

Veri `C:\MY_Code\argos-veri` klasöründe (Drive'ın dışında).
**Yazmadan önce `git pull --ff-only`, yazdıktan sonra `git push`** —
gerekçesi proje `CLAUDE.md > Veri senkronu`. Atlanırsa telefonun işareti
sessizce ezilir.

## Sıradaki iş: kullanım
Kullanıcının sözü (31-08-2026): *"dışarı çıktığımda harcama yaptığımda
parça parça söyleyeceğim, birikecek."*

Yani artık akış şu: kullanıcı harcama anlatır → `argos-veri`ye yazılır →
push → telefonda görünür. Veri biriktikçe ekranlar dolacak; şu an
harcama tarafı boş, alışkanlıkta iki işaret var.

**Veri birikince gözden geçirilecekler** (bugünkü tasarım kararları örnek
veriye göre verildi):
- Döküm listesi ayda 100+ kayıtta nasıl görünüyor
- Kategori sayısı sekiz hue'yu aşarsa çakışma çözücü ne yapıyor
- Isı haritası penceresi büyüdükçe telefonda okunur kalıyor mu

## Dokunulmayacaklar
- **İşaretleme testi 4173'te yapılmaz** — o sunucu gerçek veriye yazar.
  Tek tuş onayı denemek için her zaman 4174 (örnek veri).
- A (`/`) ve B (`/b/`) silinmez; birer fikir olarak duruyor.
- `C:\ws\veri-eski-2026-08-30` — taşınan verinin eski hâli, kullanıcı
  isterse kaldırır.

## CEVAPLANMAMIŞ SORULAR
Yok. 27-08'den beri açık duran beş sorunun hepsi 30–31 Ağustos'ta
kapandı (Google Fonts, F1 TV periyodu, abonelik yenileme günleri, EUR
kuru, ana alışkanlık).

## Bilinen sınır
Yıllık abonelikler ödeme takviminde görünmüyor: veri modeli yalnız ayın
gününü tutuyor, hangi ayda çıktığını tutmuyor. Şu an yıllık abonelik yok;
girilirse sayfa dipnotta "N yıllık abonelik takvimde yok" der ve veri
modeline ay alanı eklemek gerekir.

## İlgili notlar
- Roadmap ve onay kaydı: `PROJECT_PLAN.md`
- Ders kalıpları: `LESSONS.md`
- Kararlar ve mimari: `C:\ws\projeler\Argos\`
- Devlog: `C:\ws\projeler\Argos\calisma\oturum-loglari\`
