// Argos C — abonelik ayrıntı sayfası.
//
// Ana ekranın şeridi "aylık yük ne kadar" sorusunu cevaplıyor ve dört
// satırda kesiliyor. Abonelik sayısı yediye çıkınca dördü "+4 abonelik"
// satırında toplandı; hangileri olduğu hiçbir yerde görünmez oldu.
//
// Bu sayfa iki soruyu daha cevaplıyor:
//   NE ZAMAN çıkıyor  -> ay içindeki dağılım, tek bakışta
//   YILDA ne ediyor   -> aylık sayı yıllık düşünmeyi zorlaştırıyor

import * as H from '../js/hesap.js';
import {
  el,
  AYLAR,
  lira,
  ustSatir,
  buyukSayi,
  daireCiz,
  yuzdeDagit,
  genisEkran,
} from './ortak.js';

const SEMBOL = { USD: '$', EUR: '€', GBP: '£', TRY: '₺' };

/** Aboneliğin kendi para birimindeki yazılışı — döviz gizlenmez. */
function kendiTutari(a, kur) {
  const birim = a.birim || 'TRY';
  if (birim === 'TRY') return `${lira(a.tutar)} ₺`;
  const tl = lira(H.tryeCevir(a.tutar, birim, kur));
  return `${H.bicimle(a.tutar)} ${SEMBOL[birim] || birim} = ${tl} ₺`;
}

/**
 * ÖDEME TAKVİMİ — ayın hangi gününde ne çıkıyor.
 *
 * Ay grafiğiyle aynı biçim (sütun dizisi), çünkü aynı soru: zamanda
 * büyüklük. Farklı olan yalnız veri — harcama olan değil, çıkacak olan.
 *
 * Bugünden SONRAKİ ödemeler vurgulu: geçmiş ödeme bilgidir, gelecek ödeme
 * karardır ve ikisi aynı tonda çizilirse ay içinde nerede olunduğu
 * kaybolur.
 */
function takvimBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-takvim');
  blok.dataset.alan = 'takvim';

  const ay = bugun.slice(0, 7);
  const bugunGun = Number(bugun.slice(8, 10));
  const { gunler, takvimDisi, gunuBilinmeyen } = H.odemeTakvimi(
    veri.abonelikler,
    veri.kur,
    ay
  );

  const kalan = gunler
    .filter((g) => g.gun >= bugunGun)
    .reduce((t, g) => t + g.tutar, 0);

  blok.append(
    ustSatir(
      `${AYLAR[Number(ay.slice(5, 7)) - 1]} TAKVİMİ`,
      kalan > 0 ? `bu ay kalan ${lira(kalan)} ₺` : 'bu ayın ödemeleri bitti'
    )
  );

  const enBuyuk = Math.max(...gunler.map((g) => g.tutar), 1);
  const alan = el('div', 'ay-alan takvim-alan');
  alan.setAttribute('role', 'img');
  alan.setAttribute(
    'aria-label',
    'Ay içindeki ödemeler: ' +
      gunler
        .filter((g) => g.tutar > 0)
        .map((g) => `${g.gun}. gün ${g.adlar.join(', ')} ${lira(g.tutar)} lira`)
        .join('; ')
  );

  for (const g of gunler) {
    const sutun = el('div', 'ay-sutun');
    const dolgu = el('i');
    // Ödemesiz gün de görünür bir taban bırakır: sütunun tümden kaybolması
    // "o gün yok" gibi okunuyor, oysa o gün var ve ödemesiz.
    dolgu.style.height = `${Math.max((g.tutar / enBuyuk) * 100, 2)}%`;
    if (g.tutar > 0) dolgu.dataset.odeme = g.gun >= bugunGun ? 'gelecek' : 'gecmis';
    if (g.gun === bugunGun) dolgu.dataset.bugun = '';
    if (g.tutar > 0) {
      sutun.title = `${g.gun} ${AYLAR[Number(ay.slice(5, 7)) - 1]} · ${g.adlar.join(', ')} · ${lira(g.tutar)} ₺`;
    }
    sutun.append(dolgu);
    alan.append(sutun);
  }

  const etiket = el('div', 'ay-etiket');
  etiket.append(
    el('span', null, '1'),
    el('span', 'ay-secim', ''),
    el('span', null, String(gunler.length))
  );
  blok.append(alan, etiket);

  const notlar = [];
  if (takvimDisi > 0) notlar.push(`${takvimDisi} yıllık abonelik takvimde yok`);
  if (gunuBilinmeyen > 0) notlar.push(`${gunuBilinmeyen} abonelikte gün bilinmiyor`);
  if (notlar.length) blok.append(el('p', 'dipnot', notlar.join(' · ')));

  return blok;
}

