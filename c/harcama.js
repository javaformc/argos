// Argos C — harcamanın ayrıntı sayfaları.
//
// Ana ekran "bugün ne oldu" diye sorar ve cevabı bilerek keser: üç kayıt,
// beş kategori dilimi, yedi gün. Kesilenlerin arkasına gidilecek bir yer
// yoktu; "diğer 3 kayıt · 793 ₺" satırı bir çıkmazdı.
//
// Dört sayfa var ve her biri bir öncekinin bir satırını açar:
//   ay       -> bu ay para nereye gitti
//   kategori -> bu kalem bana neye mal oluyor
//   gün      -> o gün ne aldım
//   yer      -> buraya ne kadar bırakıyorum
//
// Hepsi aynı iskeleti kullanır: gezinme + tepe + bloklar. Tekrar eden şey
// yapı, içerik değil — dördü de aynı görsel dili konuşuyor ama farklı
// soruyu cevaplıyor.

import * as H from '../js/hesap.js';
import {
  el,
  AYLAR,
  GUNLER,
  KISA_GUN,
  oku,
  lira,
  ustSatir,
  buyukSayi,
  daireCiz,
  kayitSatiri,
  saateGore,
  renkNo,
  renkleriAyir,
  yuzdeDagit,
  ayGrafigiBlogu,
  ayKategoriBlogu,
  saatBlogu,
  genisEkran,
} from './ortak.js';

const EN_BUYUK_SAYI = 5; // "ayın en pahalıları" listesindeki satır sayısı
const YER_SATIR = 8;

const ayAdi = (ay) => `${AYLAR[Number(ay.slice(5, 7)) - 1]} ${ay.slice(0, 4)}`;
const gunAdi = (tarih) => GUNLER[new Date(`${tarih}T00:00:00`).getDay()];
const kucuk = (s) => s.toLocaleLowerCase('tr');

