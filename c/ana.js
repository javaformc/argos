// Argos C — ekran kodu.
//
// Hesap burada yapılmaz: hesap ../js/hesap.js'te, veri okuma/yazma
// ../js/veri.js'te. Burada yalnız GÖSTERİM kararı verilir.
//
// İki kip var ve kip yalnız SIRAYI değil DETAY SEVİYESİNİ de değiştirir.
// Argos'un etkileşimi yok, dolayısıyla derine inme kanalı da yok;
// katmanlama ekseni mekân değil ZAMAN:
//   gündüz (00:00-21:59) : harcama > alışkanlık > abonelik, kayıtlar tek tek
//   akşam  (22:00-23:59) : alışkanlık > harcama > abonelik, kayıtlar özetli
//
// Hafta grafiği İKİ kipte de durur. Kayıt listesiyle yer için yarışmaz:
// biri gün sürerken ("ne harcadım"), diğeri her zaman ("gidişatın
// neresindeyim") sorusunu cevaplıyor.

import * as H from '../js/hesap.js';
import { yerelKaynak, veriYukle, onayIsaretle } from '../js/veri.js';

const AKSAM_ESIGI = 22;
const KIYAS_GUN = 7; // "son 7 günün ortalaması"
const KIYAS_ESIGI = 3; // altında kıyas cümlesi kurulmaz
const HAFTA_GUN = 7; // sütun grafiğindeki gün sayısı
const IZ_GUN = 14; // alışkanlık izindeki gün sayısı
const EN_COK_DILIM = 5; // şerit + lejant; fazlası "+N kategori"e iner
const KAYIT_SATIR = 8; // yalnız DOM tavanı; asıl kararı sigdir() ölçerek verir
const ABONE_SATIR = 4;
const UYKU_SINIRI = 2; // erken uyku hedefi: 02:00

/**
 * KİP ZORLAMASI — kalıcı ve kasıtlı bir görsel kontrol kancası.
 * `?kip=gunduz` / `?kip=aksam` verilirse o kip kullanılır. Akşam yüzü
 * günün yalnız iki saatinde görünüyor; kanca olmadan gündüz düzeni
 * 22:00'den sonra, akşam düzeni 22:00'den önce hiç doğrulanamaz.
 *
 * Zorlama SAATİ de kaydırır: kip ile üst şeritteki saat ayrışırsa ekran
 * görüntüsü kendi kendini yalanlar ve doğrulama değersizleşir.
 */
const ZORLAMA_SAATI = { gunduz: [14, 32], aksam: [22, 40] };

function zorlananSaat(gercek) {
  const istek = new URLSearchParams(location.search).get('kip');
  const saat = ZORLAMA_SAATI[istek];
  if (!saat) return gercek;
  const d = new Date(gercek);
  d.setHours(saat[0], saat[1], 0, 0);
  return d;
}

const kaynak = yerelKaynak('/veri');

const ekran = document.getElementById('ekran');
const tarihAlani = document.getElementById('tarih');
const saatAlani = document.getElementById('saat');
const kipAlani = document.getElementById('kip');

// --- Küçük yardımcılar ---------------------------------------------------

function el(etiket, sinif, metin) {
  const d = document.createElement(etiket);
  if (sinif) d.className = sinif;
  if (metin != null) d.textContent = metin;
  return d;
}

// CSS `text-transform: uppercase` Türkçe "i"yi "I" yapar; doğrusu "İ".
// Büyük harfli her etiket doğrudan büyük harfle yazılır, dönüştürülmez.
const AYLAR = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK',
];
const GUNLER = [
  'PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ',
];
const KISA_GUN = ['pz', 'pt', 'sa', 'ça', 'pe', 'cu', 'ct'];

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