/**
 * PAY — halka + liste.
 *
 * Renk burada SIRA kodluyor, kimlik değil: yedi abonelik her gün aynı
 * kalıyor ve her dilimin adı yanında yazılı. Kategorilerde renk kimlik
 * kodluyor çünkü orada aynı ad her gün başka sırada çıkıyor; burada
 * sıralama ancak bir abonelik eklenip çıkınca değişiyor.
 */
function payBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-abonepay');
  blok.dataset.alan = 'abonepay';

  const aktif = veri.abonelikler.filter((a) => a.aktif);
  // Sağ etiket sütunları adlandırıyor: iki sayı yan yana durunca
  // hangisinin ay hangisinin yıl olduğu okunmadan anlaşılmıyor.
  blok.append(ustSatir('PAY', 'aylık · yıllık'));

  if (aktif.length === 0) {
    blok.append(el('p', 'veri', 'Aktif abonelik yok'));
    return blok;
  }

  const satirlar = aktif
    .map((a) => ({ a, aylik: H.aylikGider(a, veri.kur) }))
    .sort((x, y) => y.aylik - x.aylik);

  const paylar = yuzdeDagit(satirlar.map((s) => s.aylik));
  const toplam = satirlar.reduce((t, s) => t + s.aylik, 0);
  const enBuyuk = satirlar[0].aylik;

  const liste = el('ul', 'kategori-barlar');
  satirlar.forEach((s, i) => {
    const satir = el('div', 'kategori-bar');
    const yol = el('span', 'kb-yol');
    const dolgu = el('i');
    dolgu.style.width = `${Math.max((s.aylik / enBuyuk) * 100, 2)}%`;
    dolgu.dataset.renk = String((i % 8) + 1);
    yol.append(dolgu);
    // Yıllık karşılık abonelik BAŞINA: toplam yıllık sayı yukarıda
    // duruyor ama "bu kalem bana yılda ne ediyor" sorusunu cevaplamıyor.
    // 90 ₺'lik bir abonelik ayda önemsiz görünüp yılda 1.080 ₺ ediyor.
    satir.append(
      el('span', 'kb-ad', s.a.ad),
      yol,
      el('span', 'kb-tutar', lira(s.aylik)),
      el('span', 'kb-yillik', lira(s.aylik * 12))
    );
    const li = el('li');
    li.append(satir);
    liste.append(li);
  });

  const dilimler = satirlar.map((s, i) => ({
    ad: s.a.ad,
    renk: (i % 8) + 1,
    pay: paylar[i],
  }));

  const ikili = el('div', 'kategori-ikili');
  ikili.append(daireCiz(dilimler, lira(toplam), '₺'), liste);
  blok.append(ikili);
  return blok;
}

