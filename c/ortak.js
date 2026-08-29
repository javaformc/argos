// Argos C — iki ekranın ORTAK parçaları.
//
// Ana ekran (ana.js) ile ayrıntı sayfaları (harcama.js …) aynı görsel dili
// konuşuyor: aynı kategori renkleri, aynı yığın şeridi, aynı kayıt satırı.
// Bu dosya o dilin kendisi.
//
// Buraya yalnız İKİ ekranda birden kullanılan şey girer. Tek ekrana ait bir
// blok kendi dosyasında kalır — "ortak" adı yüzünden her şeyin döküldüğü
// yer olursa hangi ekranın neye bağlı olduğu okunamaz hale gelir.
//
// Hesap burada da yapılmaz: hesap ../js/hesap.js'te.

import * as H from '../js/hesap.js';

const EN_COK_DILIM = 5; // şerit + lejant; fazlası "+N kategori"e iner
// Masaüstünde kuyruk toplanmaz: sekiz kademe var ve lejant iki sütuna rahat
// sığıyor. Beş dilim telefondaki okunabilirlik sınırıydı, burada değil.
const EN_COK_DILIM_GENIS = 8;
export const genisEkran = () => matchMedia('(min-width: 1024px)').matches;

// --- Küçük yardımcılar ---------------------------------------------------

export function el(etiket, sinif, metin) {
  const d = document.createElement(etiket);
  if (sinif) d.className = sinif;
  if (metin != null) d.textContent = metin;
  return d;
}

// CSS `text-transform: uppercase` Türkçe "i"yi "I" yapar; doğrusu "İ".
// Büyük harfli her etiket doğrudan büyük harfle yazılır, dönüştürülmez.
export const AYLAR = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK',
];
export const GUNLER = [
  'PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ',
];
export const KISA_GUN = ['pz', 'pt', 'sa', 'ça', 'pe', 'cu', 'ct'];

const KATEGORI_ADI = {
  'yeme-icme': 'yeme-içme',
  'kisisel-bakim': 'kişisel bakım',
  'toplu-tasima': 'toplu taşıma',
  'elektronik-parca': 'elektronik parça',
  'spor-salonu': 'spor salonu',
  ulasim: 'ulaşım',
  saglik: 'sağlık',
  egitim: 'eğitim',
  eglence: 'eğlence',
  diger: 'diğer',
  dogalgaz: 'doğalgaz',
  yazilim: 'yazılım',
  tatli: 'tatlı',
  kirtasiye: 'kırtasiye',
};

/**
 * Renk KATEGORİYE bağlıdır, sıraya değil (A'nın kararı).
 *
 * A'nın kusuru düzeltildi: A yalnız beş kategoriyi haritalayıp gerisini
 * tek griye düşürüyordu ve ekranda "kişisel bakım" ile "diğer" ayırt
 * edilemeyen iki gri dilim oluyordu. Burada bilinen her kategorinin
 * kendi hue'su var; bilinmeyen ad sekiz hue'ya deterministik dağıtılır.
 *
 * Nötr (`n`) YALNIZ kuyruk toplamasına ayrılmıştır. `diger` gerçek bir
 * kategoridir ve kendi rengini alır; kuyruk ise "diğer" diye değil
 * "+N kategori" diye adlandırılır — böylece ikisi ne renkte ne adda
 * çakışır. (B bu çakışmayı yakalamıştı, A'da vardı.)
 */
const KATEGORI_RENGI = {
  market: 1,
  'yeme-icme': 2,
  ulasim: 3,
  fatura: 4,
  teknoloji: 5,
  'kisisel-bakim': 6,
  saglik: 7,
  eglence: 8,
  yazilim: 5,
  'elektronik-parca': 5,
  'toplu-tasima': 3,
  'spor-salonu': 8,
  egitim: 6,
  dogalgaz: 4,
  tatli: 2,
  kirtasiye: 7,
  diger: 4,
};

export function renkNo(kategori) {
  const bilinen = KATEGORI_RENGI[kategori];
  if (bilinen) return bilinen;
  let t = 0;
  for (let i = 0; i < kategori.length; i++) t = (t * 31 + kategori.charCodeAt(i)) % 8;
  return t + 1;
}

