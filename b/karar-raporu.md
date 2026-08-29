# Argos B — tasarım karar raporu

Beş referans uygulamanın (Copilot Money, Monarch, Streaks, Exist.io, Oura)
arayüz analizinin Argos'un kısıtlarıyla kesişiminden çıkan kararlar.

**Temel gerilim:** Kullanıcı dört tasarımı reddetti — klişe AI estetiği, yer
israfı, düz-yazı görünümü. İstenen: çeşitlilik, görsel öğe, renk, farklı
boyutlarda hiyerarşi, kullanışlılığı öldürmeden. Aynı anda Argos salt
göstericidir ve referansların yarısı etkileşime dayanır. Bu raporun işi o
boşluğu etkileşim yerine **tipografi, asimetri ve zaman kipiyle** doldurmak.

---

## 1. NEYİ ALIYORUZ

**1.1 Bağlamsız sayı yok** (Copilot). Bugünkü toplamın altında tek satır kıyas:
"Son 7 günün ortalamasından 60 ₺ fazla." Her abonelik satırında aylık toplam
içindeki payı. Kıyas olmayan sayı ikinci haftada anlamını kaybeder ve kullanıcı
bakmayı bırakır — Argos'un tek başarı ölçüsü ona bakmaya devam edilmesidir.

**1.2 Durumu üç kanaldan yedekli kodlama** (Copilot). Alışkanlık durumu:
dolu/boş kütle + renk + Türkçe kelime. Üçünden biri kaybolduğunda bilgi hâlâ
okunur. Kullanıcı ekrana bakmadan, güneşte dokunacak.

**1.3 Belirsizliği birinci sınıf bilgi olarak gösterme** (Exist). Dört
aboneliğin yenileme günü null; bu bir eksiklik değil gösterilecek bilgi:
"Yenileme günleri henüz bilinmiyor." Blok, tarih sütunu boş bırakılmış gibi
değil, o sütun hiç var olmamış gibi tasarlanır.

**1.4 Sayı zorlanmayan yerde kelime** (Oura). Spor ritmi: "Bugün spor günü" /
"Bugün ara günü". Yenileme: "bilinmiyor" — asla `?` veya `—` değil.
Boş gün: `0` + "Bugün kayıt yok".

**1.5 Sayıdan hemen sonra yorum** (Oura + Exist). Ekranda **tam olarak üç**
yorum satırı, blok başına bir. Fazlası Exist'in hatası.

**1.6 Renksiz bilgi kodlaması** (Streaks). Kategori payları için tek hue'nun
3-4 parlaklık kademesi, 12 kategoriye 12 renk değil.

**1.7 Ana metriğin yanındaki her şeyin küçülmesi** (Copilot + Oura). Ekranda
tek bir 64px+ sayı: gündüz harcama toplamı, akşam spor serisi. İkinci en büyük
sayı ondan en az %40 küçük.

**1.8 Etiket küçük ve soluk, değer büyük ve koyu** (beşinde de). Archivo
**variable** ve genişlik ekseni 62-125: Oura'nın serif/sans ile yaptığı işi
Argos tek aileyle yapar — **condensed = etiket ve ham veri, expanded = yorum
cümlesi.** Kütüphanesiz elde edilen tipografik imza budur.