/** "2026-08" -> bir ay önce / sonra. */
function ayKaydir(ay, n) {
  const yil = Number(ay.slice(0, 4));
  const no = Number(ay.slice(5, 7)) + n;
  const d = new Date(yil, no - 1, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// --- Gezinme -------------------------------------------------------------

/**
 * Sayfa başı: geri bağlantısı + başlık.
 *
 * Bağlantı bir `<a href="#…">`: geri gitmenin tarayıcının kendi geri
 * tuşuyla da çalışması, klavyeyle odaklanabilmesi ve uzun basınca "yeni
 * sekmede aç" çıkması bedavaya geliyor. Aynı işi yapan bir `<button>`
 * üçünü de elde yazmayı gerektirirdi.
 */
function gezinme(geriRota, geriMetin, baslik) {
  const kutu = el('nav', 'gezinme');

  const geri = el('a', 'gezinme-geri');
  geri.href = '#' + geriRota;
  geri.append(el('span', 'gezinme-ok', '←'), el('span', null, geriMetin));

  kutu.append(geri, el('span', 'gezinme-ay', baslik));
  return kutu;
}

/**
 * Ay sayfasının gezinmesi: iki ok arasında ay adı.
 *
 * İleri ok İÇİNDE BULUNULAN AYDA KAPANIR — gelecek ay diye bir kayıt
 * yok ve boş bir sayfaya götüren bir düğme, veri kaybı gibi okunur.
 * Geri ok hep açık: kayıt tutulmamış bir geçmiş ay boş görünür ve bu
 * doğrudur, ne zaman başladığını uygulama bilmiyor.
 */
function ayGezinmesi(ay, bugun) {
  const kutu = el('nav', 'gezinme');

  const geri = el('a', 'gezinme-geri');
  geri.href = '#';
  geri.append(el('span', 'gezinme-ok', '←'), el('span', null, 'BUGÜN'));

  const orta = el('div', 'ay-gezinme');
  const onceki = el('a', 'ay-ok');
  onceki.href = '#harcama/' + ayKaydir(ay, -1);
  onceki.textContent = '‹';
  onceki.setAttribute('aria-label', 'Önceki ay');

  const etiket = el('span', 'gezinme-ay', ayAdi(ay));

  orta.append(onceki, etiket);

  if (ay < bugun.slice(0, 7)) {
    const sonraki = el('a', 'ay-ok');
    sonraki.href = '#harcama/' + ayKaydir(ay, 1);
    sonraki.textContent = '›';
    sonraki.setAttribute('aria-label', 'Sonraki ay');
    orta.append(sonraki);
  } else {
    // Yer korunur: ok kaybolunca ay adı sağa kayıyordu ve ay
    // değiştirmek yerleşimi oynatan bir işlem gibi görünüyordu.
    orta.append(el('span', 'ay-ok ay-ok-bos', '›'));
  }

  kutu.append(geri, orta);
  return kutu;
}

// --- Ortak parçalar ------------------------------------------------------

/**
 * Etiket + dev sayı + tek cümlelik bağlam. Dört sayfanın da tepesi.
 *
 * `kimlik` verilirse başlık bir ETİKET değil bir AD olur: puntosu büyür,
 * yanına o kategorinin renkli noktası gelir. Kategorinin kendi sayfasında
 * rengini hiç görmemek, renk-kategori eşleşmesinin kafada kurulmasını
 * engelliyordu — renk ancak tekrar tekrar aynı adla görülünce hatırlanır.
 * Ad yine yazılı: renk tek başına hiçbir bilgiyi taşımaz.
 */
function tepeBlogu(etiket, sag, toplam, cumle, bos, kimlik) {
  const blok = el('section', 'blok blok-aytoplam');
  blok.dataset.alan = 'aytoplam';

  if (kimlik) {
    const satir = el('div', 'ust-satir');
    const ad = el('p', 'kimlik');
    if (kimlik.renk) {
      const nokta = el('span', 'nokta');
      nokta.dataset.renk = String(kimlik.renk);
      ad.append(nokta);
    }
    ad.append(el('span', 'kimlik-ad', etiket));
    satir.append(ad);
    if (sag) satir.append(el('p', 'veri', sag));
    blok.append(satir);
  } else {
    blok.append(ustSatir(etiket, sag));
  }
  blok.append(buyukSayi(lira(toplam), '₺', 'dev', { bos }));
  blok.append(el('p', 'yorum', cumle));
  return blok;
}

/** Yan yana küçük sayılar — "günde ortalama", "işlem başına" gibi. */
function sayilarBlogu(baslik, ogeler) {
  const blok = el('section', 'blok blok-ayozet');
  blok.dataset.alan = 'ayozet';
  if (baslik) blok.append(ustSatir(baslik, null));

  const kutu = el('div', 'ay-ozet');
  for (const o of ogeler) {
    const oge = el('div', 'ay-oge');
    oge.append(el('p', 'etiket', o.etiket));
    const satir = el('p', 'ay-deger');
    satir.append(el('b', null, o.deger), el('span', null, o.birim || '₺'));
    oge.append(satir);
    kutu.append(oge);
  }
  blok.append(kutu);
  return blok;
}

/**
 * GÜN GÜN — kayıtların tam dökümü, yeniden eskiye.
 *
 * Tek bir ızgara kullanılır ve gün başlıkları o ızgaranın içinde tam
 * genişlik kaplar: her günü kendi listesine ayırmak sütunları günden güne
 * kaydırırdı ve saat/kategori/tutar hizası kaybolurdu. Hiza, uzun bir
 * dökümü tarayarak okumanın tek yolu.
 *
 * Kayıtsız günler LİSTEDE YOK. Ay grafiği onları zaten gösteriyor (boş
 * sütun) ve dökümde otuz "kayıt yok" satırı gerçek kayıtları görünmez
 * kılardı — iki biçim aynı boşluğu iki kez anlatmaz.
 */
function dokumBlogu(harcamalar, kur, bugun, secenek) {
  const s = secenek || {};
  const blok = el('section', 'blok blok-dokum');
  blok.dataset.alan = 'dokum';

  const gunler = new Map();
  for (const h of harcamalar) {
    if (!gunler.has(h.tarih)) gunler.set(h.tarih, []);
    gunler.get(h.tarih).push(h);
  }
  const sirali = [...gunler.keys()].sort().reverse();

  blok.append(
    ustSatir(
      s.baslik || 'GÜN GÜN',
      sirali.length > 0 && !s.tekGun ? `${sirali.length} gün` : null
    )
  );

  const liste = el('ul', 'kayitlar dokum');
  if (s.gizle === 'kategori') liste.dataset.sutun = 'uc';

  if (sirali.length === 0) {
    liste.classList.add('kayitlar-bos');
    liste.append(el('li', 'kayit-bos', 'Kayıt yok'));
    blok.append(liste);
    return blok;
  }

  for (const gun of sirali) {
    const kayitlar = saateGore(gunler.get(gun));

    // Gün sayfasında ayraç çizilmez: tek gün var ve tarihi zaten sayfanın
    // tepesinde duruyor. Aynı tarihi iki kez yazmak, listenin birden çok
    // gün içerdiğini ima ediyordu.
    if (!s.tekGun) {
      const ayrac = el('li', 'gun-ayrac');
      if (gun === bugun) ayrac.dataset.bugun = '';

      // Gün başlığı o günün sayfasına açılan kapı — ay grafiğindeki
      // sütunla aynı kapı, ama bu parmakla basılacak boyda.
      const bag = el('a', 'gun-tarih');
      bag.href = '#gun/' + gun;
      bag.textContent = `${Number(gun.slice(8))} ${gunAdi(gun)}`;

      ayrac.append(
        bag,
        el('span', 'gun-toplam', `${lira(H.toplamTL(kayitlar, kur))} ₺`)
      );
      liste.append(ayrac);
    }

    for (const h of kayitlar) liste.append(kayitSatiri(h, kur, s.gizle));
  }

  blok.append(liste);
  return blok;
}

/** Kategori dağılımı, halka + barlar. Ay bloğunun tek kayda inmiş hali. */
function daireBlogu(harcamalar, kur, baslik, ay) {
  const blok = el('section', 'blok blok-kategori');
  blok.dataset.alan = 'kategori';
  blok.append(ustSatir(baslik, null));

  const tumu = H.kategoriKirilimi(harcamalar, kur);

  // Kayıtsız günde halka YİNE çizilir, içi sıfır. Kaybolduğunda blok
  // kısalıyor ve altındaki ay grafiği yukarı kayıyordu; gün gün gezinen
  // biri her boş günde imleci yeniden konumlandırmak zorunda kalıyordu.
  if (tumu.length === 0) {
    const bos = el('div', 'kategori-ikili kategori-bos');
    bos.append(daireCiz([], '0', '₺'), el('p', 'veri', 'Kayıt yok'));
    blok.append(bos);
    return blok;
  }

  const kirilim = renkleriAyir(
    tumu.map((k) => ({ ...k, renk: renkNo(k.kategori) }))
  );

  const paylar = yuzdeDagit(kirilim.map((k) => k.tutar));
  const toplam = kirilim.reduce((t, k) => t + k.tutar, 0);
  const enBuyuk = kirilim[0].tutar;

  const liste = el('ul', 'kategori-barlar');
  for (const k of kirilim) {
    const ic = ay ? el('a', 'kategori-bar') : el('div', 'kategori-bar');
    if (ay) ic.href = '#kategori/' + ay + '/' + encodeURIComponent(k.kategori);
    const yol = el('span', 'kb-yol');
    const dolgu = el('i');
    dolgu.style.width = `${Math.max((k.tutar / enBuyuk) * 100, 2)}%`;
    dolgu.dataset.renk = String(k.renk);
    yol.append(dolgu);
    ic.append(
      el('span', 'kb-ad', oku(k.kategori)),
      yol,
      el('span', 'kb-tutar', lira(k.tutar))
    );
    const satir = el('li');
    satir.append(ic);
    liste.append(satir);
  }

  const dilimler = kirilim.map((k, i) => ({
    ad: oku(k.kategori),
    renk: k.renk,
    pay: paylar[i],
    bag: ay ? '#kategori/' + ay + '/' + encodeURIComponent(k.kategori) : null,
  }));

  const ikili = el('div', 'kategori-ikili');
  ikili.append(daireCiz(dilimler, lira(toplam), '₺'), liste);
  blok.append(ikili);
  return blok;
}

// --- Ay sayfasının kendi modülleri ---------------------------------------

/**
 * BİRİKİMLİ — ayın 1'inden bugüne toplamın nasıl büyüdüğü.
 *
 * Ay grafiği günlük sıçramaları gösteriyor; bu çizgi gidişatı gösteriyor.
 * Kesikli düz çizgi, ay sonunda nereye varılacağının doğrusal tahmini:
 * eğri onun üstündeyse ay ortalamanın üstünde geçiyor demektir. İki
 * çizginin farkı, tek bir sayıyla söylenemeyecek bir şeyi söylüyor.
 */
function birikimliBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-birikimli');
  blok.dataset.alan = 'birikimli';

  const ay = veri.ay;
  const gecenGun = H.ayinGecenGunu(ay, bugun);
  const aydakiGun = H.aydaGun(ay);
  const seri = H.birikimli(veri.harcamalar, veri.kur, ay, gecenGun);
  const toplam = seri.length ? seri[seri.length - 1].toplam : 0;

  if (toplam === 0) {
    blok.append(ustSatir('BİRİKİMLİ', null));
    blok.append(el('p', 'veri', 'Bu ay kayıt yok'));
    return blok;
  }

  // Ay sonu tahmini: bugüne kadarki hız ay sonuna kadar sürerse.
  const tahmin = (toplam / gecenGun) * aydakiGun;
  blok.append(
    ustSatir('BİRİKİMLİ', `ay sonu tahmini ${lira(tahmin)} ₺`)
  );

  const alan = el('div', 'egri-alan');
  alan.setAttribute('role', 'img');
  alan.setAttribute(
    'aria-label',
    `Ay başından bugüne birikimli harcama: ${lira(toplam)} lira, ` +
      `bu hızla ay sonu tahmini ${lira(tahmin)} lira`
  );

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 40');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('class', 'egri');

  const tavan = Math.max(tahmin, toplam, 1);
  const x = (i) => (aydakiGun > 1 ? (i / (aydakiGun - 1)) * 100 : 0);
  const y = (v) => 40 - (v / tavan) * 40;

  // Doğrusal hedef çizgisi: ayın 1'inde sıfır, sonunda tahmin.
  const hedef = document.createElementNS(NS, 'line');
  hedef.setAttribute('x1', '0');
  hedef.setAttribute('y1', String(y(0)));
  hedef.setAttribute('x2', '100');
  hedef.setAttribute('y2', String(y(tahmin)));
  hedef.setAttribute('class', 'egri-hedef');
  svg.append(hedef);

  const yol = document.createElementNS(NS, 'polyline');
  yol.setAttribute(
    'points',
    seri.map((g, i) => `${x(i)},${y(g.toplam)}`).join(' ')
  );
  yol.setAttribute('class', 'egri-yol');
  svg.append(yol);

  alan.append(svg);

  const etiket = el('div', 'ay-etiket');
  etiket.append(el('span', null, '1'), el('span', null, String(aydakiGun)));

  blok.append(alan, etiket);
  return blok;
}

/**
 * NEREYE — kayıttaki `yer` alanı.
 *
 * Kategori "ne aldım" der ("yeme-içme"), yer "nereye bıraktım" der
 * ("Espressolab"). Alan veride vardı ve hiçbir ekranda kullanılmıyordu.
 *
 * Yeri yazılmamış kayıtlar bir yere atanmaz, sayısı dipnotta durur:
 * eksik veriyi bir kutuya koymak olmayan bir bilgiyi varmış gibi
 * gösterirdi ve listenin ne kadarının gerçek olduğu okunamazdı.
 */
function yerBlogu(veri, bugun, baslik) {
  const blok = el('section', 'blok blok-yer');
  blok.dataset.alan = 'yer';

  const { yerler, yersiz } = H.yerKirilimi(veri.harcamalar, veri.kur);
  blok.append(
    ustSatir(baslik || 'NEREYE · BU AY', yerler.length ? `${yerler.length} yer` : null)
  );

  if (yerler.length === 0) {
    blok.append(
      el(
        'p',
        'veri',
        yersiz > 0 ? `${yersiz} kaydın hiçbirinde yer yazılmamış` : 'Bu ay kayıt yok'
      )
    );
    return blok;
  }

  const gosterilen = yerler.slice(0, YER_SATIR);
  const enBuyuk = gosterilen[0].tutar;
  const liste = el('ul', 'kategori-barlar');

  for (const y of gosterilen) {
    const ic = el('a', 'kategori-bar');
    ic.href = '#yer/' + veri.ay + '/' + encodeURIComponent(y.yer);

    const yol = el('span', 'kb-yol');
    const dolgu = el('i');
    dolgu.style.width = `${Math.max((y.tutar / enBuyuk) * 100, 2)}%`;
    // Yer renk KİMLİĞİ taşımaz: yerler günden güne değişiyor ve sekiz
    // hue'yu onlara da dağıtmak kategori renklerinin anlamını bozardı.
    // Parlaklık kademesi sırayı kodluyor, kategori hue'ları serbest kalıyor.
    dolgu.dataset.kademe = '3';
    yol.append(dolgu);

    ic.append(
      el('span', 'kb-ad', y.yer),
      yol,
      el('span', 'kb-tutar', lira(y.tutar))
    );
    const satir = el('li');
    satir.append(ic);
    liste.append(satir);
  }

  blok.append(liste);

  const notlar = [];
  if (yerler.length > gosterilen.length) {
    notlar.push(`+${yerler.length - gosterilen.length} yer daha`);
  }
  if (yersiz > 0) notlar.push(`${yersiz} kayıtta yer yazılmamış`);
  if (notlar.length) blok.append(el('p', 'dipnot', notlar.join(' · ')));

  return blok;
}

/**
 * HAFTANIN GÜNÜ — pazartesiden pazara ortalama.
 *
 * Toplam değil ORTALAMA: ayda beş pazartesi dört cumartesi olabiliyor ve
 * toplam o eşitsizliği "pazartesi daha pahalı" diye okutur.
 */
function haftaGunuBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-haftagunu');
  blok.dataset.alan = 'haftagunu';

  const gecenGun = H.ayinGecenGunu(veri.ay, bugun);
  const dagilim = H.haftaGunuDagilimi(veri.harcamalar, veri.kur, veri.ay, gecenGun);
  const enBuyuk = Math.max(...dagilim.map((d) => d.ortalama), 1);
  const toplam = dagilim.reduce((t, d) => t + d.toplam, 0);

  blok.append(ustSatir('HAFTANIN GÜNÜ · ORTALAMA', null));

  if (toplam === 0) {
    blok.append(el('p', 'veri', 'Bu ay kayıt yok'));
    return blok;
  }

  const enPahali = dagilim.reduce((a, b) => (b.ortalama > a.ortalama ? b : a));
  const alan = el('div', 'saat-alan hafta-gunu-alan');
  alan.setAttribute('role', 'img');
  alan.setAttribute(
    'aria-label',
    'Haftanın günlerine göre ortalama harcama: ' +
      dagilim
        .map((d) => `${kucuk(GUNLER[(d.gun + 1) % 7])} ${lira(d.ortalama)} lira`)
        .join(', ')
  );

  for (const d of dagilim) {
    const kutu = el('div', 'saat-oge');
    const sutun = el('i');
    // Sıfır gün de görünür bir taban bırakır: "o gün harcamadım" ile "o
    // gün henüz gelmedi" ayrı şeyler ve ikincisi zaten listede yok.
    sutun.style.height = `${Math.max((d.ortalama / enBuyuk) * 100, 7)}%`;
    if (d === enPahali) sutun.dataset.bugun = '';
    kutu.append(
      el('span', 'saat-tutar', lira(d.ortalama)),
      sutun,
      // KISA_GUN pazar başlangıçlı, dağılım pazartesi başlangıçlı.
      el('span', 'saat-ad', KISA_GUN[(d.gun + 1) % 7])
    );
    alan.append(kutu);
  }

  blok.append(alan);
  return blok;
}