/**
 * ÇAKIŞMA ÇÖZÜCÜ — A'nın ekranda görünen kusurunun düzeltmesi.
 *
 * On yediden fazla kategori var, sekiz hue. Harita ne kadar dikkatli
 * kurulursa kurulsun aynı gün iki kategori aynı renge düşebilir; A'da
 * "kişisel bakım" ve "diğer" tam olarak bunu yapıyor ve şeritte ayırt
 * edilemeyen iki dilim bırakıyordu.
 *
 * Kural: BÜYÜK dilim rengini korur, küçük olan ilk boş hue'ya kayar.
 * Dilimler büyükten küçüğe sıralı olduğu için ekranın baskın renkleri
 * günden güne sabit kalır — renk kimliği asıl orada işe yarıyor — ve
 * yalnız kuyruktaki küçük dilim yer değiştirir. Aynı ekranda iki dilimin
 * aynı renkte olması, bir dilimin renginin dün başka olmasından kötüdür.
 */
function renkleriAyir(dilimler) {
  const kullanilan = new Set();
  for (const d of dilimler) {
    if (d.renk === 'n') continue; // nötr yalnız kuyruğun, çakışması yok
    if (!kullanilan.has(d.renk)) {
      kullanilan.add(d.renk);
      continue;
    }
    for (let aday = 1; aday <= 8; aday++) {
      if (!kullanilan.has(aday)) {
        d.renk = aday;
        break;
      }
    }
    kullanilan.add(d.renk);
  }
  return dilimler;
}

export const SEMBOL = { USD: '$', EUR: '€', GBP: '£', TRY: '₺' };

/**
 * Kategori adı. Baş harf BÜYÜK: lejantta tümü küçük harfle dizilince
 * adlar tutarların yanında siliniyordu — büyük harf onlara satır içinde
 * kendi ağırlığını veriyor. `text-transform` kullanılmaz (Türkçe "i"yi
 * bozar); ilk harf elle yükseltilir, Türkçe kurala göre ("i" → "İ").
 */
export const basHarf = (s) =>
  s ? s[0].toLocaleUpperCase('tr') + s.slice(1) : s;

export const oku = (k) => basHarf(KATEGORI_ADI[k] || k);
export const lira = (ham) => H.bicimle(H.yuvarla(ham));
export const ikiHane = (n) => String(n).padStart(2, '0');

/**
 * Yüzdeleri tam 100'e tamamlar.
 * Tutarlarda `ceil` doğrudur — az göstermektense fazla göster. Ama payda
 * `ceil` dört satırda toplamı 100'ün üstüne çıkarır ve bu görünür bir
 * hatadır. Pay normal yuvarlanır, artık EN BÜYÜK paya yüklenir.
 */
export function yuzdeDagit(degerler) {
  const toplam = degerler.reduce((t, d) => t + d, 0);
  if (toplam <= 0) return degerler.map(() => 0);

  const paylar = degerler.map((d) => Math.round((d / toplam) * 100));
  const fark = 100 - paylar.reduce((t, p) => t + p, 0);
  if (fark !== 0) {
    let enBuyuk = 0;
    for (let i = 1; i < degerler.length; i++) {
      if (degerler[i] > degerler[enBuyuk]) enBuyuk = i;
    }
    paylar[enBuyuk] += fark;
  }
  return paylar;
}

/** Büyük sayı + birimi. Birim sayının tabanına hizalanır, küçüktür. */
export function buyukSayi(sayi, birim, boy, secenek) {
  const s = secenek || {};
  const p = el('p', 'sayi');
  p.dataset.boy = boy;
  if (s.seri) p.dataset.seri = 'evet';
  if (s.bos) p.dataset.bos = 'evet';
  p.append(el('b', null, sayi), el('span', null, birim));
  return p;
}

/**
 * Ayrıntı sayfasına açılan blok başlığı.
 *
 * Argos'ta gezinme çubuğu yok ve bilerek yok: kalıcı bir sekme şeridi,
 * ekranın altından yer yiyor ve tıklanabilir öğe sayısını iki katına
 * çıkarıyordu (şu an ekranda basılan tam iki şey var, o da alışkanlık
 * onayı). Bunun yerine bloğun KENDİ başlığı kapıdır: hangi başlığa
 * basıldığı, nereye gidileceğini zaten söylüyor.
 *
 * <a> olması gerekli: geri tuşu, klavye odağı ve "yeni sekmede aç"
 * bedavaya geliyor; aynı işi yapan bir <button> üçünü de elde ister.
 */
