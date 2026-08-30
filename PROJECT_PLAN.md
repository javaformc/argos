# PROJECT_PLAN — Argos

> Kararlar vault'ta yaşar: `C:\ws\projeler\Argos\kararlar.md`
> Bu dosya **roadmap ve bağımlılık haritasıdır**; kararları kopyalamaz,
> gerektiğinde vault'a işaret eder. Parça durumu kodla birlikte
> değiştiği için burada, kodun yanında durur.

---

## 1. Özet
**Ne yapıyoruz:** Telefonda çalışan salt gösterici bir PWA — alışkanlık
onayı, bugünkü harcamalar, abonelik takibi.

**Başarı kriteri:** Bir hafta boyunca her akşam Claude'a özet geçiliyor
ve ertesi gün telefonda doğru görünüyor. Ölçülebilir alt şartlar:
tek tuş onay 1 sn içinde ekranda yansıyor; ana ekran veri indikten
sonra 500 ms altında çiziliyor; ay dosyası 300 harcama kaydına kadar
kaydırma takılması yapmıyor.

Ayrıntı ve gerekçeler: `C:\ws\projeler\Argos\ozet.md`

---

## 2. Roadmap

> MILESTONE = onay noktası. Bitince durulur, onay beklenir, git tag atılır.
> PARÇA = tek oturumda bitebilecek iş. Yarım günü aşacaksa ikiye böl.
> P1, P2... **kalıcı numaradır** — bağımlılık haritası buna dayanır,
> sonradan numara değiştirilmez.

### Milestone 1 — Ana ekran yerel veriyle çalışıyor
Hedef: `node dev/sunucu.js` ile açılan sayfa vault'taki gerçek veriyi
gösteriyor; alışkanlık, bugünkü harcama ve yaklaşan abonelik ekranda.

- [x] **P1** — Dev sunucu + veri katmanı soyutlaması (yerel kaynak) — `BITTI`
- [x] **P2** — Hesap çekirdeği: kur çevirme, `ceil` yuvarlama, onay birleştirme, seri, sonraki ödeme — `BITTI`
- [x] **P3** — Ana ekran (telefon düzeni, 22:00 eşiğiyle sıralama) — `BITTI`

### Milestone 2 — Gerçek kanal: veri depodan geliyor, onay geri yazılıyor
Hedef: Telefondan açılan sayfa `argos-veri` deposundan okuyor ve
alışkanlık onayını oraya yazıyor.

- [ ] **P4** — `argos-veri` private deposu + token akışı (ilk açılış, localStorage) — `BEKLIYOR`
- [ ] **P5** — GitHub kaynağı: veri katmanının ikinci uygulaması (okuma) — `BEKLIYOR`
- [ ] **P6** — Onay yazma: `onay-app-YYYY-AA.json` depoya PUT — `BEKLIYOR`
- [x] **P7** — PWA kabuğu: manifest, service worker, çevrimdışı önbellek, gömülü yazı tipi — `BITTI`
- [ ] **P8** — GitHub Pages yayını + telefona ana ekrana ekleme — `BEKLIYOR`

### Milestone 3 — Derinlik ve masaüstü
Hedef: Harcama kırılımına inilebiliyor, abonelik listesi tam görünüyor,
Argos Obsidian içinde sekme olarak açılıyor.

- [x] **P9** — Harcama ayrıntı ağacı: ay → kategori / gün / yer — `BITTI`
- [ ] **P10** — Abonelik listesi ekranı — `BEKLIYOR`
- [ ] **P11** — Obsidian Custom Frames sekmesi — `BEKLIYOR`

---

## 3. Bağımlılık Haritası

```
P1  → bağımsız
P2  → bağımsız
P4  → bağımsız
P3  → P1, P2
P5  → P1, P4
P6  → P5
P7  → P3
P8  → P4, P7
P9  → P2, P3
P10 → P2, P3
P11 → P8
```

**Bağımsız parçalar (tıkanma halinde kaçış yolu):** P1, P2, P4

**Yerel ağ ara adımı (plan dışı, 30-08-2026):** P8 beklerken dev sunucu
`ARGOS_AG=1` ile yerel ağa açılabiliyor ve telefondan `http://<ip>:4173/c/`
ile giriliyor. Service worker orada çalışmaz (güvenli bağlam değil), ama
düzen gerçek cihazda doğrulanabiliyor. P8 bunun yerini alacak.

Not: P1 veri katmanını **kaynak-bağımsız** tanımlar (aynı arayüz, iki
uygulama). P5 tıkanırsa P3 ve sonrası yerel kaynakla ilerlemeye devam
eder — bu ayrım tıkanma kaçışının temeli, kaldırılmamalı.

---

## 4. Durum Takibi

| İşaret | Anlamı | Ne zaman konur |
|---|---|---|
| `BEKLIYOR` | Henüz başlanmadı | Varsayılan |
| `DEVAM` | Üzerinde çalışılıyor | Parça işleme alındığında |
| `BITTI` | Testi geçti, commit atıldı | Test yeşil + commit sonrası |
| `BLOKLU` | Tıkanıldı, bırakıldı | Tıkanma protokolü uygulandıktan sonra |

`BLOKLU` işaretlenen her parça için `C:\ws\projeler\Argos\calisma\sorunlar\`
altında atomik not olmalı. Not yoksa işaret eksiktir.

### Milestone Onay Kaydı
| Milestone | Onay tarihi | Git tag |
|---|---|---|
| 1 | | `milestone-1-onaylandi` |
| 2 | | `milestone-2-onaylandi` |
| 3 | | `milestone-3-onaylandi` |
