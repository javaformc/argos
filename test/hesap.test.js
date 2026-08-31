import test from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../js/hesap.js';

const KUR = { USD: 49, EUR: 57 };

// --- Para ---------------------------------------------------------------

test('yuvarlama her zaman yukarı', () => {
  assert.equal(h.yuvarla(12.1), 13);
  assert.equal(h.yuvarla(12.5), 13);
  assert.equal(h.yuvarla(12.9), 13);
  assert.equal(h.yuvarla(13), 13, 'tam sayı büyütülmemeli');
  assert.equal(h.yuvarla(0), 0);
});

test('TL çevrimi yuvarlamaz, gösterim yuvarlar', () => {
  assert.equal(h.tryeCevir(24, 'USD', KUR), 1176);
  assert.equal(h.tryeCevir(12.5, 'TRY', KUR), 12.5, 'TRY dokunulmadan geçer');
  assert.equal(h.gosterimTL(12.5, 'TRY', KUR), 13);
});

test('bilinmeyen para birimi sessizce sıfırlanmaz, hata verir', () => {
  assert.throws(() => h.tryeCevir(10, 'GBP', KUR), /GBP/);
});

// --- Tarih --------------------------------------------------------------

test('gün anahtarı yerel saatte üretilir, ay/gün sıfır dolgulu', () => {
  assert.equal(h.gunAnahtari(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(h.ayAnahtari(new Date(2026, 7, 27)), '2026-08');
});

test('gün farkı ve kaydırma ay/yıl sınırını aşar', () => {
  assert.equal(h.gunFarki('2026-09-01', '2026-08-30'), 2);
  assert.equal(h.gunKaydir('2026-01-01', -1), '2025-12-31');
  assert.equal(h.gunKaydir('2026-02-28', 1), '2026-03-01', '2026 artık yıl değil');
});

// --- Onay birleştirme ---------------------------------------------------

const onay = (tarih, aliskanlik, durum, damga, kaynak) => ({
  tarih,
  aliskanlik,
  durum,
  damga,
  kaynak,
});

test('çakışan onayda damgası yeni olan kazanır', () => {
  const claude = [onay('2026-08-27', 'spor', 'yapilmadi', '2026-08-27T20:00:00+03:00', 'claude')];
  const app = [onay('2026-08-27', 'spor', 'yapildi', '2026-08-27T22:30:00+03:00', 'app')];

  const ileri = h.onaylariBirlestir(claude, app);
  const geri = h.onaylariBirlestir(app, claude);

  assert.equal(ileri.length, 1, 'aynı gün+alışkanlık tek kayda inmeli');
  assert.equal(ileri[0].durum, 'yapildi');
  assert.deepEqual(geri, ileri, 'birleştirme liste sırasından bağımsız olmalı');
});

test('çakışmayan onaylar korunur, boş liste sorun çıkarmaz', () => {
  const birlesik = h.onaylariBirlestir(
    [onay('2026-08-26', 'spor', 'yapildi', '2026-08-26T21:00:00+03:00', 'claude')],
    [],
    undefined
  );
  assert.equal(birlesik.length, 1);
});

// --- Beklenti ve seri ---------------------------------------------------

const SPOR = { id: 'spor', ad: 'Spor', ana: true, siklik: { tip: 'gun-arasi', deger: 2 } };
const UYKU = { id: 'erken-uyku', ad: 'Erken uyku', ana: false, siklik: { tip: 'gunluk' } };

test('gün-arası: dün yapıldıysa bugün beklenmez, iki gün önceyse beklenir', () => {
  const dun = [onay('2026-08-26', 'spor', 'yapildi', '2026-08-26T21:00:00+03:00', 'app')];
  const oncekiGun = [onay('2026-08-25', 'spor', 'yapildi', '2026-08-25T21:00:00+03:00', 'app')];

  assert.equal(h.bugunBekleniyorMu(SPOR, dun, '2026-08-27'), false);
  assert.equal(h.bugunBekleniyorMu(SPOR, oncekiGun, '2026-08-27'), true);
});

test('hiç kayıt yoksa alışkanlık beklenir', () => {
  assert.equal(h.bugunBekleniyorMu(SPOR, [], '2026-08-27'), true);
  assert.equal(h.bugunBekleniyorMu(UYKU, [], '2026-08-27'), true);
});

test('günlük seri bugün işaretlenmemişken kopmuş sayılmaz', () => {
  const onaylar = [
    onay('2026-08-25', 'erken-uyku', 'yapildi', 'a', 'app'),
    onay('2026-08-26', 'erken-uyku', 'yapildi', 'b', 'app'),
  ];
  assert.equal(h.seriHesapla(UYKU, onaylar, '2026-08-27'), 2);

  const bugunDe = onaylar.concat(onay('2026-08-27', 'erken-uyku', 'yapildi', 'c', 'app'));
  assert.equal(h.seriHesapla(UYKU, bugunDe, '2026-08-27'), 3);
});

test('günlük seri araya giren yapılmadı ile kopar', () => {
  const onaylar = [
    onay('2026-08-24', 'erken-uyku', 'yapildi', 'a', 'app'),
    onay('2026-08-25', 'erken-uyku', 'yapilmadi', 'b', 'app'),
    onay('2026-08-26', 'erken-uyku', 'yapildi', 'c', 'app'),
  ];
  assert.equal(h.seriHesapla(UYKU, onaylar, '2026-08-27'), 1);
});

test('gün-arası seri turu sayar, günü değil', () => {
  const onaylar = [
    onay('2026-08-21', 'spor', 'yapildi', 'a', 'app'),
    onay('2026-08-23', 'spor', 'yapildi', 'b', 'app'),
    onay('2026-08-25', 'spor', 'yapildi', 'c', 'app'),
  ];
  assert.equal(h.seriHesapla(SPOR, onaylar, '2026-08-26'), 3);
});

test('gün-arası seri, izin verilen aralık aşılınca kopar', () => {
  const onaylar = [
    onay('2026-08-15', 'spor', 'yapildi', 'a', 'app'),
    onay('2026-08-25', 'spor', 'yapildi', 'b', 'app'),
  ];
  assert.equal(h.seriHesapla(SPOR, onaylar, '2026-08-26'), 1, 'aradaki 10 gün seriyi kesmeli');
});

test('gün-arası seri, son işaret bayatladıysa sıfırlanır', () => {
  const onaylar = [onay('2026-08-20', 'spor', 'yapildi', 'a', 'app')];
  assert.equal(h.seriHesapla(SPOR, onaylar, '2026-08-27'), 0);
});

// --- Harcama ------------------------------------------------------------

const H = [
  { tarih: '2026-08-27', tutar: 250, birim: 'TRY', kategori: 'yeme-icme', alt: 'kahve' },
  { tarih: '2026-08-27', tutar: 12.5, birim: 'TRY', kategori: 'market' },
  { tarih: '2026-08-27', tutar: 2, birim: 'USD', kategori: 'teknoloji' },
  { tarih: '2026-08-26', tutar: 900, birim: 'TRY', kategori: 'market' },
];

test('günün harcamaları ayrılır ve ham toplanır', () => {
  const bugun = h.gununHarcamalari(H, '2026-08-27');
  assert.equal(bugun.length, 3);
  assert.equal(h.toplamTL(bugun, KUR), 250 + 12.5 + 98);
});

test('kategori kırılımı büyükten küçüğe sıralanır', () => {
  const kirilim = h.kategoriKirilimi(h.gununHarcamalari(H, '2026-08-27'), KUR);
  assert.deepEqual(
    kirilim.map((k) => k.kategori),
    ['yeme-icme', 'teknoloji', 'market']
  );
});

test('birim yazılmamış harcama TRY sayılır', () => {
  assert.equal(h.toplamTL([{ tutar: 10, kategori: 'diger' }], KUR), 10);
});

// --- Abonelik -----------------------------------------------------------

const ABONE = [
  { ad: 'Claude Code (work)', tutar: 1000, birim: 'TRY', periyot: 'aylik', yenileme_gunu: null, aktif: true },
  { ad: 'Claude Code (personal)', tutar: 24, birim: 'USD', periyot: 'aylik', yenileme_gunu: 3, aktif: true },
  { ad: 'F1 TV', tutar: 285, birim: 'TRY', periyot: 'aylik', yenileme_gunu: 29, aktif: true },
  { ad: 'Kapalı', tutar: 500, birim: 'TRY', periyot: 'aylik', yenileme_gunu: 1, aktif: false },
];

test('aylık toplam yalnız aktifleri sayar, yıllığı 12ye böler', () => {
  assert.equal(h.aylikAbonelikToplami(ABONE, KUR), 1000 + 1176 + 285);
  const yillik = [{ tutar: 1200, birim: 'TRY', periyot: 'yillik', aktif: true }];
  assert.equal(h.aylikAbonelikToplami(yillik, KUR), 100);
});

test('yenileme günü bilinmiyorsa tahmin üretilmez', () => {
  assert.equal(h.sonrakiYenileme(ABONE[0], '2026-08-27'), null);
});

test('yenileme günü geçtiyse gelecek aya taşınır, yıl sınırını aşar', () => {
  assert.equal(h.sonrakiYenileme(ABONE[1], '2026-08-27'), '2026-09-03');
  assert.equal(h.sonrakiYenileme(ABONE[1], '2026-08-03'), '2026-08-03', 'bugünse bugündür');
  assert.equal(h.sonrakiYenileme({ yenileme_gunu: 3 }, '2026-12-27'), '2027-01-03');
});

test('ayın 31i olmayan ayda son güne çekilir', () => {
  assert.equal(h.sonrakiYenileme({ yenileme_gunu: 31 }, '2026-02-01'), '2026-02-28');
});

test('yaklaşan ödemeler yakından uzağa, pencere dışı elenir', () => {
  const yaklasan = h.yaklasanOdemeler(ABONE, '2026-08-27', 7);
  assert.deepEqual(
    yaklasan.map((y) => y.abonelik.ad),
    ['F1 TV', 'Claude Code (personal)']
  );
  assert.equal(yaklasan[0].kalanGun, 2);
  assert.ok(
    !yaklasan.some((y) => y.abonelik.ad === 'Kapalı'),
    'pasif abonelik uyarı vermemeli'
  );
});

// --- Saat ayrıştırma ----------------------------------------------------

test('saat dakikaya çevrilir, geçersiz saat null döner', () => {
  assert.equal(h.dakikaya('00:00'), 0);
  assert.equal(h.dakikaya('08:40'), 520);
  assert.equal(h.dakikaya('23:59'), 1439);
  assert.equal(h.dakikaya('9:05'), 545, 'tek haneli saat kabul edilir');
});

test('eksik veya bozuk saat eksende yer almaz', () => {
  assert.equal(h.dakikaya(undefined), null);
  assert.equal(h.dakikaya(''), null);
  assert.equal(h.dakikaya('24:00'), null, '24:00 ertesi gündür');
  assert.equal(h.dakikaya('12:60'), null);
  assert.equal(h.dakikaya('aksam'), null);
  assert.equal(h.dakikaya(830), null, 'sayı değil, metin beklenir');
});

// --- Ay özeti -----------------------------------------------------------

test('günlük ortalama ayın geçen günlerine bölünür', () => {
  const ay = [
    { tarih: '2026-08-01', tutar: 300, birim: 'TRY', kategori: 'market' },
    { tarih: '2026-08-02', tutar: 200, birim: 'TRY', kategori: 'market' },
  ];
  assert.equal(h.ayToplami(ay, KUR), 500);
  assert.equal(h.gunlukOrtalama(ay, KUR, '2026-08-04'), 125, '4 güne bölünür');
  assert.equal(h.gunlukOrtalama(ay, KUR, '2026-08-02'), 250);
});

test('boş ay ortalaması sıfır, bölme hatası vermez', () => {
  assert.equal(h.gunlukOrtalama([], KUR, '2026-08-27'), 0);
});

// --- Grafik verileri ----------------------------------------------------

test('son günler listesi boş günleri de içerir, eskiden yeniye', () => {
  const h7 = h.sonGunler(H, KUR, '2026-08-27', 7);
  assert.equal(h7.length, 7);
  assert.equal(h7[0].gun, '2026-08-21');
  assert.equal(h7[6].gun, '2026-08-27', 'son eleman bugün olmalı');
  assert.equal(h7[5].tutar, 900, 'dünkü market');
  assert.equal(h7[0].tutar, 0, 'kayıtsız gün sıfır olarak yer alır');
});

test('alışkanlık izi, takip öncesini kaçırılmış saymaz', () => {
  const onaylar = [
    onay('2026-08-25', 'spor', 'yapildi', 'a', 'app'),
    onay('2026-08-27', 'spor', 'yapildi', 'b', 'app'),
  ];
  const iz = h.aliskanlikIzi(SPOR, onaylar, '2026-08-27', 7);

  assert.equal(iz.length, 7);
  assert.equal(iz[6].gun, '2026-08-27');
  assert.equal(iz[6].durum, 'yapildi');
  assert.equal(iz[4].durum, 'yapildi', '25 ağustos');
  assert.equal(iz[5].durum, 'beklenmiyor', '26 ağustos: dün yapıldı, beklenmiyordu');
  assert.deepEqual(
    iz.slice(0, 4).map((g) => g.durum),
    ['kayitsiz', 'kayitsiz', 'kayitsiz', 'kayitsiz'],
    'ilk kayıttan önceki günler kayıtsız'
  );
});

test('izde bugün işaretlenmemişse bekliyor olarak durur', () => {
  const iz = h.aliskanlikIzi(UYKU, [onay('2026-08-26', 'erken-uyku', 'yapildi', 'a', 'app')], '2026-08-27', 3);
  assert.equal(iz[2].durum, 'bekliyor');
  assert.equal(iz[1].durum, 'yapildi');
});

// --- Saat dilimi dağılımı -----------------------------------------------

test('harcamalar saat dilimlerine dağılır, saatsizler ayrı sayılır', () => {
  const kayitlar = [
    { saat: '08:40', tutar: 100, birim: 'TRY', kategori: 'yeme-icme' }, // sabah
    { saat: '13:10', tutar: 200, birim: 'TRY', kategori: 'market' },    // öğle
    { saat: '19:00', tutar: 300, birim: 'TRY', kategori: 'ulasim' },    // akşam
    { saat: '23:30', tutar: 400, birim: 'TRY', kategori: 'diger' },     // gece
    { tutar: 50, birim: 'TRY', kategori: 'diger' },                     // saatsiz
  ];
  const d = h.saatDagilimi(kayitlar, KUR);

  assert.equal(d.saatsiz, 1);
  assert.deepEqual(
    d.dilimler.map((x) => [x.ad, x.tutar]),
    [['sabah', 100], ['öğle', 200], ['akşam', 300], ['gece', 400]]
  );
});

test('gece dilimi gün dönümünü aşar', () => {
  const geceyarisi = h.saatDagilimi(
    [{ saat: '02:15', tutar: 60, birim: 'TRY', kategori: 'diger' }],
    KUR
  );
  assert.equal(geceyarisi.dilimler[3].tutar, 60, '02:15 gece dilimine düşer');
  assert.equal(geceyarisi.dilimler[0].tutar, 0, 'sabah boş kalır');
});

test('boş liste tüm dilimleri sıfırla döndürür', () => {
  const d = h.saatDagilimi([], KUR);
  assert.equal(d.saatsiz, 0);
  assert.deepEqual(d.dilimler.map((x) => x.adet), [0, 0, 0, 0]);
});

// --- Ay penceresi ve kırılımlar -----------------------------------------

test('ayın geçen günü: bu ayda bugüne kadar, geçmiş ayda ayın tamamı', () => {
  assert.equal(h.ayinGecenGunu('2026-08', '2026-08-14'), 14);
  assert.equal(h.ayinGecenGunu('2026-07', '2026-08-14'), 31, 'temmuz 31 çeker');
  assert.equal(h.ayinGecenGunu('2026-02', '2026-08-14'), 28, '2026 artık yıl değil');
  assert.equal(h.ayinGecenGunu('2026-09', '2026-08-14'), 0, 'gelecek ay sıfır');
});

test('ayın günleri bugünden değil ayın 1inden sayar', () => {
  const kayitlar = [
    { tarih: '2026-07-01', tutar: 10, birim: 'TRY', kategori: 'diger' },
    { tarih: '2026-07-03', tutar: 20, birim: 'TRY', kategori: 'diger' },
  ];
  const gunler = h.ayinGunleri(kayitlar, KUR, '2026-07', 3);
  assert.deepEqual(
    gunler.map((g) => [g.gun, g.tutar]),
    [['2026-07-01', 10], ['2026-07-02', 0], ['2026-07-03', 20]]
  );
});

test('birikimli toplam hiç azalmaz, son değer ay toplamıdır', () => {
  const kayitlar = [
    { tarih: '2026-08-01', tutar: 100, birim: 'TRY', kategori: 'diger' },
    { tarih: '2026-08-03', tutar: 50, birim: 'TRY', kategori: 'diger' },
  ];
  const b = h.birikimli(kayitlar, KUR, '2026-08', 4);
  assert.deepEqual(b.map((x) => x.toplam), [100, 100, 150, 150]);
  assert.equal(b[b.length - 1].toplam, h.toplamTL(kayitlar, KUR));
});

test('yer kırılımı: yeri yazılmamış kayıt bir yere atanmaz', () => {
  const kayitlar = [
    { tutar: 100, birim: 'TRY', kategori: 'market', yer: 'Migros' },
    { tutar: 40, birim: 'TRY', kategori: 'market', yer: 'Migros' },
    { tutar: 200, birim: 'TRY', kategori: 'yeme-icme', yer: 'Espressolab' },
    { tutar: 30, birim: 'TRY', kategori: 'diger' },
    { tutar: 70, birim: 'TRY', kategori: 'diger', yer: '   ' },
  ];
  const k = h.yerKirilimi(kayitlar, KUR);

  assert.deepEqual(
    k.yerler.map((y) => [y.yer, y.tutar, y.adet]),
    [['Espressolab', 200, 1], ['Migros', 140, 2]],
    'büyükten küçüğe, aynı yer toplanır'
  );
  assert.equal(k.yersiz, 2, 'boş dizgi de yersiz sayılır');
  assert.equal(k.yersizTutar, 100);
});

test('hafta günü dağılımı toplam değil ortalama verir', () => {
  // 2026-08-03 pazartesi. Ayın ilk 14 gününde iki pazartesi var (3 ve 10).
  const kayitlar = [
    { tarih: '2026-08-03', tutar: 200, birim: 'TRY', kategori: 'diger' },
    { tarih: '2026-08-10', tutar: 0, birim: 'TRY', kategori: 'diger' },
  ];
  const d = h.haftaGunuDagilimi(kayitlar, KUR, '2026-08', 14);

  assert.equal(d[0].gunSayisi, 2, 'iki pazartesi');
  assert.equal(d[0].toplam, 200);
  assert.equal(d[0].ortalama, 100, 'boş pazartesi ortalamayı düşürür');
  assert.equal(d[6].ortalama, 0, 'kayıtsız pazar sıfır, bölme hatası yok');
});

test('en büyükler döviz kaydını TL karşılığıyla sıralar', () => {
  const kayitlar = [
    { tutar: 500, birim: 'TRY', kategori: 'market' },
    { tutar: 20, birim: 'USD', kategori: 'teknoloji' }, // 20 * 49 = 980
    { tutar: 300, birim: 'TRY', kategori: 'diger' },
  ];
  const e = h.enBuyukler(kayitlar, KUR, 2);
  assert.deepEqual(
    e.map((x) => [x.kayit.kategori, x.tutar]),
    [['teknoloji', 980], ['market', 500]]
  );
});

// --- GitHub kaynağı: base64 ---------------------------------------------

test('base64 çevrimi Türkçe karakteri ve ₺ işaretini bozmaz', async () => {
  const { base64Yaz, base64Oku } = await import('../js/github.js');

  // btoa doğrudan çağrılsaydı bu dizgide InvalidCharacterError atardı:
  // Latin-1 dışı her karakter onu düşürür.
  const metin = JSON.stringify(
    [{ kategori: 'yeme-icme', yer: 'İçim Şuğ', tutar: 1250, birim: '₺' }],
    null,
    2
  );

  const kodlu = base64Yaz(metin);
  assert.match(kodlu, /^[A-Za-z0-9+/]+=*$/, 'çıktı geçerli base64');
  assert.equal(base64Oku(kodlu), metin, 'gidiş-dönüş metni değiştirmiyor');
});

test('base64 çevrimi boş ve çok satırlı içerikte de tersine döner', async () => {
  const { base64Yaz, base64Oku } = await import('../js/github.js');
  assert.equal(base64Oku(base64Yaz('')), '');
  const cokSatir = '[\n  {\n    "ğ": "İ"\n  }\n]\n';
  assert.equal(base64Oku(base64Yaz(cokSatir)), cokSatir);
});

// --- Alışkanlık geçmişi -------------------------------------------------

test('en uzun seri bugünden bağımsızdır, rekoru bulur', () => {
  const tanim = { id: 'x', siklik: { tip: 'gunluk' } };
  const onaylar = [
    // dört günlük seri, sonra kopuş, sonra iki günlük
    { aliskanlik: 'x', tarih: '2026-08-01', durum: 'yapildi' },
    { aliskanlik: 'x', tarih: '2026-08-02', durum: 'yapildi' },
    { aliskanlik: 'x', tarih: '2026-08-03', durum: 'yapildi' },
    { aliskanlik: 'x', tarih: '2026-08-04', durum: 'yapildi' },
    { aliskanlik: 'x', tarih: '2026-08-06', durum: 'yapilmadi' },
    { aliskanlik: 'x', tarih: '2026-08-10', durum: 'yapildi' },
    { aliskanlik: 'x', tarih: '2026-08-11', durum: 'yapildi' },
  ];
  assert.equal(h.enUzunSeri(tanim, onaylar), 4);

  // Bugünkü seri kopmuş olsa da rekor durur.
  assert.equal(h.seriHesapla(tanim, onaylar, '2026-08-20'), 0);
});

test('gün-arası alışkanlıkta seri boşluğu tolere eder', () => {
  const tanim = { id: 'y', siklik: { tip: 'gun-arasi', deger: 2 } };
  const onaylar = [
    { aliskanlik: 'y', tarih: '2026-08-01', durum: 'yapildi' },
    { aliskanlik: 'y', tarih: '2026-08-03', durum: 'yapildi' },
    { aliskanlik: 'y', tarih: '2026-08-05', durum: 'yapildi' },
    // 4 gün boşluk: seri kopar
    { aliskanlik: 'y', tarih: '2026-08-09', durum: 'yapildi' },
  ];
  assert.equal(h.enUzunSeri(tanim, onaylar), 3, 'iki günlük aralık seriyi bozmaz');

  const gunlukTanim = { id: 'y', siklik: { tip: 'gunluk' } };
  assert.equal(
    h.enUzunSeri(gunlukTanim, onaylar),
    1,
    'aynı kayıtlar günlük ölçütte tek tek kalır'
  );
});

test('başka alışkanlığın kayıtları seriye karışmaz', () => {
  const tanim = { id: 'x', siklik: { tip: 'gunluk' } };
  const onaylar = [
    { aliskanlik: 'x', tarih: '2026-08-01', durum: 'yapildi' },
    { aliskanlik: 'z', tarih: '2026-08-02', durum: 'yapildi' },
    { aliskanlik: 'x', tarih: '2026-08-03', durum: 'yapildi' },
  ];
  assert.equal(h.enUzunSeri(tanim, onaylar), 1);
});

test('hafta günü dağılımının paydası BEKLENEN gündür', () => {
  // 2026-08-03 pazartesi. Takip 03'te başlıyor, 09'a kadar bakılıyor.
  const tanim = { id: 'x', siklik: { tip: 'gunluk' } };
  const onaylar = [
    { aliskanlik: 'x', tarih: '2026-08-03', durum: 'yapildi' },   // pazartesi
    { aliskanlik: 'x', tarih: '2026-08-04', durum: 'yapilmadi' }, // salı
    { aliskanlik: 'x', tarih: '2026-08-05', durum: 'yapildi' },   // çarşamba
  ];
  const d = h.aliskanlikGunDagilimi(tanim, onaylar, '2026-08-05', 7);

  const pazartesi = d[0];
  const sali = d[1];
  assert.equal(pazartesi.oran, 1, 'pazartesi 1/1');
  assert.equal(sali.oran, 0, 'salı 0/1');

  // Takip başlamadan önceki günler (01, 02) hiç sayılmaz.
  const cumartesi = d[5];
  assert.equal(cumartesi.beklenen, 0);
  assert.equal(cumartesi.oran, null, 'kayıtsız gün oranı sıfır değil, YOK');
});

test('iz sayacı beklenmiyor ve kayıtsızı ayrı tutar', () => {
  const tanim = { id: 'x', siklik: { tip: 'gun-arasi', deger: 2 } };
  const onaylar = [{ aliskanlik: 'x', tarih: '2026-08-10', durum: 'yapildi' }];
  const iz = h.aliskanlikIzi(tanim, onaylar, '2026-08-12', 5);
  const s = h.izSayaci(iz);

  assert.equal(s.yapildi, 1);
  assert.equal(s.kayitsiz + s.beklenmiyor + s.yapilmadi + s.bekliyor, 4);
  assert.equal(s.yapilmadi, 0, 'takip öncesi gün kaçırılmış sayılmaz');
});

// --- Ödeme takvimi ------------------------------------------------------

test('ödeme takvimi günlere dağıtır, ayın çekmediği günü sona çeker', () => {
  const abonelikler = [
    { ad: 'A', tutar: 100, birim: 'TRY', periyot: 'aylik', yenileme_gunu: 5, aktif: true },
    { ad: 'B', tutar: 50, birim: 'TRY', periyot: 'aylik', yenileme_gunu: 5, aktif: true },
    { ad: 'C', tutar: 200, birim: 'TRY', periyot: 'aylik', yenileme_gunu: 31, aktif: true },
  ];
  const { gunler } = h.odemeTakvimi(abonelikler, KUR, '2026-02'); // 28 gün

  assert.equal(gunler.length, 28);
  assert.equal(gunler[4].tutar, 150, 'aynı güne düşen ikisi toplanır');
  assert.deepEqual(gunler[4].adlar, ['A', 'B']);
  assert.equal(gunler[27].tutar, 200, '31 -> ayın son günü');
  assert.equal(gunler[0].tutar, 0, 'ödemesiz gün sıfır kalır');
});

test('takvim yıllık ve günü bilinmeyen abonelikleri ayrı sayar', () => {
  const abonelikler = [
    { ad: 'Aylık', tutar: 100, birim: 'TRY', periyot: 'aylik', yenileme_gunu: 3, aktif: true },
    { ad: 'Yıllık', tutar: 1200, birim: 'TRY', periyot: 'yillik', yenileme_gunu: 3, aktif: true },
    { ad: 'Belirsiz', tutar: 60, birim: 'TRY', periyot: 'aylik', yenileme_gunu: null, aktif: true },
    { ad: 'Kapalı', tutar: 90, birim: 'TRY', periyot: 'aylik', yenileme_gunu: 3, aktif: false },
  ];
  const t = h.odemeTakvimi(abonelikler, KUR, '2026-08');

  assert.equal(t.gunler[2].tutar, 100, 'takvimde yalnız aylık ve günü bilinen');
  assert.equal(t.takvimDisi, 1, 'yıllık olan ayrı sayılır');
  assert.equal(t.gunuBilinmeyen, 1);
});

test('ödeme takvimi dövizi TL karşılığıyla toplar', () => {
  const abonelikler = [
    { ad: 'USD', tutar: 10, birim: 'USD', periyot: 'aylik', yenileme_gunu: 9, aktif: true },
  ];
  const { gunler } = h.odemeTakvimi(abonelikler, KUR, '2026-08');
  assert.equal(gunler[8].tutar, 490, '10 * 49');
});

test('yıllık toplam aylığın on iki katıdır', () => {
  const abonelikler = [
    { tutar: 100, birim: 'TRY', periyot: 'aylik', aktif: true },
    { tutar: 1200, birim: 'TRY', periyot: 'yillik', aktif: true },
  ];
  // aylık: 100 + 100 = 200
  assert.equal(h.aylikAbonelikToplami(abonelikler, KUR), 200);
  assert.equal(h.yillikAbonelikToplami(abonelikler, KUR), 2400);
});