function renkNo(kategori) {
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

const SEMBOL = { USD: '$', EUR: '€', GBP: '£', TRY: '₺' };

const oku = (k) => KATEGORI_ADI[k] || k;
const lira = (ham) => H.bicimle(H.yuvarla(ham));
const ikiHane = (n) => String(n).padStart(2, '0');

/**
 * Yüzdeleri tam 100'e tamamlar.
 * Tutarlarda `ceil` doğrudur — az göstermektense fazla göster. Ama payda
 * `ceil` dört satırda toplamı 100'ün üstüne çıkarır ve bu görünür bir
 * hatadır. Pay normal yuvarlanır, artık EN BÜYÜK paya yüklenir.
 */
function yuzdeDagit(degerler) {
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
function buyukSayi(sayi, birim, boy, secenek) {
  const s = secenek || {};
  const p = el('p', 'sayi');
  p.dataset.boy = boy;
  if (s.seri) p.dataset.seri = 'evet';
  if (s.bos) p.dataset.bos = 'evet';
  p.append(el('b', null, sayi), el('span', null, birim));
  return p;
}

/** Solda etiket, sağda ham veri — blok başlıkları hep bu biçimde. */
function ustSatir(etiket, sag) {
  const satir = el('div', 'ust-satir');
  satir.append(el('p', 'etiket', etiket));
  if (sag) satir.append(el('p', 'veri', sag));
  return satir;
}

/**
 * Listeyi kutusuna SIĞDIRIR; kırpmaz.
 *
 * `overflow: hidden` her yükseklikte "sığdım" der, hiçbir zaman
 * "sığmadım" demez: 844px'lik pencerede kusursuz görünen tasarım
 * 763px'lik gerçek PWA yüksekliğinde bir satırı harflerin ortasından
 * kesebilir, üstelik sessizce. Bu yüzden çizimden SONRA ölçülür,
 * taştıkça sondan satır atılır ve yerine "+N daha" özeti konur.
 *
 * Ölçüm zamanlaması kritik: tek rAF'ta kutu henüz son yüksekliğine
 * oturmamış olur ve fonksiyon gereğinden fazla satır atar.
 */
function sigdir(liste, toplam, ozetMetni, sonra) {
  const uygula = () => {
    if (!liste.isConnected) return;
    if (liste.clientHeight < 20) return; // henüz yerleşmedi, ölçüm yanıltır

    const satirlar = () => [...liste.children].filter((c) => !c.dataset.ozet);
    let ozet = liste.querySelector('[data-ozet]');
    const tasiyor = () => liste.scrollHeight > liste.clientHeight;

    let guvenlik = 40;
    while (tasiyor() && satirlar().length > 1 && guvenlik--) {
      satirlar().pop().remove();
      if (!ozet) {
        ozet = el('li', liste.dataset.ozetSinifi || 'kayit-fazla');
        ozet.dataset.ozet = 'evet';
        liste.append(ozet);
      }
      ozet.textContent = ozetMetni(toplam - satirlar().length);
    }

    // Özet tek başına bile taşıyorsa liste tamamen özete iner: "en az bir
    // satır kalır" kilidi yoksa taşma kontrolünü geçersiz kılar.
    if (ozet && tasiyor() && satirlar().length === 1) {
      satirlar()[0].remove();
      ozet.textContent = ozetMetni(toplam);
    }

    if (sonra) sonra(satirlar().length, ozet);
  };

  requestAnimationFrame(() => requestAnimationFrame(uygula));
}

/**
 * Bir kutuyu sığdırır: taşarsa içindekileri VERİLEN SIRAYLA kaldırır, kesmez.
 * Yarım kalmış bir cümle veya alt kenardan tıraşlanmış bir iz şeridi,
 * olmayan öğeden kötüdür — biri okunmaz, diğeri bozuk görünür.
 *
 * Feda sırası bilinçli: önce yorum cümlesi, sonra iz şeridi. Cümle en
 * çok yer kaplayan ve en az kanal ekleyen öğe; iz ise seri rakamının
 * söylemediği DESENİ taşıyor, o yüzden sonuncu gider. Durum her hâlükârda
 * seri rakamı, durum kelimesi ve halka olmak üzere üç kanaldan okunur.
 *
 * 667px'lik telefonda ikincil alışkanlık kartı 58px'e düşüyor ve iz
 * şeridi kartın alt kenarından ortasından kesiliyordu.
 */
function sigdirmaSirasi(kart, adaylar) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!kart.isConnected || kart.clientHeight < 20) return;
      for (const oge of adaylar) {
        if (kart.scrollHeight - kart.clientHeight <= 2) return;
        if (oge) oge.remove();
      }
    })
  );
}

// --- Yığın şeridi (parça-bütün taşıyan HER veri bununla çizilir) ---------