export function baslikBagi(metin, rota) {
  const bag = el('a', 'etiket etiket-bag');
  bag.href = '#' + rota;
  bag.append(el('span', null, metin), el('span', 'etiket-ok', '›'));
  return bag;
}

/** Solda etiket, sağda ham veri — blok başlıkları hep bu biçimde. */
export function ustSatir(etiket, sag) {
  const satir = el('div', 'ust-satir');
  satir.append(el('p', 'etiket', etiket));
  if (sag) satir.append(el('p', 'veri', sag));
  return satir;
}

// --- Yığın şeridi (parça-bütün taşıyan HER veri bununla çizilir) ---------

export function seritCiz(dilimler, ince) {
  const serit = el('div', ince ? 'serit serit-ince' : 'serit');
  serit.setAttribute('role', 'img');

  if (dilimler.length === 0) {
    serit.setAttribute('aria-label', 'Dağılım için henüz kayıt yok');
    return serit;
  }

  serit.setAttribute(
    'aria-label',
    dilimler.map((d) => `${d.ad} yüzde ${d.pay}`).join(', ')
  );
  for (const d of dilimler) {
    const parca = el('i');
    if (d.kademe != null) parca.dataset.kademe = String(d.kademe);
    else parca.dataset.renk = String(d.renk);
    parca.style.flexGrow = String(Math.max(d.tutar, 0.0001));
    serit.append(parca);
  }
  return serit;
}
/**
 * En büyük dört kategori + kuyruk. Kuyruk "diğer" değil "+N kategori"
 * diye adlandırılır: `diger` zaten gerçek bir kategori adı ve ikisi aynı
 * adı taşırsa şerit etiketi kayıt listesiyle çelişir.
 *
 * Kuyruk toplamı ikinci kategoriyi geçebilir; dilimler her zaman gerçek
 * büyüklük sırasında dizilir, yoksa lejantın okuma sırası bozulur.
 */
export function kategoriDagilimi(harcamalar, kur) {
  const tumu = H.kategoriKirilimi(harcamalar, kur);
  if (tumu.length === 0) return [];

  const yap = (k) => ({ ad: oku(k.kategori), tutar: k.tutar, renk: renkNo(k.kategori) });

  const tavan = genisEkran() ? EN_COK_DILIM_GENIS : EN_COK_DILIM;

  let dilimler;
  if (tumu.length <= tavan) {
    dilimler = tumu.map(yap);
  } else {
    const kuyruk = tumu.slice(tavan - 1);
    dilimler = [
      ...tumu.slice(0, tavan - 1).map(yap),
      {
        ad: `+${kuyruk.length} kategori`,
        tutar: kuyruk.reduce((t, k) => t + k.tutar, 0),
        renk: 'n',
      },
    ];
    dilimler.sort((a, b) => b.tutar - a.tutar);
  }

  renkleriAyir(dilimler);
  const paylar = yuzdeDagit(dilimler.map((d) => d.tutar));
  return dilimler.map((d, i) => ({ ...d, pay: paylar[i] }));
}

/** Renkli her dilimin yazılı adı ve TL tutarı. Renk tek başına bilgi taşımaz. */
export function lejantCiz(dilimler) {
  const liste = el('ul', 'lejant');
  for (const d of dilimler) {
    const nokta = el('span', 'nokta');
    nokta.dataset.renk = String(d.renk);
    const li = el('li');
    li.append(nokta, el('span', 'ad', d.ad), el('span', 'tut', lira(d.tutar)));
    liste.append(li);
  }
  return liste;
}

// --- Kayıt satırı --------------------------------------------------------

/**
 * Günün kayıtları: saatliler yeniden eskiye, saatsizler sonda.
 * Saatsizi başa ya da araya koymak, bilinmeyen bir saati bilinen bir yere
 * yerleştirmek olurdu.
 */
export function saateGore(kayitlar) {
  return kayitlar.slice().sort((a, b) => {
    const da = H.dakikaya(a.saat);
    const db = H.dakikaya(b.saat);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return db - da;
  });
}

/**
 * Kayıt satırının detay sütunu.
 * Döviz kaydında yer/alt yerine ÇEVRİM yazılır: `3,5 $ × 49`. A bu kaydı
 * sessizce 172 ₺ diye gösteriyordu ve kur değiştiğinde sayının neden
 * oynadığı anlaşılmıyordu. Çarpım işareti, sayının ne olduğunu söylemek
 * zorunda bırakır.
 */
