// Argos C — alışkanlığın ayrıntı sayfası.
//
// Ana ekrandaki kart bugünü anlatıyor: yapıldı mı, seri kaç. Bu sayfa
// GEÇMİŞİ anlatıyor — desen nerede kopuyor, hangi gün kaçırılıyor, rekor
// neydi. İki soru ayrı ve ikincisi kartın içine sığmıyordu; 14 günlük iz
// şeridi deseni gösteriyor ama saymıyor.
//
// Harcama sayfalarıyla aynı iskelet: gezinme + tepe + bloklar. Farklı
// olan yalnız veri; görsel dil, kapılar ve boşluk davranışı ortak.

import * as H from '../js/hesap.js';
import {
  el,
  AYLAR,
  GUNLER,
  KISA_GUN,
  ustSatir,
  buyukSayi,
  genisEkran,
} from './ortak.js';

// Isı haritası penceresinin TAVANI. 12 hafta = bir çeyrek; telefonda
// satır başına 12 hücre sığıyor. Geniş ekranda yarım yıl.
const ISI_HAFTA = 12;
const ISI_HAFTA_GENIS = 26;
// Tabanı: takip yeni başladıysa tavan kadar geniş bir ızgara neredeyse
// tamamen boş çiziliyor ve grafik "veri yok" gibi okunuyor. Pencere ilk
// kayda göre büyür, tavana kadar.
const ISI_HAFTA_EN_AZ = 4;

/** Bu alışkanlığın ilk işaretinden bugüne kaç hafta geçti. */
function gecmisHaftasi(tanim, onaylar, bugun) {
  const ilk = onaylar
    .filter((o) => o.aliskanlik === tanim.id)
    .map((o) => o.tarih)
    .sort()[0];
  if (!ilk) return ISI_HAFTA_EN_AZ;
  return Math.ceil((H.gunFarki(bugun, ilk) + 1) / 7);
}

const kucuk = (s) => s.toLocaleLowerCase('tr');

/** Sıklığın okunur hâli — kartlardakiyle aynı sözcükler. */
function ritim(tanim) {
  const s = tanim.siklik || {};
  if (s.tip === 'gun-arasi') return `${s.deger} günde bir`;
  if (s.tip === 'haftalik') return `haftada ${s.deger}`;
  return 'her gün';
}

/** Seri biriminin doğrusu: gün-arasında sayılan gün değil TUR. */
function seriEtiketi(tanim) {
  const tip = (tanim.siklik || {}).tip;
  if (tip === 'gun-arasi') return 'KEZ ÜST ÜSTE';
  if (tip === 'haftalik') return 'BU HAFTA';
  return 'GÜNDÜR';
}

/**
 * ISI HARİTASI — hafta sütun, gün satır.
 *
 * İz şeridi (ana ekran) son 14 günü tek sıra hâlinde gösteriyor; burada
 * pencere altı katına çıkıyor ve tek sıra okunmaz oluyordu. Haftaları
 * sütuna almak iki şeyi birden veriyor: satırlar haftanın günü olduğu
 * için "hep cumartesi kaçıyor" desenini dikey okuyabiliyorsun, sütunlar
 * da zamanı soldan sağa taşıyor.
 *
 * Pazartesi ilk satır: hafta pazartesi başlıyor (Türkiye takvimi) ve
 * hafta sonu iki satır alt alta düşüyor, ayrı bir küme olarak görünüyor.
 */
function isiBlogu(tanim, veri, bugun, haftaSayisi) {
  const blok = el('section', 'blok blok-isi');
  blok.dataset.alan = 'isi';

  // Izgara pazartesiden başlamalı; bugünün haftasının pazartesisini bul,
  // oradan geriye haftaSayisi kadar git.
  const bugunGun = new Date(bugun + 'T00:00:00').getDay();
  const pazartesiFarki = (bugunGun + 6) % 7;
  const sonPazartesi = H.gunKaydir(bugun, -pazartesiFarki);
  const bas = H.gunKaydir(sonPazartesi, -(haftaSayisi - 1) * 7);
  const toplamGun = H.gunFarki(bugun, bas) + 1;

  const iz = H.aliskanlikIzi(tanim, veri.onaylar, bugun, toplamGun);
  const durumlar = new Map(iz.map((g) => [g.gun, g.durum]));
  const sayac = H.izSayaci(iz);

  blok.append(
    ustSatir(
      `SON ${haftaSayisi} HAFTA`,
      `${sayac.yapildi} yapıldı · ${sayac.yapilmadi} kaçtı`
    )
  );

  const izgara = el('div', 'isi');
  // Sütun sayısı ekrana göre değişiyor (12 hafta / 26 hafta); ızgara
  // şablonu bu değişkenden okuyor.
  izgara.style.setProperty('--hafta', String(haftaSayisi));
  izgara.setAttribute('role', 'img');
  izgara.setAttribute(
    'aria-label',
    `Son ${haftaSayisi} hafta: ${sayac.yapildi} gün yapıldı, ` +
      `${sayac.yapilmadi} gün kaçırıldı, ${sayac.beklenmiyor} gün beklenmiyordu`
  );

  for (let satir = 0; satir < 7; satir++) {
    const etiket = el('span', 'isi-gun', KISA_GUN[(satir + 1) % 7]);
    izgara.append(etiket);

    for (let hafta = 0; hafta < haftaSayisi; hafta++) {
      const gun = H.gunKaydir(bas, hafta * 7 + satir);
      const hucre = el('i', 'isi-hucre');

      // Gelecek günler ızgarada YER TUTAR ama boyanmaz: hafta sütunu
      // eksik kalırsa son sütun diğerlerinden dar görünüyor ve göz onu
      // "veri bitti" diye değil "grafik bozuk" diye okuyor.
      if (gun > bugun) {
        hucre.dataset.d = 'gelecek';
      } else {
        hucre.dataset.d = durumlar.get(gun) || 'kayitsiz';
        hucre.title = `${Number(gun.slice(8))} ${AYLAR[Number(gun.slice(5, 7)) - 1]}`;
      }
      izgara.append(hucre);
    }
  }

  blok.append(izgara);
  return blok;
}

