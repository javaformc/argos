// Argos C — harcama ayrıntı sayfası.
//
// Ana ekran "bugün ne oldu" diye sorar ve cevabı bilerek keser: üç kayıt,
// beş kategori dilimi, yedi gün. Kesilenler hiçbir yerde durmuyordu —
// "diğer 3 kayıt · 793 ₺" satırının arkasına gidilemiyordu. Bu sayfa o
// kesiklerin arkasıdır: ayın tamamı, hiçbir liste kısılmadan.
//
// Soru da değişir. Ana ekranınki GÜN, buradaki AY: para bu ay nereye
// gitti, hangi günler ağır geçti, hangi kategori büyüdü.
//
// Şimdilik yalnız içinde bulunulan ay çizilir — veri katmanı tek ay
// yüklüyor. Aylar arası gezinme ayrı bir iş; burada sessizce taklit
// edilmez.

import * as H from '../js/hesap.js';
import {
  el,
  AYLAR,
  GUNLER,
  lira,
  ustSatir,
  buyukSayi,
  kayitSatiri,
  saateGore,
  ayGrafigiBlogu,
  ayKategoriBlogu,
  saatBlogu,
  genisEkran,
} from './ortak.js';

/**
 * Geri bağlantısı + hangi aya bakıldığı.
 *
 * Bağlantı bir `<a href="#">`: geri gitmenin tarayıcının kendi geri
 * tuşuyla da çalışması, klavyeyle odaklanabilmesi ve uzun basınca
 * "yeni sekmede aç" çıkması bedavaya geliyor. Aynı işi yapan bir
 * `<button>` bunların üçünü de elde yazmayı gerektirirdi.
 */
function gezinme(bugun) {
  const kutu = el('nav', 'gezinme');

  const geri = el('a', 'gezinme-geri');
  geri.href = '#';
  geri.append(el('span', 'gezinme-ok', '←'), el('span', null, 'BUGÜN'));

  const ay = `${AYLAR[Number(bugun.slice(5, 7)) - 1]} ${bugun.slice(0, 4)}`;
  kutu.append(geri, el('span', 'gezinme-ay', ay));
  return kutu;
}

/**
 * Ayın toplamı ve tek cümlelik bağlamı.
 *
 * Cümle ay grafiğinin söylemediğini söyler: grafik ayın şeklini gösterir
 * ama en ağır günü okumak için sütunları gözle karşılaştırmak gerekir.
 * Aynı şeyi iki kez söylemek yerine cümle o günü adıyla verir.
 */
function tepeBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-aytoplam');
  blok.dataset.alan = 'aytoplam';

  const toplam = H.ayToplami(veri.harcamalar, veri.kur);
  const adet = veri.harcamalar.length;
  const bos = adet === 0;

  blok.append(ustSatir('BU AY', bos ? null : `${adet} kayıt`));
  blok.append(buyukSayi(lira(toplam), '₺', 'dev', { bos }));

  if (bos) {
    blok.append(el('p', 'yorum', 'Bu ay henüz kayıt yok.'));
    return blok;
  }

  const gecenGun = Number(bugun.slice(8, 10));
  const gunler = H.sonGunler(veri.harcamalar, veri.kur, bugun, gecenGun);
  const enAgir = gunler.reduce((a, b) => (b.tutar > a.tutar ? b : a), gunler[0]);
  const gunAdi = GUNLER[new Date(`${enAgir.gun}T00:00:00`).getDay()].toLocaleLowerCase('tr');

  blok.append(
    el(
      'p',
      'yorum',
      `En ağır gün ${Number(enAgir.gun.slice(8))} ${gunAdi}: ${lira(enAgir.tutar)} ₺.`
    )
  );
  return blok;
}

/**
 * GÜN GÜN — ayın bütün kayıtları, yeniden eskiye.
 *
 * Tek bir ızgara kullanılır ve gün başlıkları o ızgaranın içinde tam
 * genişlik kaplar: her günü kendi listesine ayırmak sütunları günden güne
 * kaydırırdı ve saat/kategori/tutar hizası kaybolurdu. Hiza, uzun bir
 * dökümü tarayarak okumanın tek yolu.
 *
 * Kayıtsız günler LİSTEDE YOK. Ay grafiği onları zaten gösteriyor (boş
 * sütun) ve dökümde otuz "kayıt yok" satırı, gerçek kayıtları görünmez
 * kılardı — iki biçim aynı boşluğu iki kez anlatmaz.
 */
function dokumBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-dokum');
  blok.dataset.alan = 'dokum';

  const gunler = new Map();
  for (const h of veri.harcamalar) {
    if (!gunler.has(h.tarih)) gunler.set(h.tarih, []);
    gunler.get(h.tarih).push(h);
  }
  const sirali = [...gunler.keys()].sort().reverse();

  blok.append(
    ustSatir('GÜN GÜN', sirali.length > 0 ? `${sirali.length} gün` : null)
  );

  const liste = el('ul', 'kayitlar dokum');

  if (sirali.length === 0) {
    liste.classList.add('kayitlar-bos');
    liste.append(el('li', 'kayit-bos', 'Bu ay kayıt yok'));
    blok.append(liste);
    return blok;
  }

  for (const gun of sirali) {
    const kayitlar = saateGore(gunler.get(gun));
    const toplam = H.toplamTL(kayitlar, veri.kur);
    const d = new Date(`${gun}T00:00:00`);

    const ayrac = el('li', 'gun-ayrac');
    if (gun === bugun) ayrac.dataset.bugun = '';
    ayrac.append(
      el('span', 'gun-tarih', `${d.getDate()} ${GUNLER[d.getDay()]}`),
      el('span', 'gun-toplam', `${lira(toplam)} ₺`)
    );
    liste.append(ayrac);

    for (const h of kayitlar) liste.append(kayitSatiri(h, veri.kur));
  }

  blok.append(liste);
  return blok;
}

/**
 * Sayfanın kendisi. #ekran'a konacak düğümleri döndürür.
 *
 * Masaüstünde iki sütun; hangi bloğun nereye gittiği aşağıda anlatılıyor.
 */
export function harcamaSayfasi(veri, bugun) {
  const tepe = tepeBlogu(veri, bugun);
  const grafik = ayGrafigiBlogu(veri, bugun);
  // Tavan kaldırılır: bu sayfanın varlık sebebi tam döküm.
  const kategori = ayKategoriBlogu(veri, bugun, Infinity);
  const saat = saatBlogu(veri, bugun);
  const dokum = dokumBlogu(veri, bugun);

  if (!genisEkran()) {
    return [gezinme(bugun), tepe, grafik, kategori, saat, dokum];
  }

  // Sütunlar iki EKSENE bölünür, blok sayısına değil: solda zaman
  // (ayın günleri, günün saatleri), sağda kategori (neye gitti, tek tek
  // ne alındı). Blokları öylesine dağıtmak sağ sütunu boş bırakıyordu ve
  // ikisi arasında okunacak bir ilişki kalmıyordu.
  const sol = el('div', 'sutun sutun-sol');
  const sag = el('div', 'sutun sutun-sag');
  sol.append(tepe, grafik, saat);
  sag.append(kategori, dokum);
  return [gezinme(bugun), sol, sag];
}
