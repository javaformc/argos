# B seçeneği

A seçeneği (kök dizindeki `index.html`, `stil.css`, `js/ana.js`) **korunuyor**.
Bu klasör ikinci bir arayüz denemesidir; aynı veriyi ve aynı hesap çekirdeğini
kullanır, yalnız sunum katmanı farklıdır.

- Adres: http://localhost:4173/b/index.html (gerçek veri) ·
  http://localhost:4174/b/index.html (örnek veri).
  Dev sunucu klasör isteğine index.html servis etmiyor; `/b/` 404 döner,
  dosya adı yazılmalı.
- Ortak kod: `../js/hesap.js`, `../js/veri.js` — bu klasörden değiştirilmez.
- Bu klasörde yalnız `index.html`, `stil.css`, `ana.js` bulunur.

Tasarım süreci: beş referans uygulamanın analizi, ihtiyaç raporu ve
beş turluk eleştir/düzelt döngüsü. Rapor: `karar-raporu.md`
