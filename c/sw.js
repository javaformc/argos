// Argos C — service worker.
//
// Tek işi var: uygulama ağ olmadan da AÇILSIN. Veriyi çevrimdışı doğru
// göstermek gibi bir iddiası yok — Argos salt gösterici ve gösterdiği şey
// bugünün verisi; bayat bir kopyayı taze gibi sunmak, boş ekran
// göstermekten kötüdür.
//
// STRATEJİ: her şey ÖNCE AĞDAN, olmazsa önbellekten.
//
// Neden "önce önbellek" değil: o strateji daha hızlı ama geliştirme
// sırasında eski dosyayı gösterip yapılan değişikliği görünmez kılıyor —
// ve o yanılgı fark edilmesi en zor olanı, çünkü sayfa çalışıyor gibi
// görünüyor. Dosyalar küçük ve aynı ağdan geliyor; hız farkı ölçülebilir
// değil, yanılma riski ise gerçek.

const ONBELLEK = 'argos-c-v1';

// Uygulamanın açılması için gereken en küçük küme. Veri dosyaları burada
// YOK ve olmayacak: onlar vault'ta yaşıyor ve her açılışta tazelenmeli.
const KABUK = [
  './',
  './index.html',
  './ana.js',
  './ortak.js',
  './harcama.js',
  './aliskanlik.js',
  './stil.css',
  './ikon.svg',
  './uygulama.webmanifest',
  './yazi/yazi.css',
  './yazi/archivo-latin.woff2',
  './yazi/archivo-latin-ext.woff2',
  '../js/hesap.js',
  '../js/veri.js',
  '../js/github.js',
];

self.addEventListener('install', (olay) => {
  // Yeni sürüm beklemeden devralır: bekleyen bir worker, kullanıcının
  // sekmeyi kapatıp açmasına kadar eski kodu servis etmeye devam eder.
  self.skipWaiting();
  olay.waitUntil(
    caches.open(ONBELLEK).then((o) =>
      // addAll atomiktir: tek dosya düşerse hiçbiri yazılmaz. Kabuk yarım
      // önbelleklenirse uygulama çevrimdışı bozuk açılır, hiç açılmamasından
      // daha kötü bir durum.
      o.addAll(KABUK).catch((hata) => {
        console.warn('[sw] kabuk önbelleğe alınamadı:', hata);
      })
    )
  );
});

self.addEventListener('activate', (olay) => {
  olay.waitUntil(
    caches
      .keys()
      .then((adlar) =>
        Promise.all(adlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (olay) => {
  const istek = olay.request;

  // Yazma isteği asla önbelleğe girmez ve asla önbellekten cevaplanmaz.
  // Alışkanlık onayı ağ yoksa BAŞARISIZ olmalı: sessizce kuyruğa alınıp
  // "kaydedildi" demek, kaydedilmemiş bir işareti kaydedilmiş göstermek
  // olurdu ve kullanıcı onu bir daha işaretlemez.
  if (istek.method !== 'GET') return;

  const adres = new URL(istek.url);

  // Veri önbelleğe alınmaz — ne dosya sunucusundan geleni ne GitHub'dan.
  // Bayat harcama toplamı, bugünün toplamı diye okunur; yanlış sayı,
  // sayı yokluğundan kötüdür. GitHub isteklerinde ikinci bir sebep daha
  // var: yanıtlar Authorization başlığıyla alınıyor ve önbellekte
  // tutulan bir kopya, token iptal edildikten sonra da okunabilir olurdu.
  if (adres.pathname.startsWith('/veri/')) return;
  if (adres.hostname === 'api.github.com') return;

  olay.respondWith(
    fetch(istek)
      .then((yanit) => {
        // Yalnız başarılı ve aynı kökenli yanıtlar saklanır.
        if (yanit.ok && yanit.type === 'basic') {
          const kopya = yanit.clone();
          caches.open(ONBELLEK).then((o) => o.put(istek, kopya));
        }
        return yanit;
      })
      .catch(() =>
        caches.match(istek).then((bulunan) => {
          if (bulunan) return bulunan;
          // Gezinme isteği: hangi rotaya gidilirse gidilsin kabuk açılır,
          // rota hash'te olduğu için sayfa kendini doğru çizer.
          if (istek.mode === 'navigate') return caches.match('./index.html');
          return new Response('çevrimdışı', { status: 503 });
        })
      )
  );
});