/** Tam liste: yenileme günü, kendi para birimi, kalan gün. */
function listeBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-abonelist');
  blok.dataset.alan = 'abonelist';

  const yaklasan = H.yaklasanOdemeler(veri.abonelikler, bugun, 400);
  const sirali = new Map(yaklasan.map((y) => [y.abonelik.ad, y]));

  const aktif = veri.abonelikler
    .filter((a) => a.aktif)
    .slice()
    .sort((a, b) => {
      const ka = sirali.get(a.ad);
      const kb = sirali.get(b.ad);
      // Günü bilinmeyenler sona: sıralanacak bir tarihleri yok.
      if (!ka) return 1;
      if (!kb) return -1;
      return ka.kalanGun - kb.kalanGun;
    });

  blok.append(ustSatir('SIRAYLA', `${aktif.length} abonelik`));

  const liste = el('ul', 'kayitlar abone-dokum');

  if (aktif.length === 0) {
    liste.classList.add('kayitlar-bos');
    liste.append(el('li', 'kayit-bos', 'Aktif abonelik yok'));
    blok.append(liste);
    return blok;
  }

  for (const a of aktif) {
    const bilgi = sirali.get(a.ad);
    const li = el('li', 'kayit');
    if (bilgi && bilgi.kalanGun <= 7) li.dataset.bugun = '';

    li.append(
      el('span', 'saat', a.yenileme_gunu != null ? `${a.yenileme_gunu}.` : '—'),
      el('span', 'kategori', a.ad),
      el(
        'span',
        'detay',
        bilgi
          ? bilgi.kalanGun === 0
            ? 'bugün'
            : `${bilgi.kalanGun} gün sonra`
          : 'gün bilinmiyor'
      ),
      el('span', 'tutar', kendiTutari(a, veri.kur))
    );
    liste.append(li);
  }

  blok.append(liste);
  return blok;
}

/**
 * ABONELİK SAYFASI.
 *
 * Dev sayı AYLIK yük; ana ekranın şeridinde de o duruyor. Yıllık karşılık
 * yanında küçük sayı olarak veriliyor — asıl karar orada veriliyor ama
 * günlük yaşanan sayı aylık olan.
 */
export function abonelikSayfasi(veri, bugun) {
  const aktif = veri.abonelikler.filter((a) => a.aktif);
  const aylik = H.aylikAbonelikToplami(veri.abonelikler, veri.kur);
  const yillik = H.yillikAbonelikToplami(veri.abonelikler, veri.kur);
  const gunluk = aylik / 30;
  const bos = aktif.length === 0;

  const tepe = el('section', 'blok blok-aytoplam');
  tepe.dataset.alan = 'aytoplam';
  tepe.append(ustSatir('AYLIK ABONELİK YÜKÜ', bos ? null : `${aktif.length} abonelik`));
  tepe.append(buyukSayi(lira(aylik), '₺', 'dev', { bos }));
  tepe.append(
    el(
      'p',
      'yorum',
      bos
        ? 'Aktif abonelik yok.'
        : `Yılda ${lira(yillik)} ₺, günde ${lira(gunluk)} ₺ demek.`
    )
  );

  const sayilar = el('section', 'blok blok-ayozet');
  sayilar.dataset.alan = 'ayozet';
  const kutu = el('div', 'ay-ozet');
  const dovizli = aktif.filter((a) => (a.birim || 'TRY') !== 'TRY').length;
  for (const o of [
    { etiket: 'YILLIK', deger: lira(yillik) },
    { etiket: 'GÜNDE', deger: lira(gunluk) },
    // "kur riski" birim olarak okunmuyordu ("1 kur riski"); dövizli
    // olmak zaten kur riski demek, sayının birimi abonelik.
    { etiket: 'DÖVİZLİ', deger: String(dovizli), birim: 'abonelik' },
  ]) {
    const oge = el('div', 'ay-oge');
    oge.append(el('p', 'etiket', o.etiket));
    const satir = el('p', 'ay-deger');
    satir.append(el('b', null, o.deger), el('span', null, o.birim || '₺'));
    oge.append(satir);
    kutu.append(oge);
  }
  sayilar.append(kutu);

  const gez = el('nav', 'gezinme');
  const geri = el('a', 'gezinme-geri');
  geri.href = '#';
  geri.append(el('span', 'gezinme-ok', '←'), el('span', null, 'BUGÜN'));
  gez.append(geri, el('span', 'gezinme-ay', 'Abonelik'));

  const takvim = takvimBlogu(veri, bugun);
  const pay = payBlogu(veri, bugun);
  const liste = listeBlogu(veri, bugun);

  if (!genisEkran()) return [gez, tepe, sayilar, takvim, pay, liste];

  const sol = el('div', 'sutun sutun-sol');
  const sag = el('div', 'sutun sutun-sag');
  sol.append(tepe, sayilar, takvim);
  sag.append(pay, liste);
  return [gez, sol, sag];
}