/**
 * HAFTANIN GÜNÜ — hangi gün tutuyor, hangi gün kaçıyor.
 *
 * Isı haritası deseni gösteriyor ama sayı vermiyor; iki cumartesi
 * kaçırdıysan ızgarada iki soluk kare görünür, oran görünmez.
 * Beklenmediği günün çubuğu YOK, sıfır değil — "o gün hiç yapmadım" ile
 * "o gün zaten beklenmiyordu" ayrı şeyler.
 */
function gunDeseniBlogu(tanim, veri, bugun, gunSayisi) {
  const blok = el('section', 'blok blok-gundeseni');
  blok.dataset.alan = 'gundeseni';
  blok.append(ustSatir('HAFTANIN GÜNÜ', null));

  const dagilim = H.aliskanlikGunDagilimi(tanim, veri.onaylar, bugun, gunSayisi);
  const olculen = dagilim.filter((d) => d.oran !== null);

  if (olculen.length === 0) {
    blok.append(el('p', 'veri', 'Desen için henüz yeterli kayıt yok'));
    return blok;
  }

  const liste = el('ul', 'kategori-barlar');
  for (const d of dagilim) {
    const satir = el('div', 'kategori-bar');
    const yol = el('span', 'kb-yol');

    if (d.oran === null) {
      // Ölçülmemiş gün: çubuk hiç çizilmez, yerine tire.
      satir.append(
        el('span', 'kb-ad', kucuk(GUNLER[(d.gun + 1) % 7])),
        yol,
        el('span', 'kb-tutar', '—')
      );
    } else {
      const dolgu = el('i');
      dolgu.style.width = `${Math.max(d.oran * 100, 2)}%`;
      dolgu.dataset.durum = d.oran === 1 ? 'tam' : 'eksik';
      yol.append(dolgu);
      satir.append(
        el('span', 'kb-ad', kucuk(GUNLER[(d.gun + 1) % 7])),
        yol,
        el('span', 'kb-tutar', `${d.yapildi}/${d.beklenen}`)
      );
    }

    const li = el('li');
    li.append(satir);
    liste.append(li);
  }

  blok.append(liste);
  return blok;
}

/** Gün gün döküm — yalnız işaretlenmiş günler, yeniden eskiye. */
function dokumBlogu(tanim, veri, bugun) {
  const blok = el('section', 'blok blok-dokum');
  blok.dataset.alan = 'dokum';

  const kayitlar = veri.onaylar
    .filter((o) => o.aliskanlik === tanim.id)
    .sort((a, b) => b.tarih.localeCompare(a.tarih));

  blok.append(
    ustSatir('İŞARETLER', kayitlar.length ? `${kayitlar.length} kayıt` : null)
  );

  const liste = el('ul', 'kayitlar isaret-liste');

  if (kayitlar.length === 0) {
    liste.classList.add('kayitlar-bos');
    liste.append(el('li', 'kayit-bos', 'Henüz işaret yok'));
    blok.append(liste);
    return blok;
  }

  for (const o of kayitlar) {
    const d = new Date(o.tarih + 'T00:00:00');
    const li = el('li', 'kayit');
    if (o.tarih === bugun) li.dataset.bugun = '';

    // Gün, o günün harcama sayfasına açılır: aynı tarih iki kayıt türünü
    // birden taşıyor ve aralarında gezinebilmek işe yarıyor.
    const bag = el('a', 'saat');
    bag.href = '#gun/' + o.tarih;
    bag.textContent = `${d.getDate()} ${kucuk(AYLAR[d.getMonth()]).slice(0, 3)}`;

    const durum = el('span', 'kategori isaret-durum');
    durum.dataset.durum = o.durum;
    durum.textContent = o.durum === 'yapildi' ? 'yapıldı' : 'kaçırıldı';

    li.append(
      bag,
      durum,
      el('span', 'detay', kucuk(GUNLER[d.getDay()])),
      el('span', 'tutar', o.kaynak === 'app' ? 'telefon' : 'claude')
    );
    liste.append(li);
  }

  blok.append(liste);
  return blok;
}