function seritCiz(dilimler, ince) {
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

// --- Harcama bloğu -------------------------------------------------------

/**
 * En büyük dört kategori + kuyruk. Kuyruk "diğer" değil "+N kategori"
 * diye adlandırılır: `diger` zaten gerçek bir kategori adı ve ikisi aynı
 * adı taşırsa şerit etiketi kayıt listesiyle çelişir.
 *
 * Kuyruk toplamı ikinci kategoriyi geçebilir; dilimler her zaman gerçek
 * büyüklük sırasında dizilir, yoksa lejantın okuma sırası bozulur.
 */
function kategoriDagilimi(harcamalar, kur) {
  const tumu = H.kategoriKirilimi(harcamalar, kur);
  if (tumu.length === 0) return [];

  const yap = (k) => ({ ad: oku(k.kategori), tutar: k.tutar, renk: renkNo(k.kategori) });

  let dilimler;
  if (tumu.length <= EN_COK_DILIM) {
    dilimler = tumu.map(yap);
  } else {
    const kuyruk = tumu.slice(EN_COK_DILIM - 1);
    dilimler = [
      ...tumu.slice(0, EN_COK_DILIM - 1).map(yap),
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
function lejantCiz(dilimler) {
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

/**
 * Kıyas penceresi BUGÜNÜ İÇERMEZ: bugünü, içinde bugünün de olduğu bir
 * ortalamayla kıyaslamak sayıyı kendine baktırır.
 */
function kiyas(veri, bugun) {
  const dun = H.gunKaydir(bugun, -1);
  const pencere = H.sonGunler(veri.harcamalar, veri.kur, dun, KIYAS_GUN);
  const dolu = pencere.filter((g) => g.tutar > 0).length;
  const ortalama = pencere.reduce((t, g) => t + g.tutar, 0) / pencere.length;
  return { yeterli: dolu >= KIYAS_ESIGI, ortalama };
}

/**
 * Büyük sayının altındaki bağlam satırı — boş bırakılamaz. Eşik
 * dolmadıysa satır KALDIRILMAZ, "yeterli gün yok" der; kaldırılsaydı
 * yerleşim gün geçtikçe zıplardı.
 */
function kiyasCumlesi(k, gunToplam) {
  if (!k.yeterli) return 'Kıyas için henüz yeterli gün yok.';
  const fark = H.yuvarla(gunToplam) - H.yuvarla(k.ortalama);
  if (fark === 0) return `Son ${KIYAS_GUN} günün ortalamasıyla aynı.`;
  const yon = fark > 0 ? 'fazla' : 'az';
  return `Son ${KIYAS_GUN} günün ortalamasından ${H.bicimle(Math.abs(fark))} ₺ ${yon}.`;
}

/**
 * Hafta sütunları — A'dan alınan öğe.
 * Kesikli çizgi, kıyas cümlesindeki ortalamanın tam olarak durduğu yer:
 * cümle ile grafik aynı şeyi iki dilde söyler ve birbirini doğrular.
 * Ortalama penceresi cümleyle AYNI olmak zorunda (dünde biten 7 gün);
 * başka bir pencere kullanmak ikisini sessizce çelişkiye düşürürdü.
 */
function haftaCiz(veri, bugun, ortalama) {
  const kutu = el('div', 'hafta');
  const gunler = H.sonGunler(veri.harcamalar, veri.kur, bugun, HAFTA_GUN);
  const enBuyuk = Math.max(...gunler.map((g) => g.tutar), ortalama, 1);

  kutu.append(
    ustSatir(`SON ${HAFTA_GUN} GÜN`, ortalama > 0 ? `ort. ${lira(ortalama)} ₺` : null)
  );

  const alan = el('div', 'hafta-alan');
  alan.setAttribute('role', 'img');
  alan.setAttribute(
    'aria-label',
    `Son ${HAFTA_GUN} günün harcaması: ` +
      gunler.map((g) => `${g.gun} ${lira(g.tutar)} lira`).join(', ')
  );

  if (ortalama > 0) {
    const cizgi = el('div', 'hafta-ort');
    cizgi.style.bottom = `${Math.min((ortalama / enBuyuk) * 100, 100)}%`;
    alan.append(cizgi);
  }

  const etiketler = el('div', 'hafta-etiket');
  for (const g of gunler) {
    const bugunMu = g.gun === bugun;
    const sutun = el('i');
    // Boş gün de görünür bir taban bırakır: sıfır harcama ile kayıtsız
    // gün ayrı şeylerdir, sütunun tümden kaybolması ikincisini ima eder.
    sutun.style.height = `${Math.max((g.tutar / enBuyuk) * 100, 3)}%`;
    if (bugunMu) sutun.dataset.bugun = '';
    alan.append(sutun);

    const etiket = el('span', null, KISA_GUN[new Date(`${g.gun}T00:00:00`).getDay()]);
    if (bugunMu) etiket.dataset.bugun = '';
    etiketler.append(etiket);
  }

  kutu.append(alan, etiketler);
  sigdirmaSirasi(kutu, [etiketler]);
  return kutu;
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

function kayitSatiri(h, kur) {
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

function harcamaBlogu(veri, bugun, aksam) {
  const blok = el('section', 'blok blok-harcama');
  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);
  const toplam = H.toplamTL(bugunku, veri.kur);
  const bos = bugunku.length === 0;
  const dagilim = kategoriDagilimi(bugunku, veri.kur);
  const k = kiyas(veri, bugun);

  const saatliler = bugunku.filter((h) => H.dakikaya(h.saat) != null);
  const son = saatliler.sort((a, b) => H.dakikaya(b.saat) - H.dakikaya(a.saat))[0];

  blok.append(el('p', 'etiket', aksam ? 'BUGÜN HARCANAN' : 'BUGÜN'));
  blok.append(buyukSayi(lira(toplam), '₺', aksam ? 'orta' : 'dev', { bos }));

  // Gündüz: sayı -> cümle -> şerit. Akşam: sayı -> şerit -> özet -> cümle.
  // Akşamın sorusu "gün nasıl geçti"; cevabın sırası da o yüzden farklı.
  const yorum = el('p', 'yorum', kiyasCumlesi(k, toplam));
  if (!aksam) blok.append(yorum);

  // Boş gün: şerit YERİNİ korur ama çizilmez. Boş bir yüzdelik çubuk
  // sıfır bilgi taşıyıp "yükleniyor iskeleti" silueti veriyordu.
  const serit = seritCiz(dagilim);
  if (bos) serit.dataset.bos = 'evet';
  blok.append(serit);
  if (!bos) blok.append(lejantCiz(dagilim));

  blok.append(haftaCiz(veri, bugun, k.ortalama));

  if (aksam) {
    // Akşam tek tek kayıtlar gereksizleşir; toplam, dağılım ve hafta yeter.
    blok.append(
      el(
        'p',
        'veri',
        bos
          ? 'Bugün kayıt yok'
          : `${bugunku.length} kayıt${son ? ` · son kayıt ${son.saat}` : ''}`
      )
    );
    blok.append(yorum);
    return blok;
  }

  // Gündüz ham gerçek: kalem kalem ne harcandı.
  const liste = el('ul', 'kayitlar');

  if (bos) {
    // Boş listenin üst AYRACI çizilmez: sınırı çizilip içi boş bırakılan
    // alan "burada içerik vardı ve yüklenemedi" der.
    liste.classList.add('kayitlar-bos');
    liste.append(el('li', 'kayit-bos', 'Bugün kayıt yok'));
    blok.append(liste);
    return blok;
  }

  const sirali = bugunku.slice().sort((a, b) => {
    const da = H.dakikaya(a.saat);
    const db = H.dakikaya(b.saat);
    if (da == null && db == null) return 0;
    if (da == null) return 1; // saatsiz kayıtlar sona
    if (db == null) return -1;
    return db - da; // yeniden eskiye
  });

  const gosterilen = sirali.slice(0, KAYIT_SATIR);
  for (const h of gosterilen) liste.append(kayitSatiri(h, veri.kur));

  // Tavan yüzünden gizlenen kayıt da SAYILIR. 844px'te altı kayıttan beşi
  // çiziliyor ve altıncısının varlığı hiçbir yerde yazmıyordu: sığdırma
  // özeti yalnız KENDİ attığı satırlar için ekliyor, tavanın attığı satır
  // sessizce kayboluyordu.
  if (sirali.length > gosterilen.length) {
    const ozet = el('li', 'kayit-fazla', `+${sirali.length - gosterilen.length} kayıt daha`);
    ozet.dataset.ozet = 'evet';
    liste.append(ozet);
  }

  blok.append(liste);
  sigdir(liste, sirali.length, (kalan) => `+${kalan} kayıt daha`);

  return blok;
}

// --- Alışkanlık bloğu ----------------------------------------------------

function ritimMetni(tanim) {
  const s = tanim.siklik || {};
  if (s.tip === 'gun-arasi') return `${s.deger} günde bir`;
  if (s.tip === 'haftalik') return `haftada ${s.deger}`;
  return 'her gün';
}

/**
 * Seri birimi doğruyu söylemek zorunda: "gün-arası" alışkanlıkta hesap
 * çekirdeği ardışık GÜN değil kaçırılmamış TUR sayar. "GÜNDÜR" yazmak
 * 2 günde bir yapılan bir işte sayıyı iki katına şişmiş gösterir.
 */
function seriEtiketi(tanim) {
  const tip = (tanim.siklik || {}).tip;
  if (tip === 'gun-arasi') return 'KEZ ÜST ÜSTE';
  if (tip === 'haftalik') return 'BU HAFTA';
  return 'GÜNDÜR';
}

function seriSayisi(tanim, onaylar, bugun) {
  if ((tanim.siklik || {}).tip === 'haftalik') {
    return H.haftalikDurum(tanim, onaylar, bugun).yapilan;
  }
  return H.seriHesapla(tanim, onaylar, bugun);
}

/**
 * BEKLENMEYEN gün kaçırılmış sayılmaz.
 * B'de bir ara gününe düşmüş "yapilmadi" kaydı "KAÇIRILDI" diye
 * görünüyordu; beklenmeyen bir gün tanımı gereği kaçırılamaz. Sıra
 * önemli: önce yapıldı, sonra beklenmiyor, en son kaçırıldı.
 */
function durumKodu(onay, bekleniyor) {
  if (onay && onay.durum === 'yapildi') return 'yapildi';
  if (!bekleniyor) return 'beklenmiyor';
  if (onay && onay.durum === 'yapilmadi') return 'kacirildi';
  return 'bekliyor';
}

const DURUM_KELIMESI = {
  yapildi: 'YAPILDI',
  kacirildi: 'KAÇIRILDI',
  bekliyor: 'BEKLİYOR',
  beklenmiyor: 'ARA GÜNÜ',
};

const ISARET = {
  yapildi:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  kacirildi:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
};

/**
 * Blok başına düşen tek yorum cümlesi (ana kartta).
 * Ara gününde "atlamak seriyi bozmaz" yazması şart: gün-arası mantığının
 * ekranda görünür olması gereken tam olarak burası.
 */
function anaCumle(tanim, onay, bekleniyor, aksam) {
  const yapildi = onay && onay.durum === 'yapildi';
  const kacirildi = onay && onay.durum === 'yapilmadi';
  const gunArasi = (tanim.siklik || {}).tip === 'gun-arasi';

  if (!bekleniyor && !yapildi) {
    // Gündüz kart alçak; uzun cümle kısa telefonda alt kenardan taşıyor.
    return aksam ? 'Bugün ara günü, atlamak seriyi bozmaz.' : 'Bugün ara günü.';
  }

  const bas = gunArasi
    ? `Bugün ${tanim.ad.toLocaleLowerCase('tr')} günü`
    : 'Bugün de bekleniyor';
  if (yapildi) return `${bas}, yapıldı.`;
  if (kacirildi) return `${bas}, kaçırıldı.`;
  return aksam ? `${bas}, henüz işaretlenmedi.` : `${bas}.`;
}

/** 02:00'ye kalan süre — akşam kipine özel, hesaplanabilir tek bilgi. */
function uykuGeriSayim(simdi) {
  const hedef = new Date(simdi);
  hedef.setHours(UYKU_SINIRI, 0, 0, 0);
  if (hedef <= simdi) hedef.setDate(hedef.getDate() + 1);

  const dakika = Math.max(Math.round((hedef - simdi) / 60000), 0);
  const saat = Math.floor(dakika / 60);
  const kalan = dakika % 60;
  return `02:00'ye ${saat > 0 ? `${saat} sa ${kalan} dk` : `${kalan} dk`} var`;
}

/**
 * 14 günlük iz.
 * Çekirdeğin `aliskanlikIzi`'si, kaydı olan bir günde doğrudan kayıttaki
 * durumu kullanır; beklenmeyen bir güne düşmüş "yapilmadi" işareti bu
 * yüzden geçmişte kırmızı görünüyordu. Aynı düzeltme burada da yapılır:
 * beklenmeyen gün kaçırılamaz. Çekirdek değiştirilmedi, çıktısı düzeltildi.
 */
function izCiz(tanim, veri, bugun) {
  const gunler = H.aliskanlikIzi(tanim, veri.onaylar, bugun, IZ_GUN).map((g) =>
    g.durum === 'yapilmadi' && !H.bugunBekleniyorMu(tanim, veri.onaylar, g.gun)
      ? { gun: g.gun, durum: 'beklenmiyor' }
      : g
  );

  const iz = el('div', 'iz');
  const yapilan = gunler.filter((g) => g.durum === 'yapildi').length;
  // Durumu ad satırı ve durum kelimesi zaten söylüyor; iz görsel bir ek.
  iz.setAttribute('aria-hidden', 'true');
  iz.title = `Son ${IZ_GUN} günde ${yapilan} işaret`;
  for (const g of gunler) {
    const kare = el('i');
    kare.dataset.d = g.durum;
    iz.append(kare);
  }
  return iz;
}

/**
 * Alışkanlık kartı. Seçenekler kipe göre değişir, iskelet değişmez:
 *   ad + ritim / seri rakamı + durum kelimesi / iz / (cümle | veri satırı)
 */
function aliskanlikKarti(tanim, veri, bugun, secenek, isaretle) {
  const kart = el('div', `kart ${secenek.ikincil ? 'kart-ikincil' : 'kart-ana'}`);
  const govde = el('div', 'kart-govde');

  const onay = H.onayBul(veri.onaylar, tanim.id, bugun);
  const bekleniyor = H.bugunBekleniyorMu(tanim, veri.onaylar, bugun);
  const kod = durumKodu(onay, bekleniyor);
  const seri = seriSayisi(tanim, veri.onaylar, bugun);

  const ust = el('div', 'ust-satir');
  ust.append(
    el('span', 'kart-ad', secenek.ad || tanim.ad),
    el('span', 'kart-ritim', ritimMetni(tanim))
  );
  govde.append(ust);

  const satir = el('div', 'kart-seri');
  satir.append(
    // Seri hiç başlamamışken sayı zorlanan yerdir: "0 KEZ ÜST ÜSTE" ve
    // "0 GÜNDÜR" Türkçede kurulmuyor. Sayı yerine kelime.
    seri === 0
      ? buyukSayi('—', 'SERİ YOK', secenek.boy, { seri: true, bos: true })
      : buyukSayi(String(seri), seriEtiketi(tanim), secenek.boy, { seri: true })
  );
  const kelime = el('span', 'durum-kelime', DURUM_KELIMESI[kod]);
  kelime.dataset.durum = kod;
  satir.append(kelime);
  govde.append(satir);

  const iz = izCiz(tanim, veri, bugun);
  govde.append(iz);

  let cumle = null;
  if (secenek.cumle) {
    cumle = el('p', 'yorum', anaCumle(tanim, onay, bekleniyor, secenek.aksam));
    govde.append(cumle);
  }

  // Geri sayım, hakkında olduğu kartta durur ve VERİ sesiyle dizilir —
  // cümle sesiyle değil. Blok başına tek cümle kuralı korunur.
  let veriOgesi = null;
  if (secenek.veriSatiri) {
    veriOgesi = el('p', 'veri', secenek.veriSatiri);
    govde.append(veriOgesi);
  }

  const dgm = el('button', secenek.kucukDugme ? 'onay onay-kucuk' : 'onay');
  dgm.type = 'button';
  dgm.dataset.durum = kod;
  if (ISARET[kod]) dgm.innerHTML = ISARET[kod];
  dgm.setAttribute('aria-pressed', String(kod === 'yapildi'));
  dgm.setAttribute(
    'aria-label',
    `${tanim.ad}: ${DURUM_KELIMESI[kod].toLocaleLowerCase('tr')}`
  );
  dgm.addEventListener('click', () => isaretle(dgm, tanim, onay));

  kart.append(govde, dgm);
  // Feda sırası: önce yorum cümlesi, sonra iz, en son ham veri satırı
  // (akşam geri sayımı). Geri sayım sona konur çünkü günün yalnız o
  // saatinde anlamlı olan tek bilgi odur; ama halkanın kesilmesine de izin
  // verilemez, o yüzden feda edilebilirler listesinde yeri var.
  sigdirmaSirasi(kart, [cumle, iz, veriOgesi]);
  return kart;
}

function aliskanlikBlogu(veri, bugun, aksam, simdi, isaretle) {
  const blok = el('section', 'blok blok-aliskanlik');

  if (veri.tanimlar.length === 0) {
    // İskelet çökmez: blok yerini korur, yalnız içi boştur.
    const kart = el('div', 'kart kart-ana');
    const govde = el('div', 'kart-govde');
    govde.append(el('p', 'veri', 'Tanımlı alışkanlık yok'));
    kart.append(govde);
    blok.append(kart);
    return blok;
  }

  const ana = veri.tanimlar.find((t) => t.ana) || veri.tanimlar[0];
  const ikincil = veri.tanimlar.find((t) => t !== ana) || null;

  blok.append(
    aliskanlikKarti(ana, veri, bugun, {
      boy: aksam ? 'seri-dev' : 'seri-kucuk',
      cumle: true,
      aksam,
      ad: ana.ad.toLocaleUpperCase('tr'),
    }, isaretle)
  );

  if (!ikincil) return blok;

  // İki kip de aynı iskeleti kurar; fark BOYUTTA. Eşit boyutta iki kart
  // ızgara değil "eksik ızgara" gibi görünür, asimetri kasıtlı.
  blok.append(
    aliskanlikKarti(ikincil, veri, bugun, {
      ikincil: true,
      boy: aksam ? 'seri-orta' : 'seri-mini',
      kucukDugme: !aksam,
      veriSatiri: aksam ? uykuGeriSayim(simdi) : null,
      // Tanımdaki ad bir cümle ("Gece 02:00'den önce uyu"); kart adı
      // etiket sesiyle dizilir ve etiket cümle olamaz.
      ad: 'ERKEN UYKU',
    }, isaretle)
  );

  return blok;
}

// --- Abonelik bloğu ------------------------------------------------------

/**
 * `24 $ × 49 = 1.176 ₺` — kur görünür kalmalı, sessiz çevrim yasak.
 * Kur SATIRIN KENDİSİNDE durur: blok dipnotundaki "kur $ 49" ilk okunuşta
 * "49 dolar" diye okunuyordu.
 */
function aboneTutari(a, kur) {
  const birim = a.birim || 'TRY';
  const aylik = `${lira(H.aylikGider(a, kur))} ₺`;

  if (birim === 'TRY') {
    return a.periyot === 'yillik' ? `yılda ${lira(a.tutar)} ₺ · ${aylik}` : aylik;
  }

  const oran = H.bicimle(H.yuvarla(kur[birim]));
  const carpim = `${H.bicimle(a.tutar)} ${SEMBOL[birim] || birim} × ${oran}`;
  // Aylık abonelikte TL karşılığı zaten aylık gider; iki kez yazılmaz.
  return a.periyot === 'yillik'
    ? `${carpim} = yılda ${lira(H.tryeCevir(a.tutar, birim, kur))} ₺ · ${aylik}`
    : `${carpim} = ${aylik}`;
}

const kalanMetni = (gun) =>
  gun === 0 ? 'bugün' : gun === 1 ? 'yarın' : `${gun} gün sonra`;

/**
 * Yenileme günü bilinmeyen abonelik için tahmin, "~", "?" veya gün sayısı
 * üretilmez. Belirsizlik gösterilecek bir bilgidir, eksiklik değil — o
 * yüzden tarih sütunu boş bırakılmaz, hiç var edilmez.
 */
function abonelikDipnotu(aktif, veri, bugun) {
  const bilinmeyen = aktif.filter((a) => a.yenileme_gunu == null).length;
  if (aktif.length === 0) return '';
  if (bilinmeyen === aktif.length) return 'Yenileme günleri henüz bilinmiyor';
  if (bilinmeyen > 0) return `${bilinmeyen} aboneliğin yenileme günü bilinmiyor`;
  const y = H.yaklasanOdemeler(veri.abonelikler, bugun, 400)[0];
  return y ? `sıradaki ${y.abonelik.ad}, ${kalanMetni(y.kalanGun)}` : '';
}

function abonelikBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-abonelik');
  const aktif = veri.abonelikler.filter((a) => a.aktif);
  const toplam = H.aylikAbonelikToplami(veri.abonelikler, veri.kur);

  blok.append(el('p', 'etiket', 'AYLIK ABONELİK YÜKÜ'));

  // Sayı ve bağlam cümlesi AYNI SATIRDA: ayrı satırlardayken bloğun
  // yüksekliğinin büyük kısmı çerçeveye gidiyor ve dört abonelikten
  // yalnız biri görünüyordu.
  const gunluk = aktif.length === 0 ? 0 : H.yuvarla(toplam / 30);
  const tepe = el('div', 'abone-tepe');
  tepe.append(
    buyukSayi(lira(toplam), '₺', 'kucuk', { bos: aktif.length === 0 }),
    el(
      'p',
      'yorum',
      aktif.length === 0
        ? 'Aktif abonelik yok.'
        : `Bu, günde ${H.bicimle(gunluk)} ₺ demek.`
    )
  );
  blok.append(tepe);

  // Abonelik payı da parça-bütün: kategori dağılımıyla AYNI BİÇİM çizilir,
  // ikincisi için grafik icat edilmez. Ama RENK ROLÜ farklı ve bu kasıtlı:
  //   kategoriler her gün tekrar eder -> renk KİMLİK kodlar, hafıza kurar
  //   abonelikler dört tane ve hemen altında sıralı -> renk SIRA kodlar
  // Kategorik hue'ları buraya da taşımak iki sorunu birden getiriyordu:
  // abonelik şeridinin yeşili alışkanlık "yapıldı" yeşiliyle çakışıyor ve
  // her gün aynı kalan dört satıra hatırlanacak bir kimlik yükleniyordu.
  // Parlaklık kademesi ikisini de çözer, üstelik iki şerit birbirine
  // karışmaz: renkli olan bugünün dağılımı, kademeli olan sabit yük.
  let satirlar = aktif
    .map((a) => ({
      ad: a.ad,
      tutar: aboneTutari(a, veri.kur),
      aylik: H.aylikGider(a, veri.kur),
    }))
    .sort((x, y) => y.aylik - x.aylik);

  if (satirlar.length > ABONE_SATIR) {
    const kuyruk = satirlar.slice(ABONE_SATIR - 1);
    const kuyrukToplam = kuyruk.reduce((t, s) => t + s.aylik, 0);
    satirlar = [
      ...satirlar.slice(0, ABONE_SATIR - 1),
      {
        ad: `+${kuyruk.length} abonelik`,
        tutar: `${lira(kuyrukToplam)} ₺`,
        aylik: kuyrukToplam,
      },
    ];
    satirlar.sort((x, y) => y.aylik - x.aylik);
  }

  // Şerit ve liste TEK kaynaktan çizilir: dilim sayısı satır sayısına
  // eşit olmalı, yoksa şeritte etiketsiz renk kalır.
  const kademeNo = (i) => Math.min(i + 1, 4);
  const paylar = yuzdeDagit(satirlar.map((s) => s.aylik));
  let serit = seritCiz(
    satirlar.map((s, i) => ({ ad: s.ad, tutar: s.aylik, pay: paylar[i], kademe: kademeNo(i) })),
    true
  );
  blok.append(serit);

  const liste = el('ul', 'aboneler');
  liste.dataset.ozetSinifi = 'dipnot';
  satirlar.forEach((s, i) => {
    // Nokta, satırı şeritteki dilimine bağlar. Olmadığında şerit renkli
    // ama okunmayan bir çubuk kalıyordu.
    const nokta = el('span', 'nokta');
    nokta.dataset.kademe = String(kademeNo(i));
    const li = el('li', 'abone');
    li.append(
      nokta,
      el('span', 'ad', s.ad),
      el('span', 'tutar', s.tutar),
      el('span', 'pay', `%${paylar[i]}`)
    );
    liste.append(li);
  });
  blok.append(liste);

  // Kısa telefonda satır düşerse ŞERİT DE kısılır: gizlenenler tek
  // "kalan" diliminde toplanır, böylece dilim sayısı satır sayısına eşit
  // kalır ve görünen yüzdeler yine 100 eder.
  sigdir(
    liste,
    satirlar.length,
    (kalan) => `+${kalan} abonelik daha`,
    (gorunen, ozet) => {
      if (gorunen >= satirlar.length) return;
      const gizli = satirlar.length - gorunen;
      const kalanToplam = satirlar.slice(gorunen).reduce((t, x) => t + x.aylik, 0);

      const yeni = [
        ...satirlar.slice(0, gorunen).map((x) => ({ ad: x.ad, tutar: x.aylik })),
        { ad: `kalan ${gizli} abonelik`, tutar: kalanToplam },
      ];
      yeni.sort((a, b) => b.tutar - a.tutar);

      const p = yuzdeDagit(yeni.map((d) => d.tutar));
      const yeniSerit = seritCiz(
        yeni.map((d, i) => ({ ...d, pay: p[i], kademe: kademeNo(i) })),
        true
      );
      serit.replaceWith(yeniSerit);
      serit = yeniSerit;

      // Gizlenen dilimin payı da yazılmalı, yoksa şeridin bir bölümü
      // etiketsiz renk olur ve görünen yüzdeler 100 etmez.
      if (ozet) {
        const kalanPay = p[yeni.findIndex((d) => d.ad.startsWith('kalan'))];
        ozet.textContent = `+${gizli} abonelik daha · %${kalanPay}`;
      }
    }
  );

  const dipnot = abonelikDipnotu(aktif, veri, bugun);
  if (dipnot) blok.append(el('p', 'dipnot', dipnot));

  return blok;
}

// --- Çizim ---------------------------------------------------------------

function hataGoster(hata, baslik) {
  const kutu = el('div', 'blok hata');
  kutu.append(el('p', 'yorum', baslik));
  kutu.append(el('code', null, String(hata.message || hata)));
  ekran.replaceChildren(kutu);
  ekran.removeAttribute('aria-busy');
  console.error(hata);
}

let cizimSurdu = false;

async function ciz() {
  if (cizimSurdu) return; // dakikalık yenileme işaretleme yazarken girmesin
  cizimSurdu = true;

  const simdi = zorlananSaat(new Date());
  const bugun = H.gunAnahtari(simdi);
  const aksam = simdi.getHours() >= AKSAM_ESIGI;

  tarihAlani.textContent =
    `${simdi.getDate()} ${AYLAR[simdi.getMonth()]} ${GUNLER[simdi.getDay()]}`;
  saatAlani.textContent = `${ikiHane(simdi.getHours())}:${ikiHane(simdi.getMinutes())}`;
  kipAlani.textContent = aksam ? 'GÜNÜ KAPAT' : '';
  document.body.dataset.kip = aksam ? 'aksam' : 'gunduz';

  let veri;
  try {
    veri = await veriYukle(kaynak, bugun);
  } catch (hata) {
    cizimSurdu = false;
    hataGoster(hata, 'Veri okunamadı. Geliştirme sunucusu çalışıyor mu?');
    return;
  }

  /** Tek tuş işaretleme. Yazma başarısızsa düğme eski haline döner. */
  async function isaretle(dugme, tanim, onay) {
    const yeniDurum = onay && onay.durum === 'yapildi' ? 'yapilmadi' : 'yapildi';
    dugme.disabled = true;
    try {
      await onayIsaretle(kaynak, veri, tanim.id, bugun, yeniDurum);
      cizimSurdu = false;
      await ciz();
    } catch (hata) {
      dugme.disabled = false;
      hataGoster(hata, 'İşaret kaydedilemedi.');
    }
  }

  const harcama = harcamaBlogu(veri, bugun, aksam);
  const aliskanlik = aliskanlikBlogu(veri, bugun, aksam, simdi, isaretle);
  const abonelik = abonelikBlogu(veri, bugun);

  // Kip yalnız sırayı değiştirmez; bloklar zaten farklı detay seviyesinde
  // kuruldu. Abonelik her iki kipte de sonuncu: sabit çapa.
  ekran.replaceChildren(...(aksam ? [aliskanlik, harcama] : [harcama, aliskanlik]), abonelik);
  ekran.removeAttribute('aria-busy');
  cizimSurdu = false;
}

ciz();

// YAZI TİPİ ÖLÇÜMÜ BOZAR — ölçüldü, tahmin edilmedi.
// Archivo CDN'den geliyor ve ilk çizim yedek yazı tipiyle yapılıyor.
// Sığdırma o anda ölçüyor, kutu dar metriklerle küçük görünüyor ve
// gereğinden çok satır atıyor: 667px'te altı kayıttan HİÇBİRİ kalmamıştı,
// oysa kutu sonradan iki satır alacak kadar büyüyordu. Atılan satır geri
// gelmez, o yüzden yazı hazır olunca bir kez yeniden çizilir.
if (document.fonts) document.fonts.ready.then(() => ciz());

// Gün ve kip kendiliğinden dönmeli; akşam geri sayımı da dakikada bir
// tazelenir. Daha sık çizmek görünür bir şey değiştirmez.
setInterval(ciz, 60000);