**1.9 Aynı veri türüne aynı biçim** (Oura'nın chevron tutarlılığından).
Parça-bütün ilişkisi taşıyan iki veri (kategori dağılımı, abonelik dağılımı)
**aynı** biçimle: tek satırlık yatay yığın şeridi. İkincisi için grafik icat
edilmez.

**1.10 Kuyruğu toplama** (Monarch). Kategori etiketi en fazla 2 ad + "diğer".

### Alınmayan iyi fikirler (kısıta takıldıkları için)

| Fikir | Kaynak | Neden alınamaz |
|---|---|---|
| Katmanlı yoğunluk / chevron ile derine gitme | Oura, Copilot | İkinci ekran yok |
| Gösterim seçenekleri (segment kontrol) | Monarch | Etkileşim yok |
| Tarih **aralığı** yazma | Monarch | Aralık seçici yok; tek tarih kalır |
| Bölüm başına tema rengi | Oura | Tek ekran — yerine kip rengi |
| Hover ile "buradasın" sinyali | Monarch, Copilot | Dokunmatik, tek ekran |
| Emoji ikonografi | Copilot | Archivo'da yok; ayrıca "klişe AI" reddine girer |
| Uzun geçmiş / trend grafiği | Exist, Copilot | Harcama verisi bugün boş |

---

## 2. NEDEN KAÇINIYORUZ

**2.1 12 kategoriye 12 renk** (Monarch'ın en ağır hatası). Argos'ta tam 12
kategori var — aynı çöküşe gider. **Kural:** renk kategoriyi kodlamaz, kategori
adı yazıyla verilir. Şeritteki renk yalnızca büyüklük sırasını kodlar: en büyük
dilim en koyu, sonrakiler açılarak, dördüncüden sonrası "diğer".

**2.2 12+ dilimli donut** (Monarch). Argos'ta günde 2-6 kayıt var; 3 dilimlik
donut daha da az bilgi taşır. **Kural:** donut/pasta yok.

**2.3 Hiyerarşisiz yoğunluk** (Exist). Argos'ta katmanlama yapılamıyor, tüm
bilgi tek yüzeyde — doğrudan Exist tuzağı. **Kural:** her an tam olarak bir
"birincil" blok var ve dikey alanın en az %35'ini alır.

**2.4 Yedi grafik biçimi tek ekranda** (Exist). "Çeşitlilik" isteğinin yanlış
cevabı biçim sayısını artırmaktır. **Kural:** en fazla iki görsel kodlama
biçimi. Çeşitlilik boyut ve tipografi kontrastıyla karşılanır.

**2.5 Okunamayan etiket** (Exist). Türkçe kelimeler uzun; punto küçültme
baskısı olacak. **Kural:** hiçbir metin 11px altına inmez. Sığmıyorsa punto
değil kelime kısaltılır (önce width 62 ekseni kullanılır).

**2.6 Ürünün ana vaadinin hiyerarşinin dibinde kalması** (Streaks — seri sayısı
okunamıyor). **Kural:** seri sayısı alışkanlık adından büyük puntoda.

**2.7 Bağlamsız "3:00"** (Streaks). **Kural:** ritim tam ifadeyle: "2 günde
bir". Döviz satırı hem orijinal tutarı hem TL karşılığını hem kuru gösterir:
`24 $ · 1.176 ₺ (kur 49)`.

**2.8 Bağlamsız tek büyük sayı** (Oura'nın "88"i). Argos'ta bütçe/hedef yok,
tek referans kendi geçmişi. **Kural:** ana sayının altındaki yorum satırı
zorunlu, boş bırakılamaz. Geçmiş yoksa "Kıyas için henüz yeterli gün yok" der —
satır kaldırılmaz, yoksa yerleşim gün geçtikçe zıplar.

**2.9 Süslemenin veri alanını yemesi** (Oura). **Kural:** sıfır bilgi taşıyan
görsel öğe yok. Görsel zenginlik yalnızca boyut ve ağırlık farkından üretilir.

**2.10 Ekran altında kesik kart** (beşinde de). **Kural:** dikey kaydırmasız
tasarlanır. Yükseklik bütçesi baştan bölünür; içerik büyüdükçe blok büyümez,
içerik kısılır.

**2.11 Görünmez kart sınırı** (Copilot). Argos güneşte açılacak. **Kural:** blok
ayrımı ya belirgin parlaklık farkıyla ya tam boşlukla. Zar zor görünen sınır yok.

**2.12 Kırmızı-yeşil yargı ekseni** (beşinde de ortak zafiyet). Argos v1'de
bütçe yok: "340 ₺ harcadın" iyi de kötü de değil. Renk kodlaması **var olmayan
bir yargıyı uydurur.** **Kural:** tutarlar asla kırmızı/yeşil kodlanmaz.

**2.13 Reddedilen 1. tasarımın deseni.** Koyu zemin + tek doygun amber vurgu +
eşit genişlikte bar dizisi + eşit köşe yarıçaplı kart ızgarası. Bunlardan en
fazla ikisi aynı ekranda.

**2.14 Reddedilen 3. tasarımın deseni.** Üç bloktan en az ikisinde grafiksel
öğe bulunur; hiçbir blok yalnızca metin satırlarından oluşamaz.

---

## 3. ARGOS'A ÖZEL ZORLUKLAR

Referansların hiçbirinde çözülmemiş; kopyalanacak örnek yok.

**3.1 İki alışkanlık — Streaks düzeni çöküyor.** İki daire ızgara değildir,
"eksik ızgara" gibi görünür. **Karar:** eşit ağırlıkta çizilmez.
- **spor** — ana, 2 günde bir. Büyük kart. Seri sayısı bloğun en büyük öğesi.
  Ara gününde atlanan gün seriyi bozmaz — bu mantık ekranda görünür olmalı.
- **erken-uyku** — her gün, ikincil. İnce yatay şerit, aynı bilgi tek satırda.

Bu asimetri, istenen "farklı boyutlarda hiyerarşi"nin bedava kaynağıdır.
Dokunma hedefi: spor 72×72px, erken-uyku 44×44px minimum.

**3.2 Dört abonelik, yenileme günü bilinmiyor.** Bloğun ana vaadi ("yaklaşan
ödeme") veri yokluğundan boşta. **Karar:** kesin olanı büyüt, belirsiz olanı
dürüstçe küçült. Ana sayı `2.501 ₺` (aylık toplam), "yaklaşan ödeme" değil.
**Tuzak:** `24 $` satırını sessizce TL'ye çevirmek — kur görünür olmalı.
**İkinci tuzak:** yüzdelerde `ceil` uygulanırsa toplam %100'ü aşar (4 satırda
bu görünür bir hata). Yüzdelerde normal yuvarlama, artık en büyük paya yüklenir.

**3.3 Harcama verisi boş — ilk haftanın NORMAL hali.** Referansların beşi de
dolu veriyle tasarlanmış. **Üç kural:**
1. **İskelet çökmez.** Boş blok, dolu bloğun yüksekliğini kaplar. İlk kayıt
   geldiğinde yerleşim zıplamaz, sadece dolar.
2. **Boş durum hata tonunda olmaz.** Kırmızı, ünlem, uyarı ikonu, "veri
   bulunamadı" yok. Boş gün geçerli bir gündür.
3. **Kıyas eşiği:** en az 3 dolu gün. Altındaysa "Kıyas için henüz yeterli gün
   yok." Bir günlük veriyle "ortalamanın %300 üstünde" demek güveni yok eder.

6'dan fazla kayıt gelirse liste 6 satırda kalır, fazlası "+3 kayıt daha".

**3.4 Sıfır etkileşim.** Katmanlı yoğunluk imkânsız. **Karar:** Argos'un
katmanlama ekseni mekân değil **zaman**. 22:00 kuralı bir yerleşim detayı
değil, Argos'un progressive disclosure'ıdır:
- Gündüz: "gün sürüyor" — bugüne kadar ne harcandı, tek tek hangi kayıtlar.
- Akşam: "günü kapat" — alışkanlıklar işaretlendi mi, gün toplamda nasıl geçti.
  Tek tek kayıtlar artık gereksiz; toplam ve dağılım yeter.

Kip değişimi blokların sırasını **ve detay seviyesini** değiştirir. Chevron'un
işini saat yapar — referansların hiçbirinde olmayan mekanizma, ve istenen
"çeşitlilik"in kaynağı: aynı ekran günde iki farklı yüz gösterir.

**3.5 Tek ekran, yükseklik bütçesi sabit.** Bütçe tasarımın **girdisidir**.
PWA standalone'da 844px'in ~763px'i kullanılabilir. **Yan sonuç:**
"kaydırılabilir" ipucu vermek yasaktır — yarım kesik blok, solan kenar
gradyanı, kaydırma çubuğu yok.

**3.6 Türkçe + tek aile + sıfır kütüphane.**
- **(a) Büyük harf tuzağı — kritik.** CSS `text-transform: uppercase` Türkçe'de
  "i" harfini "I" yapar; doğrusu "İ". `ABONELIKLER`, `ICLOUD` gibi çıktılar
  tasarımı anında amatör gösterir. **Kural:** metin doğrudan büyük harfle
  yazılır, ya da `lang="tr"` verilir ve çıktı gözle doğrulanır.
- **(b) Türkçe %20-30 daha uzun.** Punto küçültmeden önce width 62 kullanılır.
- **(c) Tek aile, iki ses.** width 62 + weight 600 = veri/etiket sesi;
  width 110-125 + weight 400 = yorum sesi. Tutarsız uygulanırsa ekran tek sesli
  ve sıradan görünür — 1. tasarımda reddedilen şey.
- **(d) Kütüphane yok.** Yığın şeridi CSS flex, halka `conic-gradient` veya
  inline SVG. "En fazla iki görsel biçim" kuralının teknik gerekçesi budur.
- **(e) İki tema.** Kategori kademelerinin parlaklık sırası **her iki temada da
  aynı yönde** olmalı. Koyu temada "koyu = büyük" mantığı ters döner; tema
  geçişinde sessizce bozulan tipik hata.

---

## 4. EKRAN İSKELETİ

390 × 844 CSS px. Kullanılabilir dikey alan ≈ 763px. Kenar boşluğu 20px,
içerik genişliği 350px.

### 4.1 Yükseklik bütçesi

| Bölüm | Gündüz | Akşam (22:00+) |
|---|---|---|
| Üst şerit | 32 | 32 |
| Birincil blok | 314 (harcama) | 296 (alışkanlık) |
| İkincil blok | 200 (alışkanlık) | 216 (harcama özeti) |
| Üçüncül blok | 174 (abonelik) | 174 (abonelik) |
| Blok araları (2 × 20) | 40 | 40 |
| **Toplam** | **760** | **758** |

Bütçe aşıldığında blok büyümez; kayıt satırı veya kategori etiketi kısılır.

### 4.2 GÜNDÜZ KİPİ (00:00 – 21:59)

```
┌────────────────────────────────────────────────┐ ─┐
│ 27 AĞUSTOS ÇARŞAMBA                     14:32  │  │ 32
├────────────────────────────────────────────────┤ ─┘
│ BUGÜN                                          │ 11px / w62 / soluk
│                                                │
│  340 ₺                                         │ 72px / w100 / 700
│                                                │ (₺ 28px, taban hizalı)
│  Son 7 günün ortalamasından 60 ₺ fazla.        │ 14px / w118 / 400
│                                                │
│  ████████████████████▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░      │ 14px yükseklik
│  yeme-içme %53 · ulaşım %29 · diğer %18        │ 12px / w62
│                                                │
│  12:40   yeme-içme    Kampüs kantin    120 ₺   │ ─┐
│  11:05   market       —                 95 ₺   │  │ 6 × 24px
│  09:15   ulaşım       —                 35 ₺   │  │ tutar sağa hizalı
│  08:50   yeme-içme    —                 60 ₺   │  │ tabular-nums
│  —       teknoloji    —                 30 ₺   │ ─┘
├────────────────────────────────────────────────┤  314
│  ┌──────────────────────────────┐  ┌────────┐  │ ─┐
│  │ SPOR        2 günde bir      │  │        │  │  │
│  │  14                          │  │   ✓    │  │  │ 120
│  │  GÜNDÜR                      │  │ 72×72  │  │  │
│  │  Bugün spor günü             │  └────────┘  │  │
│  └──────────────────────────────┘              │ ─┘
│  ┌──────────────────────────────┐  ┌────────┐  │ ─┐
│  │ ERKEN UYKU  6 gündür bekliyor│  │  44×44 │  │  │ 64
│  └──────────────────────────────┘  └────────┘  │ ─┘
├────────────────────────────────────────────────┤  200
│  AYLIK ABONELİK YÜKÜ                           │ 11px / w62
│  2.501 ₺                                       │ 36px / w100 / 700
│  ███████████████▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░▒       │ 10px
│                                                │
│  Claude Code personal  24 $ ·1.176 ₺  %47      │ ─┐
│  Claude Code work            1.000 ₺  %40      │  │ 4 × 22
│  F1 TV                         285 ₺  %11      │  │
│  iCloud                         40 ₺   %2      │ ─┘
│  Yenileme günleri henüz bilinmiyor · kur 49    │ 11px / soluk
└────────────────────────────────────────────────┘  174
```

**Neden böyle:** Üst şerit kartsız, tek satır — "üstte tarih yer kaplıyor"
reddine düşmemek için; ama gerçek tarih yazılır. 340 ₺ ekranın tek 72px sayısı,
çevresi boş. Yorum satırı sayıyı bağlamsız bırakmama kuralı. Yığın şeridi kabul
edilmiş öğe (A seçeneği), parça-bütün için tek biçim, kuyruk toplanmış, renk
büyüklük sırası kodluyor. Kayıt listesi ham gerçek — tek başına blok olsaydı
3. tasarımın hatası olurdu, üstündeki grafik ve dev sayıyla dengelenmiş.

### 4.3 AKŞAM KİPİ (22:00 – 23:59)

```
┌────────────────────────────────────────────────┐ ─┐
│ 27 AĞUSTOS ÇARŞAMBA                     22:40  │  │ 32
├────────────────────────────────────────────────┤ ─┘
│ GÜNÜ KAPAT                                     │ 11px / w62
│  ┌──────────────────────────────┐  ┌────────┐  │ ─┐
│  │ SPOR            2 günde bir  │  │        │  │  │
│  │  14                          │  │   ✓    │  │  │ 140
│  │  GÜNDÜR                      │  │ 72×72  │  │  │
│  │  Bugün spor günü — yapıldı.  │  └────────┘  │  │
│  └──────────────────────────────┘              │ ─┘
│  ┌──────────────────────────────┐  ┌────────┐  │ ─┐
│  │ ERKEN UYKU      her gün      │  │        │  │  │
│  │  6                           │  │ 72×72  │  │  │ 140
│  │  GÜNDÜR                      │  │        │  │  │
│  │  02:00'ye 3 saat 20 dk var.  │  └────────┘  │  │
│  └──────────────────────────────┘              │ ─┘
├────────────────────────────────────────────────┤  296
│ BUGÜN HARCANAN                                 │ 11px / w62
│  340 ₺                                         │ 44px / w100 / 700
│  ████████████████████▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░      │ 14px
│  yeme-içme %53 · ulaşım %29 · diğer %18        │ 12px
│                                                │
│  5 kayıt · son kayıt 12:40                     │ 13px / w118
│  Son 7 günün ortalamasından 60 ₺ fazla.        │ 14px / w118
├────────────────────────────────────────────────┤  216
│  AYLIK ABONELİK YÜKÜ                           │
│  2.501 ₺                                       │ 36px
│  ███████████████▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░▒       │
│  (aynı dört satır ve dipnot)                   │
└────────────────────────────────────────────────┘  174
```

**Gündüzden farklar:** Alışkanlık üste taşındı — 22:00 "erken uyku" kararının
verildiği andır, o alışkanlık artık spor ile eşit ağırlıkta. Erken uyku
kartında geri sayım: "02:00'ye 3 saat 20 dk var" — hesaplanabilir ve akşama
özel tek bilgi. Kayıt listesi kapandı, yerine "5 kayıt · son kayıt 12:40"
özeti. Harcama sayısı 72→44px indi: akşam en büyük sayı `14` (seri) olur.
Zemin tonu bir kademe koyulaşır — kip, blok sırası okunmadan anlaşılır.
Abonelik bloğu değişmez, sabit çapa görevi görür.

### 4.4 Boş durum

Gündüz harcama bloğu **aynı 314px'i** kaplar: `0 ₺` soluk tonda, "Bugün kayıt
yok.", nötr boş şerit, kayıt alanı boş ama çökmemiş. Kıyas eşiği dolmamışsa
"Kıyas için henüz yeterli gün yok." Uyarı rengi, ünlem, ikon yok.

### 4.5 Renk sistemi

| Rol | Kullanım | Kural |
|---|---|---|
| Nötr eksen | Zemin, blok, metin | Blok-zemin farkı gözle ayırt edilebilir |
| Hue 1 — veri | Yığın şeridi kademeleri | Tek hue, 3-4 parlaklık kademesi; en büyük dilim en yüksek kontrast; her iki temada aynı yönde |
| Hue 2 — durum | Alışkanlık "yapıldı" | Yalnızca bu iş için, başka yerde görünmez |

Toplam hue ≤ 3 (nötrler hariç). Kırmızı-yeşil yargı ekseni yok. Renk kategoriyi
kodlamaz.

---

## 5. KABUL KRİTERLERİ

Her madde tek ekran görüntüsüne bakılarak evet/hayır cevaplanabilir.
Eleştiri turlarında kontrol listesi olarak kullanılır.

**Yerleşim ve bütçe**
1. Ekran 390×844'te dikey kaydırma olmadan tamamen görünür; hiçbir blok alt kenarda kesilmez.
2. Kaydırılabilirlik ima eden öğe yok: yarım kesik blok, kenar gradyanı, kaydırma çubuğu.
3. Boş ve dolu harcama durumunda bloklar **aynı** dikey konumlarda başlıyor.
4. Metin girişi, açılır liste, tarih seçici, arama kutusu, filtre veya sekme çubuğu yok.

**Hiyerarşi**
5. Ekranda 64px veya üstünde tam olarak **bir** sayı var.
6. İkinci en büyük sayı, en büyükten en az %40 küçük.
7. Gündüz üstten ilk büyük blok harcama; akşam üstten ilk büyük blok alışkanlık.
8. Gündüz iki alışkanlık eşit boyutta **değil**; ızgara görünümü yok.
9. Seri sayısının puntosu, alışkanlık adının puntosundan büyük.
10. Birincil blok, kullanılabilir dikey alanın en az %35'ini kaplıyor.

**Bağlam ve dürüstlük**
11. Her büyük sayının 1 satır altında bağlam var: kıyas, oran veya "kıyas için yeterli gün yok". Bağlamsız büyük sayı yok.
12. Yenileme günü bilinmeyen abonelikler için hiçbir tarih, gün sayısı, "~", "?" veya tahmin görünmüyor; "bilinmiyor" yazıyor.
13. Döviz abonelik satırında orijinal tutar, TL karşılığı ve kullanılan kur görünüyor.
14. Tüm tutarlar tam sayı; kuruş/ondalık yok.
15. Abonelik yüzdelerinin toplamı tam 100 ediyor.
16. Boş durumda uyarı rengi, ünlem veya "veri bulunamadı" tonu yok.

**Renk ve kodlama**
17. Nötr griler dışında en fazla **3** hue var.
18. Gri tonlamada şu üçü hâlâ okunuyor: alışkanlık durumu, kategori paylarının büyüklük sırası, blok sınırları.
19. Renkli her görsel öğenin yanında yazılı etiketi veya sayısı var; yalnız renkle temsil edilen bilgi yok.
20. Hiçbir tutar kırmızı veya yeşil değil.
21. En fazla **2** farklı görsel kodlama biçimi var; parça-bütün taşıyan iki veri de aynı biçimle çizilmiş.
22. Donut, pasta veya halka-dilim grafiği yok.

**Tipografi ve dil**
23. Hiçbir metin 11px altında değil.
24. Türkçe büyük harfli etiketlerde "İ" doğru; `ABONELIKLER`, `ICLOUD` tipi bozulma yok.
25. En az iki farklı Archivo genişlik değeri kullanılmış ve ayrım tutarlı: hiçbir yorum condensed, hiçbir sayı expanded değil.
26. Tam olarak 3 yorum cümlesi var (blok başına bir).
27. Hiçbir metin taşmıyor veya `…` ile kesilmiyor.

**Etkileşim ve dokunma**
28. Dokunulabilir öğe sayısı tam 2; başka tıklanabilir görünen öğe yok.
29. Spor onay hedefi en az 72×72px, erken-uyku onay hedefi en az 44×44px.
30. Chevron (›), "..." menüsü veya "derine git" ipucu yok.

**Reddedilen desen kontrolü**
31. Şu kombinasyon yok: koyu zemin + tek doygun amber vurgu + eşit genişlikte bar dizisi + eşit köşe yarıçaplı kart ızgarası (en fazla ikisi bir arada).
32. Üç bloktan en az ikisinde grafiksel öğe var; hiçbir blok yalnızca metin satırlarından oluşmuyor.
33. Sıfır bilgi taşıyan dekoratif öğe yok: arka plan görseli, doku, süs gradyanı, emoji ikon.
34. Blok sınırları gözle ayırt edilebiliyor (2-3 birimlik parlaklık farkı yeterli sayılmaz).

**Tema**
35. Açık ve koyu temada kategori kademelerinin büyüklük sırası aynı yönde okunuyor.
36. Akşam kipinin zemin tonu gündüzden ayırt edilebiliyor.