/**
 * EN BÜYÜKLER — ayın en pahalı beş kaydı.
 *
 * "Bu ay para nereye kaçtı" sorusunun cevabı çoğu zaman tek bir işlemdir
 * ve kategori ortalaması onu gizler: 1.250 ₺'lik bir elektrik faturası,
 * "fatura" barının içinde bir tek sayı olarak kayboluyor.
 */
function enBuyukBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-enbuyuk');
  blok.dataset.alan = 'enbuyuk';

  const liste = H.enBuyukler(veri.harcamalar, veri.kur, EN_BUYUK_SAYI);
  const toplam = H.toplamTL(veri.harcamalar, veri.kur);
  const payi = toplam > 0 ? liste.reduce((t, x) => t + x.tutar, 0) / toplam : 0;

  blok.append(
    ustSatir(
      `EN BÜYÜK ${EN_BUYUK_SAYI}`,
      liste.length ? `ayın %${Math.round(payi * 100)}'i` : null
    )
  );

  if (liste.length === 0) {
    blok.append(el('p', 'veri', 'Bu ay kayıt yok'));
    return blok;
  }

  const ul = el('ul', 'kayitlar enbuyuk-liste');
  for (const x of liste) {
    const h = x.kayit;
    const li = el('li', 'kayit');
    const tarih = el('a', 'saat');
    tarih.href = '#gun/' + h.tarih;
    tarih.textContent = `${Number(h.tarih.slice(8))} ${kucuk(gunAdi(h.tarih)).slice(0, 3)}`;
    li.append(
      tarih,
      el('span', 'kategori', oku(h.kategori)),
      el('span', 'detay', h.yer || (h.alt ? oku(h.alt) : '')),
      el('span', 'tutar', `${lira(x.tutar)} ₺`)
    );
    ul.append(li);
  }
  blok.append(ul);
  return blok;
}