/**
 * ALIŞKANLIK SAYFASI.
 *
 * Dev sayı SERİ: ana ekranın kartında da o duruyor ve sayfaya girince
 * aynı sayının karşılanması, doğru yere gelindiğini söylüyor.
 */
export function aliskanlikSayfasi(veri, bugun, id) {
  const tanim = veri.tanimlar.find((t) => t.id === id);

  if (!tanim) {
    const blok = el('section', 'blok');
    blok.append(el('p', 'etiket', 'BULUNAMADI'));
    blok.append(el('p', 'yorum', `"${id}" diye bir alışkanlık tanımlı değil.`));
    const gez = el('nav', 'gezinme');
    const geri = el('a', 'gezinme-geri');
    geri.href = '#';
    geri.append(el('span', 'gezinme-ok', '←'), el('span', null, 'BUGÜN'));
    gez.append(geri);
    return [gez, blok];
  }

  const tavan = genisEkran() ? ISI_HAFTA_GENIS : ISI_HAFTA;
  const haftaSayisi = Math.min(
    tavan,
    Math.max(ISI_HAFTA_EN_AZ, gecmisHaftasi(tanim, veri.onaylar, bugun))
  );
  const pencere = haftaSayisi * 7;

  const onay = H.onayBul(veri.onaylar, id, bugun);
  const bekleniyor = H.bugunBekleniyorMu(tanim, veri.onaylar, bugun);
  const seri =
    (tanim.siklik || {}).tip === 'haftalik'
      ? H.haftalikDurum(tanim, veri.onaylar, bugun).yapilan
      : H.seriHesapla(tanim, veri.onaylar, bugun);
  const rekor = H.enUzunSeri(tanim, veri.onaylar);
  const iz = H.aliskanlikIzi(tanim, veri.onaylar, bugun, pencere);
  const sayac = H.izSayaci(iz);
  const olculen = sayac.yapildi + sayac.yapilmadi;

  // Tepe cümlesi bugünün durumunu söyler; sayı geçmişi anlatıyor, cümle
  // "şimdi ne olacak" sorusunu cevaplıyor.
  let cumle;
  if (onay) {
    cumle =
      onay.durum === 'yapildi' ? 'Bugün yapıldı.' : 'Bugün kaçırıldı.';
  } else if (bekleniyor) {
    cumle = 'Bugün bekleniyor.';
  } else {
    cumle = 'Bugün ara günü.';
  }

  const tepe = el('section', 'blok blok-aytoplam');
  tepe.dataset.alan = 'aytoplam';
  const kimlik = el('div', 'ust-satir');
  const ad = el('p', 'kimlik');
  const nokta = el('span', 'nokta');
  nokta.dataset.durum = onay ? onay.durum : bekleniyor ? 'bekliyor' : 'beklenmiyor';
  ad.append(nokta, el('span', 'kimlik-ad', tanim.ad));
  kimlik.append(ad, el('p', 'veri', ritim(tanim)));
  tepe.append(kimlik);
  tepe.append(buyukSayi(String(seri), seriEtiketi(tanim), 'dev', { bos: seri === 0 }));
  tepe.append(el('p', 'yorum', cumle));

  const sayilar = el('section', 'blok blok-ayozet');
  sayilar.dataset.alan = 'ayozet';
  const kutu = el('div', 'ay-ozet');
  for (const o of [
    {
      etiket: 'EN UZUN SERİ',
      deger: String(rekor),
      birim: rekor > 0 && seri === rekor ? 'şu an' : 'kez',
    },
    { etiket: 'TUTTURULAN', deger: olculen ? `%${Math.round((sayac.yapildi / olculen) * 100)}` : '—', birim: `${sayac.yapildi}/${olculen}` },
    { etiket: 'KAÇIRILAN', deger: String(sayac.yapilmadi), birim: 'gün' },
  ]) {
    const oge = el('div', 'ay-oge');
    oge.append(el('p', 'etiket', o.etiket));
    const satir = el('p', 'ay-deger');
    satir.append(el('b', null, o.deger), el('span', null, o.birim));
    oge.append(satir);
    kutu.append(oge);
  }
  sayilar.append(kutu);

  const gez = el('nav', 'gezinme');
  const geri = el('a', 'gezinme-geri');
  geri.href = '#';
  geri.append(el('span', 'gezinme-ok', '←'), el('span', null, 'BUGÜN'));
  gez.append(geri, el('span', 'gezinme-ay', tanim.ad));

  const isi = isiBlogu(tanim, veri, bugun, haftaSayisi);
  const desen = gunDeseniBlogu(tanim, veri, bugun, pencere);
  const dokum = dokumBlogu(tanim, veri, bugun);

  if (!genisEkran()) return [gez, tepe, sayilar, isi, desen, dokum];

  const sol = el('div', 'sutun sutun-sol');
  const sag = el('div', 'sutun sutun-sag');
  sol.append(tepe, sayilar, isi, desen);
  sag.append(dokum);
  return [gez, sol, sag];
}