function kayitDetayi(h, kur) {
  const birim = h.birim || 'TRY';
  if (birim !== 'TRY') {
    const oran = H.bicimle(H.yuvarla(kur[birim]));
    return `${H.bicimle(h.tutar)} ${SEMBOL[birim] || birim} × ${oran}`;
  }
  return h.yer || (h.alt ? oku(h.alt) : '');
}

export function kayitSatiri(h, kur) {
  const li = el('li', 'kayit');
  li.append(
    // Saatsiz kayıtta sütun boş bırakılmaz: hizalı satırların altında sol
    // kenarı tırtıklı bir yetim satır bırakıyordu. Sembol değil kelime.
    el('span', 'saat', h.saat || 'saatsiz'),
    el('span', 'kategori', oku(h.kategori)),
    el('span', 'detay', kayitDetayi(h, kur)),
    el('span', 'tutar', `${lira(H.tryeCevir(h.tutar, h.birim || 'TRY', kur))} ₺`)
  );
  return li;
}

// --- Ay blokları ---------------------------------------------------------
// Bugünü değil AYI anlatan bloklar. Ana ekranda yalnız masaüstünde
// çizilirler; harcama ayrıntı sayfasında her genişlikte, çünkü orada
// zaten sorulan soru "ay nasıl geçti".

/**
 * AYIN GÜNLERİ — ayın 1'inden bugüne her gün bir sütun.
 *
 * Hafta grafiği "bu hafta nasıl geçti" der; bu grafik ayın şeklini gösterir:
 * maaş günü sıçraması, hafta sonu tepeleri, sakin geçen aralıklar. Yedi
 * sütunda görünmeyen desen otuz sütunda görünüyor.
 */
export function ayGrafigiBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-ay');
  blok.dataset.alan = 'ay';

  const gecenGun = Number(bugun.slice(8, 10));
  const gunler = H.sonGunler(veri.harcamalar, veri.kur, bugun, gecenGun);
  const toplam = gunler.reduce((t, g) => t + g.tutar, 0);
  const ortalama = gecenGun > 0 ? toplam / gecenGun : 0;
  const enBuyuk = Math.max(...gunler.map((g) => g.tutar), ortalama, 1);

  const ayAdi = AYLAR[Number(bugun.slice(5, 7)) - 1];

  // Kayıtsız ayda grafik ÇİZİLMEZ. Otuz sıfır sütunu, taban çizgileri
  // dışında hiçbir şey göstermeyen 200px'lik bir kutu bırakıyordu ve o
  // kutu "içerik vardı, yüklenemedi" gibi okunuyor. "ort. 0 ₺" da öyle:
  // olmayan bir ortalamayı sayıya çevirmek boşluğu bilgi gibi gösterir.
  if (toplam === 0) {
    blok.append(ustSatir(ayAdi, null));
    blok.append(el('p', 'veri', 'Bu ay kayıt yok'));
    return blok;
  }

  blok.append(ustSatir(ayAdi, `${gecenGun} gün · ort. ${lira(ortalama)} ₺`));

  const alan = el('div', 'ay-alan');
  alan.setAttribute('role', 'img');
  alan.setAttribute(
    'aria-label',
    `${ayAdi} ayının günlük harcaması: ` +
      gunler.map((g) => `${g.gun.slice(8)} ${lira(g.tutar)} lira`).join(', ')
  );

  if (ortalama > 0) {
    const cizgi = el('div', 'hafta-ort');
    cizgi.style.bottom = `${Math.min((ortalama / enBuyuk) * 100, 100)}%`;
    alan.append(cizgi);
  }

  for (const g of gunler) {
    const sutun = el('i');
    sutun.style.height = `${Math.max((g.tutar / enBuyuk) * 100, 3)}%`;
    if (g.gun === bugun) sutun.dataset.bugun = '';
    // Hafta sonu ayrı tonda: ayın ritmi çoğu zaman haftaya bağlı ve bu
    // ayrım olmadan otuz sütun tek bir gürültü kütlesi gibi okunuyor.
    const gun = new Date(`${g.gun}T00:00:00`).getDay();
    if (gun === 0 || gun === 6) sutun.dataset.haftasonu = '';
    sutun.title = `${g.gun.slice(8)} · ${lira(g.tutar)} ₺`;
    alan.append(sutun);
  }

  const etiket = el('div', 'ay-etiket');
  etiket.append(el('span', null, '1'), el('span', null, String(gecenGun)));
  blok.append(alan, etiket);

  return blok;
}

