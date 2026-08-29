# LESSONS — tekrar edebilecek hata kalıpları

> **Kural:** ~30 satır sınırı. Şişerse konsolide et, **SİLME.**
> Uzun anlatım değil, uygulanabilir tek satır kural.
> Buraya bir satır **sadece bug bir KALIBA işaret ediyorsa** eklenir.
> Tek seferlik hatalar `C:\ws\projeler\<Proje>\calisma\sorunlar\` altına
> atomik not olarak gider.
> Ayrıntılı anlatım orada durur; buradaki satır ona işaret eder.
>
> Satır formatı: `- <ne yapılmalı> ([[YYYY-AA-GG-sorun-slug]])`
> **Emir kipinde** yaz, gözlem kipinde değil.
> Kötü: "Tarihler bazen UTC geliyordu."
> İyi: "Tarihleri her zaman UTC sakla, sadece gösterirken yerele çevir."

- Renk haritasından renk alan HER yeni liste `renkleriAyir`'dan geçsin;
  sekiz hue on yediden fazla kategoriye yetmiyor ve çakışma yalnız liste
  uzayınca görünür hale geliyor (kategori barlarında tavan 7'den
  kalkınca "Fatura" ile "Diğer" aynı renk oldu).
- Bir listeyi kısaltan tavanı kaldırmadan önce o listenin gizlediği
  başka ne varsa ara: tavan, bir kusuru düzeltmez, görünmez tutar.
