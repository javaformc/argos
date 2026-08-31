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
- Ters bölü içeren metni Bash heredoc'una gömme: bu ortamda `\\` tek `\`
  ye iniyor, yollar ve regex'ler sessizce bozuluyor (`C:\MY_Code` →
  `C:MY_Code`). Öyle metni Edit ile yaz. **Bu kural yazıldıktan sonra iki
  kez daha ihlal edildi** — betik yazmak refleks, kural okunmuyor. Metinde
  `\` görürsen Edit'e geç, betiği düşünme bile.
- Betik hata verse de `&&` zincirindeki sonraki komut çalışabilir: hatalı
  bir düzenleme betiğinin ardından atılan commit, yapılmamış değişikliği
  commit'lemiş gibi görünür. Zinciri kısa tut, çıktıyı oku.
- Metin değiştirirken yerine koymayı FONKSİYONLA ver (`() => yeni`):
  dizgi biçiminde `$` ile başlayan diziler özel desen sayılıyor ve
  içeriği kesiyor.
- Veriye iki taraf yazıyorsa (bilgisayar + telefon), yazmadan önce
  `git pull --ff-only`, yazdıktan sonra `git push`. Pull atlanırsa
  telefonun işareti ezilir ve kullanıcı onu bir daha işaretlemez.
