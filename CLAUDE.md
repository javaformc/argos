# Argos

> `C:\MY_Code\CLAUDE.md` çalışma disiplinini tanımlar ve geçerlidir.
> Bu dosya onu **ezmez**, sadece bu projeye özel bilgi ekler.
> Orada yazan kuralları (döngü, onay politikası, test disiplini, token
> disiplini) burada **TEKRARLAMA** — iki dosya ayrışırsa hangisinin
> geçerli olduğu belirsizleşir.

## Çalışma Modu
otomatik

## Proje profili
| Alan | Değer |
|---|---|
| Tür | şahsi |
| Arayüz izni | var |

## Ne yapıyoruz
Kişisel ölçüm merkezi. Alışkanlık onayı, günlük harcama ve abonelik
takibini telefonda gösteren bir PWA. **Salt göstericidir** — veriyi
Claude yazar, Argos okur; tek yazma yüzeyi tek tuşluk alışkanlık onayı.

## Vault bağlantısı
- Kararlar, mimari, fikirler: `C:\ws\projeler\Argos\`
- Çalışma notları (atomik): `C:\ws\projeler\Argos\calisma\`
  — `oturum-loglari/`, `sorunlar/`, `secimler/`
- **Veri (kaynak):** `C:\ws\veri\` — vault kökünde, proje içinde değil

## Durum
Son durum: `NEREDE_KALDIK.md`

## Stack
Vanilla HTML + CSS + JS (ES modülleri). **Çatı yok, derleme adımı yok.**
Test koşucusu: Node yerleşik `node:test`. Barındırma: GitHub Pages.

## Komutlar
| Amaç | Komut |
|---|---|
| Kurulum | yok — bağımlılık kullanılmıyor |
| Çalıştır | `node dev/sunucu.js` → http://localhost:4173 |
| Build | yok — statik dosyalar |
| Test | `node --test "test/*.test.js"` |

## Geçerli test katmanları
| Katman | Durum |
|---|---|
| Anlık/işlevsellik | geçerli |
| Veri bütünlüğü (invariant) | geçerli — hesap çekirdeği (yuvarlama, onay birleştirme, seri) |
| Görsel kontrol | geçerli — arayüz değişen her parçada |
| Uzun koşu (soak) | **uygulanmıyor** — durumsuz gösterici, zamanla biriken durum yok |

## Aktif ek araçlar
<!-- Bu proje için kurulan skill/MCP: ne için kuruldu. -->

## Bu projeye özgü tuzaklar
- **Veri deposu ayrı.** Kod `argos` (public), veri `argos-veri` (private).
  Bu depoya asla gerçek veri commit'lenmez — `veri/` `.gitignore`'da.
- **Ham veri yuvarlanmaz.** `ceil` yalnız gösterim anında uygulanır;
  dosyaya yazılan tutar hamdır.
- **Onay dosyaları ikizdir.** `onay-*.json` Claude'un, `onay-app-*.json`
  Argos'un. Argos ikincisinden başkasına yazmaz.
- Kur `veri/kur.json`'dan okunur, koda gömülmez.