// --- Sayfalar ------------------------------------------------------------

/**
 * AY SAYFASI.
 *
 * Masaüstünde iki sütun ve bölünme blok sayısına değil EKSENE göre:
 * solda zaman (ayın günleri, birikimli, haftanın günü, saat), sağda
 * kategori ve kayıtlar (dağılım, nereye, en büyükler, döküm). Blokları
 * öylesine dağıtmak sağ sütunu boş bırakıyordu ve iki sütun arasında
 * okunacak bir ilişki kalmıyordu.
 */
export function aySayfasi(veri, bugun) {
  const ay = veri.ay;
  const gecenGun = H.ayinGecenGunu(ay, bugun);
  const toplam = H.ayToplami(veri.harcamalar, veri.kur);
  const adet = veri.harcamalar.length;
  const bos = adet === 0;

  let cumle = 'Bu ay henüz kayıt yok.';
  if (!bos) {
    const gunler = H.ayinGunleri(veri.harcamalar, veri.kur, ay, gecenGun);
    const enAgir = gunler.reduce((a, b) => (b.tutar > a.tutar ? b : a), gunler[0]);
    cumle =
      `En ağır gün ${Number(enAgir.gun.slice(8))} ${kucuk(gunAdi(enAgir.gun))}: ` +
      `${lira(enAgir.tutar)} ₺.`;
  }

  const tepe = tepeBlogu(
    'BU AY',
    bos ? null : `${adet} kayıt`,
    toplam,
    cumle,
    bos
  );

  const ortalama = gecenGun > 0 ? toplam / gecenGun : 0;
  const sayilar = sayilarBlogu(null, [
    { etiket: 'GÜNDE ORTALAMA', deger: lira(ortalama) },
    { etiket: 'İŞLEM BAŞINA', deger: adet ? lira(toplam / adet) : '0' },
    { etiket: 'GÜN', deger: String(gecenGun), birim: 'geçti' },
  ]);

  const bloklar = {
    grafik: ayGrafigiBlogu(veri, bugun, { bagli: true }),
    birikimli: birikimliBlogu(veri, bugun),
    haftaGunu: haftaGunuBlogu(veri, bugun),
    saat: saatBlogu(veri, bugun),
    kategori: ayKategoriBlogu(veri, bugun, { tavan: Infinity, daire: true, bagli: true }),
    yer: yerBlogu(veri, bugun),
    enBuyuk: enBuyukBlogu(veri, bugun),
    dokum: dokumBlogu(veri.harcamalar, veri.kur, bugun, {}),
  };

  const gez = ayGezinmesi(ay, bugun);

  if (!genisEkran()) {
    return [
      gez,
      tepe,
      sayilar,
      bloklar.grafik,
      bloklar.kategori,
      bloklar.enBuyuk,
      bloklar.yer,
      bloklar.birikimli,
      bloklar.haftaGunu,
      bloklar.saat,
      bloklar.dokum,
    ];
  }

  const sol = el('div', 'sutun sutun-sol');
  const sag = el('div', 'sutun sutun-sag');
  sol.append(tepe, sayilar, bloklar.grafik, bloklar.birikimli, bloklar.haftaGunu, bloklar.saat);
  sag.append(bloklar.kategori, bloklar.enBuyuk, bloklar.yer, bloklar.dokum);
  return [gez, sol, sag];
}