/**
 * KATEGORİ (BU AY) — yatay barlar, büyükten küçüğe.
 *
 * Bugünün şeridi günü anlatıyor; bu liste ayı anlatıyor. Aynı biçimi
 * (yığın şeridi) ikinci kez kullanmak yerine yatay bar seçildi: burada
 * soru "parça-bütün" değil "hangisi daha büyük" ve sıralı barlar o soruyu
 * yığından daha doğrudan cevaplıyor.
 */
export function ayKategoriBlogu(veri, bugun, tavan = 7) {
  const blok = el('section', 'blok blok-kategori');
  blok.dataset.alan = 'kategori';

  // Tavan ana ekranda 7: pano sütunu dar ve orada soru "en büyükler ne".
  // Ayrıntı sayfası tavanı kaldırır — o sayfanın varlık sebebi tam döküm,
  // orada kuyruğu kesmek sayfayı ana ekranın kopyasına çevirirdi.
  const tumu = H.kategoriKirilimi(veri.harcamalar, veri.kur);
  // Çakışma çözücü burada da geçerli: sekiz hue, on yediden fazla
  // kategori var ve "fatura" ile "diğer" aynı hue'ya haritalı. Ana ekran
  // ilk yediyi çizdiği için çakışma görünmüyordu; tavan kalkınca iki bar
  // aynı renkte oldu. Renk kimlik kodluyorsa iki kimlik aynı olamaz.
  const kirilim = renkleriAyir(
    tumu.slice(0, tavan).map((k) => ({ ...k, renk: renkNo(k.kategori) }))
  );
  const kesilen = tumu.length - kirilim.length;

  blok.append(
    ustSatir('KATEGORİ · BU AY', kesilen > 0 ? `+${kesilen} kategori daha` : null)
  );

  if (kirilim.length === 0) {
    blok.append(el('p', 'veri', 'Bu ay kayıt yok'));
    return blok;
  }

  const enBuyuk = kirilim[0].tutar;
  const liste = el('ul', 'kategori-barlar');

  for (const k of kirilim) {
    const satir = el('li', 'kategori-bar');
    const ad = el('span', 'kb-ad', oku(k.kategori));

    const yol = el('span', 'kb-yol');
    const dolgu = el('i');
    dolgu.style.width = `${Math.max((k.tutar / enBuyuk) * 100, 2)}%`;
    dolgu.dataset.renk = String(k.renk);
    yol.append(dolgu);

    satir.append(ad, yol, el('span', 'kb-tutar', lira(k.tutar)));
    liste.append(satir);
  }

  blok.append(liste);
  return blok;
}


/**
 * SAAT DAĞILIMI — günün hangi diliminde harcanıyor.
 *
 * Harcama kaydında `saat` alanı vardı ve hiçbir ekranda kullanılmıyordu.
 * Dilimler takvimsel dörde bölme değil, günün gerçek parçaları: sabah,
 * öğle, akşam, gece.
 */
export function saatBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-saat');
  blok.dataset.alan = 'saat';

  const { dilimler, saatsiz } = H.saatDagilimi(veri.harcamalar, veri.kur);
  const toplam = dilimler.reduce((t, d) => t + d.tutar, 0);

  blok.append(
    ustSatir('SAATE GÖRE · BU AY', saatsiz > 0 ? `${saatsiz} kayıt saatsiz` : null)
  );

  if (toplam === 0) {
    blok.append(el('p', 'veri', 'Saatli kayıt yok'));
    return blok;
  }

  const enBuyuk = Math.max(...dilimler.map((d) => d.tutar), 1);
  const alan = el('div', 'saat-alan');

  for (const d of dilimler) {
    const kutu = el('div', 'saat-oge');
    const sutun = el('i');
    // Sıfır dilim de görünür bir taban bırakır: "o saatte harcamadım"
    // ile "o dilim yok" ayrı şeyler.
    sutun.style.height = `${Math.max((d.tutar / enBuyuk) * 100, 7)}%`;
    kutu.append(
      el('span', 'saat-tutar', lira(d.tutar)),
      sutun,
      el('span', 'saat-ad', d.ad)
    );
    alan.append(kutu);
  }

  blok.append(alan);
  return blok;
}
