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