/**
 * KATEGORİ SAYFASI — "bu kalem bana neye mal oluyor".
 *
 * Ay sayfası kategoriyi bir bar olarak gösteriyor; burada o barın içi
 * açılıyor. Asıl sayı toplam değil GÜNLÜK MALİYET: 865 ₺ soyut, "günde
 * 29 ₺" karar verilebilir bir sayı.
 */
export function kategoriSayfasi(veri, bugun, kategori) {
  const ay = veri.ay;
  const kayitlar = veri.harcamalar.filter((h) => h.kategori === kategori);

  // Renk, ayın TAM kırılımı üzerinden çözülür. Doğrudan `renkNo` çağırmak
  // yanlış rengi verebilirdi: sekiz hue on yediden fazla kategoriye
  // yetmiyor ve çakışma çözücü ay sayfasında bazı kategorileri başka bir
  // hue'ya kaydırıyor. Aynı kategorinin iki sayfada iki renkte görünmesi,
  // rengin kimlik kodladığı iddiasını çürütürdü.
  const kirilim = renkleriAyir(
    H.kategoriKirilimi(veri.harcamalar, veri.kur).map((k) => ({
      ...k,
      renk: renkNo(k.kategori),
    }))
  );
  const bulunan = kirilim.find((k) => k.kategori === kategori);
  const renk = bulunan ? bulunan.renk : renkNo(kategori);
  const gecenGun = H.ayinGecenGunu(ay, bugun);
  const toplam = H.toplamTL(kayitlar, veri.kur);
  const ayToplam = H.ayToplami(veri.harcamalar, veri.kur);
  const bos = kayitlar.length === 0;

  const pay = ayToplam > 0 ? Math.round((toplam / ayToplam) * 100) : 0;
  const cumle = bos
    ? `${ayAdi(ay)} ayında bu kategoride kayıt yok.`
    : `Ayın harcamasının %${pay}'i bu kalemde.`;

  const tepe = tepeBlogu(
    oku(kategori),
    bos ? null : `${kayitlar.length} kayıt`,
    toplam,
    cumle,
    bos,
    { renk }
  );

  const gunSayisi = new Set(kayitlar.map((h) => h.tarih)).size;
  const sayilar = sayilarBlogu(null, [
    { etiket: 'GÜNDE ORTALAMA', deger: gecenGun ? lira(toplam / gecenGun) : '0' },
    { etiket: 'İŞLEM BAŞINA', deger: bos ? '0' : lira(toplam / kayitlar.length) },
    { etiket: 'KAÇ GÜN', deger: String(gunSayisi), birim: `/ ${gecenGun}` },
  ]);

  // Grafik yalnız BU kategorinin günleri; ay bloğunun aynısı ama süzülmüş
  // veriyle. Ayrı bir modül yazmak yerine aynı biçim kullanılıyor.
  const grafik = ayGrafigiBlogu(
    { ay, harcamalar: kayitlar, kur: veri.kur },
    bugun,
    { bagli: true, renk }
  );

  const yer = yerBlogu(
    { ay, harcamalar: kayitlar, kur: veri.kur },
    bugun,
    'NEREYE · BU KALEMDE'
  );
  const dokum = dokumBlogu(kayitlar, veri.kur, bugun, {
    baslik: 'KAYITLAR',
    gizle: 'kategori',
  });
  const gez = gezinme('harcama/' + ay, ayAdi(ay), oku(kategori));

  if (!genisEkran()) return [gez, tepe, sayilar, grafik, yer, dokum];

  const sol = el('div', 'sutun sutun-sol');
  const sag = el('div', 'sutun sutun-sag');
  sol.append(tepe, sayilar, grafik, yer);
  sag.append(dokum);
  return [gez, sol, sag];
}

