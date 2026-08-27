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

- ÖRNEK (yer tutucu — ilk gerçek ders eklendiğinde sil): Shell script'lerini
  LF satır sonuyla sakla, CRLF ile çalışmaz.