/**
 * GÜN SAYFASI — "o gün ne aldım".
 *
 * Kıyas ayın ortalamasına göre yapılır, son yedi güne göre değil: bu
 * sayfaya geçmiş bir aydan da gelinebiliyor ve orada "son 7 gün" o günün
 * çevresi değil, bugünün çevresi olurdu.
 */
export function gunSayfasi(veri, bugun, tarih) {
  const ay = tarih.slice(0, 7);
  const kayitlar = H.gununHarcamalari(veri.harcamalar, tarih);
  const toplam = H.toplamTL(kayitlar, veri.kur);
  const bos = kayitlar.length === 0;

  const gecenGun = H.ayinGecenGunu(ay, bugun);
  const ayOrtalama = gecenGun > 0 ? H.ayToplami(veri.harcamalar, veri.kur) / gecenGun : 0;

  let cumle = 'Bu gün için kayıt yok.';
  if (!bos && ayOrtalama > 0) {
    const fark = H.yuvarla(toplam) - H.yuvarla(ayOrtalama);
    cumle =
      fark === 0
        ? 'Ayın günlük ortalamasıyla aynı.'
        : `Ayın günlük ortalamasından ${H.bicimle(Math.abs(fark))} ₺ ` +
          (fark > 0 ? 'fazla.' : 'az.');
  }

  const tepe = tepeBlogu(
    `${Number(tarih.slice(8))} ${AYLAR[Number(ay.slice(5, 7)) - 1]} ${gunAdi(tarih)}`,
    bos ? null : `${kayitlar.length} kayıt`,
    toplam,
    cumle,
    bos
  );

  const gez = el('nav', 'gezinme');
  const geri = el('a', 'gezinme-geri');
  geri.href = '#harcama/' + ay;
  geri.append(el('span', 'gezinme-ok', '←'), el('span', null, ayAdi(ay)));

  // Gün gezinmesi: bugünden ileri gidilmez, geçmişe serbest.
  const orta = el('div', 'ay-gezinme');
  const onceki = el('a', 'ay-ok');
  onceki.href = '#gun/' + H.gunKaydir(tarih, -1);
  onceki.textContent = '‹';
  onceki.setAttribute('aria-label', 'Önceki gün');
  orta.append(onceki, el('span', 'gezinme-ay', `${Number(tarih.slice(8))} ${gunAdi(tarih)}`));

  if (tarih < bugun) {
    const sonraki = el('a', 'ay-ok');
    sonraki.href = '#gun/' + H.gunKaydir(tarih, 1);
    sonraki.textContent = '›';
    sonraki.setAttribute('aria-label', 'Sonraki gün');
    orta.append(sonraki);
  } else {
    orta.append(el('span', 'ay-ok ay-ok-bos', '›'));
  }
  gez.append(geri, orta);

  // Ayın tamamı, bakılan gün vurgulu: bu gün ayın neresine düşüyor
  // sorusunun cevabı ve aynı zamanda gezinme — sütuna basmak o güne gider.
  const grafik = ayGrafigiBlogu(veri, bugun, { bagli: true, vurgu: tarih });
  const daire = daireBlogu(kayitlar, veri.kur, 'KATEGORİ · BU GÜN', ay);
  const dokum = dokumBlogu(kayitlar, veri.kur, bugun, {
    baslik: 'KAYITLAR',
    tekGun: true,
  });

  if (!genisEkran()) return [gez, tepe, daire, dokum, grafik];

  const sol = el('div', 'sutun sutun-sol');
  const sag = el('div', 'sutun sutun-sag');
  sol.append(tepe, daire, grafik);
  sag.append(dokum);
  return [gez, sol, sag];
}

/** YER SAYFASI — "buraya ne kadar bırakıyorum". */
export function yerSayfasi(veri, bugun, yer) {
  const ay = veri.ay;
  const kayitlar = veri.harcamalar.filter(
    (h) => typeof h.yer === 'string' && h.yer.trim() === yer
  );
  const toplam = H.toplamTL(kayitlar, veri.kur);
  const bos = kayitlar.length === 0;
  const ziyaret = new Set(kayitlar.map((h) => h.tarih)).size;
  const gecenGun = H.ayinGecenGunu(ay, bugun);

  const cumle = bos
    ? `${ayAdi(ay)} ayında burada kayıt yok.`
    : `${ziyaret} ayrı günde ${kayitlar.length} kayıt.`;

  const tepe = tepeBlogu(
    yer,
    bos ? null : `${kayitlar.length} kayıt`,
    toplam,
    cumle,
    bos,
    { renk: null }
  );

  const sayilar = sayilarBlogu(null, [
    { etiket: 'ZİYARET BAŞINA', deger: ziyaret ? lira(toplam / ziyaret) : '0' },
    { etiket: 'İŞLEM BAŞINA', deger: bos ? '0' : lira(toplam / kayitlar.length) },
    { etiket: 'GÜNDE ORTALAMA', deger: gecenGun ? lira(toplam / gecenGun) : '0' },
  ]);

  const grafik = ayGrafigiBlogu(
    { ay, harcamalar: kayitlar, kur: veri.kur },
    bugun,
    { bagli: true }
  );
  const daire = daireBlogu(kayitlar, veri.kur, 'KATEGORİ · BURADA', ay);
  const dokum = dokumBlogu(kayitlar, veri.kur, bugun, {
    baslik: 'KAYITLAR',
    gizle: 'yer',
  });
  const gez = gezinme('harcama/' + ay, ayAdi(ay), yer);

  if (!genisEkran()) return [gez, tepe, sayilar, grafik, daire, dokum];

  const sol = el('div', 'sutun sutun-sol');
  const sag = el('div', 'sutun sutun-sag');
  sol.append(tepe, sayilar, grafik, daire);
  sag.append(dokum);
  return [gez, sol, sag];
}
