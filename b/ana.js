// Argos B — ekran kodu.
//
// Şartname: b/karar-raporu.md. Hesap burada yapılmaz; hesap ../js/hesap.js'te,
// veri okuma/yazma ../js/veri.js'te. Burada yalnız GÖSTERİM kararı verilir.
//
// İki kip vardır ve kip yalnız sırayı değil DETAY SEVİYESİNİ de değiştirir
// (rapor 3.4): Argos'un katmanlama ekseni mekân değil zamandır.
//   gündüz (00:00-21:59) : harcama > alışkanlık > abonelik, kayıtlar tek tek
//   akşam  (22:00-23:59) : alışkanlık > harcama > abonelik, kayıtlar özetlenir

import * as H from '../js/hesap.js';
import { yerelKaynak, veriYukle, onayIsaretle } from '../js/veri.js';

const AKSAM_ESIGI = 22; // rapor 3.4
const KIYAS_GUN = 7; // "son 7 günün ortalaması"
const KIYAS_ESIGI = 3; // rapor 3.3: altında kıyas cümlesi kurulmaz
const KAYIT_SATIR = 6; // rapor 3.3: liste 6 satırda kalır
const ETIKET_KATEGORI = 2; // rapor 1.10: en fazla 2 ad + "diğer"
const ABONE_SATIR = 4; // şeritte 4 kademe var, fazlası "diğer"e iner
const UYKU_SINIRI = 2; // erken uyku hedefi: 02:00

/**
 * KİP ZORLAMASI — kalıcı ve kasıtlı bir görsel kontrol kancasıdır.
 *
 * `?kip=gunduz` veya `?kip=aksam` verilirse o kip kullanılır; verilmezse
 * gerçek saate bakılır. Argos'un iki yüzü var ve akşam yüzü günün yalnız
 * iki saatinde görünüyor. Kanca olmadan gündüz düzeni 22:00'den sonra,
 * akşam düzeni 22:00'den önce hiç doğrulanamaz — nitekim ilk denetimde
 * "gündüz" diye sunulan kareler üst şeritte 23:15 yazıyordu.
 *
 * Zorlama saati de kaydırır: kip ile saat göstergesi ayrışırsa ekran
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

// Mutlak yol: B klasöründen de aynı veri kökü okunur.
const kaynak = yerelKaynak('/veri');

const ekran = document.getElementById('ekran');
const tarihAlani = document.getElementById('tarih');
const saatAlani = document.getElementById('saat');

// --- Küçük yardımcılar ---------------------------------------------------

function el(etiket, sinif, metin) {
  const d = document.createElement(etiket);
  if (sinif) d.className = sinif;
  if (metin != null) d.textContent = metin;
  return d;
}

// CSS `text-transform: uppercase` Türkçe "i"yi "I" yapar (rapor 3.6a).
// Büyük harfli her etiket doğrudan büyük harfle yazılır.
const AYLAR = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK',
];
const GUNLER = [
  'PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ',
];

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

const SEMBOL = { USD: '$', EUR: '€', GBP: '£', TRY: '₺' };

const oku = (k) => KATEGORI_ADI[k] || k;
const lira = (ham) => H.bicimle(H.yuvarla(ham));
const ikiHane = (n) => String(n).padStart(2, '0');

/**
 * Yüzdeleri tam 100'e tamamlar (rapor 3.2, kriter 15).
 * Tutarlarda `ceil` doğrudur — az göstermektense fazla göster. Ama payda
 * `ceil` dört satırda toplamı 100'ün üstüne çıkarır ve bu görünür bir
 * hatadır. Bu yüzden pay normal yuvarlanır, artık EN BÜYÜK paya yüklenir.
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
function buyukSayi(sayi, birim, boy, bos) {
  const p = el('p', 'sayi');
  p.dataset.boy = boy;
  if (bos) p.dataset.bos = 'evet';
  p.append(el('b', null, sayi), el('span', null, birim));
  return p;
}

/**
 * Görsel biçim 1: yığın şeridi.
 * Parça-bütün taşıyan İKİ veri de (kategori payı, abonelik payı) bununla
 * çizilir; ikincisi için ayrı bir grafik icat edilmez (rapor 1.9).
 * Kademe rengi büyüklük SIRASINI kodlar, kategori kimliğini değil (rapor 2.1).
 */
function seritCiz(dilimler, ince) {
  const serit = el('div', ince ? 'serit serit-ince' : 'serit');
  serit.setAttribute('role', 'img');

  if (dilimler.length === 0) {
    // Boş şerit nötrdür: uyarı değil, henüz veri gelmemiş bir gün (rapor 3.3).
    serit.setAttribute('aria-label', 'Dağılım için henüz kayıt yok');
    return serit;
  }

  serit.setAttribute(
    'aria-label',
    dilimler.map((d) => `${d.ad} yüzde ${d.pay}`).join(', ')
  );
  dilimler.forEach((d, i) => {
    const parca = el('i');
    parca.dataset.kademe = String(Math.min(i + 1, 4));
    parca.style.flexGrow = String(Math.max(d.tutar, 0.0001));
    serit.append(parca);
  });
  return serit;
}

// --- Harcama bloğu -------------------------------------------------------

/**
 * En büyük iki kategori + "diğer". Rapor 1.10: kuyruk toplanır.
 * Şeritteki dilim sayısı ile etiket satırındaki ad sayısı hep eşittir —
 * yalnız renkle temsil edilen dilim kalmaz (kriter 19).
 */
function kategoriDagilimi(harcamalar, kur) {
  const tumu = H.kategoriKirilimi(harcamalar, kur);
  if (tumu.length === 0) return [];

  const bas = tumu.slice(0, ETIKET_KATEGORI).map((k) => ({
    ad: oku(k.kategori),
    tutar: k.tutar,
  }));
  const kuyruk = tumu.slice(ETIKET_KATEGORI);
  if (kuyruk.length > 0) {
    // Veride zaten 'diger' adında bir kategori olabilir; kuyruğa da aynı adı
    // vermek şerit etiketiyle kayıt listesini çelişkiye düşürür (şeritte
    // 'diğer %34', listede 35 ₺'lik ayrı bir 'diğer' satırı).
    const cakisma = kuyruk.some((k) => k.kategori === 'diger');
    bas.push({
      ad: cakisma ? `kalan ${kuyruk.length} kategori` : 'diğer',
      tutar: kuyruk.reduce((t, k) => t + k.tutar, 0),
    });
  }

  // "diğer" toplamı ikinci kategoriyi geçebilir. Kademe rengi büyüklük
  // SIRASINI kodladığı için (rapor 2.1) dilimler her zaman gerçek büyüklük
  // sırasında dizilmeli; yoksa koyu dilim açık dilimden dar kalır ve şerit
  // kendi renk sözünü çiğner.
  bas.sort((a, b) => b.tutar - a.tutar);

  const paylar = yuzdeDagit(bas.map((d) => d.tutar));
  return bas.map((d, i) => ({ ...d, pay: paylar[i] }));
}

/**
 * Büyük sayının altındaki zorunlu bağlam satırı (rapor 2.8, kriter 11).
 * Kıyas penceresi BUGÜNÜ İÇERMEZ: bugünü, içinde bugünün de olduğu bir
 * ortalamayla kıyaslamak sayıyı kendine baktırır.
 * Eşik dolmadıysa satır kaldırılmaz — kaldırılsaydı yerleşim gün geçtikçe
 * zıplardı (rapor 3.3).
 */
function kiyasCumlesi(veri, bugun, gunToplam) {
  const dun = H.gunKaydir(bugun, -1);
  const pencere = H.sonGunler(veri.harcamalar, veri.kur, dun, KIYAS_GUN);
  const dolu = pencere.filter((g) => g.tutar > 0).length;
  if (dolu < KIYAS_ESIGI) return 'Kıyas için henüz yeterli gün yok.';

  const ortalama = pencere.reduce((t, g) => t + g.tutar, 0) / pencere.length;
  const fark = H.yuvarla(gunToplam) - H.yuvarla(ortalama);
  if (fark === 0) return `Son ${KIYAS_GUN} günün ortalamasıyla aynı.`;
  const yon = fark > 0 ? 'fazla' : 'az';
  return `Son ${KIYAS_GUN} günün ortalamasından ${H.bicimle(Math.abs(fark))} ₺ ${yon}.`;
}

/**
 * Kayıt satırı: saat, kategori, yer, tutar.
 * Yer sütunu boş bırakılabilir — "—" ve "?" yasak (rapor 1.4), boş sütun
 * zaten "yok" demektir. SAAT sütununda ise boşluk bırakılmaz: saatsiz
 * kayıt, hizalı satırların altında sol kenarı tırtıklı bir yetim satır
 * üretiyordu. Sembol yerine kelime yazılır (rapor 1.4).
 */
function kayitSatiri(h, kur) {
  const li = el('li', 'kayit');
  li.append(
    el('span', 'saat', h.saat || 'saatsiz'),
    el('span', 'kategori', oku(h.kategori)),
    el('span', 'yer', h.yer || (h.alt ? oku(h.alt) : '')),
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

  blok.append(el('p', 'etiket', aksam ? 'BUGÜN HARCANAN' : 'BUGÜN'));
  blok.append(buyukSayi(lira(toplam), '₺', aksam ? 'orta' : 'dev', bos));

  // Gündüz: sayı -> yorum -> şerit. Akşam: sayı -> şerit -> özet -> yorum.
  // Akşamın sorusu "gün nasıl geçti", cevabın sırası da o yüzden farklı.
  const yorum = el('p', 'yorum', kiyasCumlesi(veri, bugun, toplam));
  if (!aksam) blok.append(yorum);

  // Boş gün: şerit YERİNİ korur ama çizilmez. Boş bir yüzdelik çubuk sıfır
  // bilgi taşıyor ve "yükleniyor iskeleti" silueti veriyordu; ilk haftanın
  // her günü böyle görünecek. Yeri korunur ki dolu ve boş ekranda bloklar
  // aynı dikey konumda başlasın (kriter 3).
  const serit = seritCiz(dagilim);
  if (bos) serit.dataset.bos = 'evet';
  blok.append(serit);
  // Boş şeridin altına "pay" satırı yazılmaz: yazılacak pay yok. Boş
  // gün tek bir yerde, kayıt alanının içinde söylenir — iki ayrı satırda
  // iki kez "kayıt yok" demek boş ekranı hata gibi gösterir.
  if (!bos) {
    blok.append(
      el('p', 'veri paylar', dagilim.map((d) => `${d.ad} %${d.pay}`).join(' · '))
    );
  }

  if (aksam) {
    // Akşam tek tek kayıtlar gereksizleşir; toplam ve dağılım yeter.
    const saatliler = bugunku.filter((h) => H.dakikaya(h.saat) != null);
    const son = saatliler.sort((a, b) => H.dakikaya(b.saat) - H.dakikaya(a.saat))[0];
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
    // Boş listenin üst AYRACI çizilmez. Sınırı çizilip içi boş bırakılan
    // alan "burada içerik vardı ve yüklenemedi" der; kasıtlı boşluk
    // sessizdir (rapor 3.3-2). Mesaj ayracın üstünde değil, boş alanın
    // dikey ortasında durur.
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

  // Satır sayısı sabit bir tavana değil, ÖLÇÜLEN yüksekliğe göre kısılır.
  // KAYIT_SATIR yalnız üst sınır; asıl karar çizimden sonra sigdir() verir.
  for (const h of sirali.slice(0, KAYIT_SATIR)) liste.append(kayitSatiri(h, veri.kur));
  blok.append(liste);
  sigdir(liste, sirali.length, (kalan) => `+${kalan} kayıt daha`);

  return blok;
}

/**
 * Listeyi kutusuna SIĞDIRIR; kırpmaz.
 *
 * `fr` birimli satırlar + `overflow: hidden` her yükseklikte "sığdım" der,
 * hiçbir zaman "sığmadım" demez. 844px'lik tarayıcı penceresinde tasarım
 * kusursuz görünürken hedef PWA yüksekliğinde (763px) bir kayıt satırı
 * harflerin ortasından kesiliyordu — üstelik sessizce: liste toplamı
 * tutmuyor, eksik olduğu hiçbir yerde yazmıyordu.
 *
 * Çizimden sonra ölçer, taşdıkça sondan satır atar ve yerine "+N daha"
 * özeti koyar.
 *
 * Ölçüm ZAMANLAMASI kritik: tek bir rAF'ta kutu henüz son yüksekliğine
 * oturmamış oluyor ve fonksiyon gereğinden fazla satır atıyordu (844px'de
 * altı satır sığarken dördü kalmıştı). Bu yüzden ölçüm iki kare bekletilir
 * ve kutu daha ölçülemeyecek kadar alçakken hiç dokunulmaz.
 */
function sigdir(liste, toplam, ozetMetni, sonra) {
  const uygula = () => {
    if (!liste.isConnected) return;
    // Kutu henüz yerleşmediyse ölçüm yanıltır; bir sonraki kareye bırak.
    if (liste.clientHeight < 24) return;

    const satirlar = () => [...liste.children].filter((c) => !c.dataset.ozet);
    let ozet = liste.querySelector('[data-ozet]');

    // 1px'lik taşma için satır atmaya değmez; alt kenarda görünür bir
    // kırık üretmiyor ve bir satır feda etmek daha çok bilgi kaybettirir.
    // Tolerans 0: 2px pay alt uzantılı harflerin (p, y, g, ş) yaşadığı
    // penceredir ve orada bırakılan kırpma veriye göre görünüp kayboluyordu.
    // Kutulara 3px alt pay verildi (stil.css), tolerans kalktı.
    const tasiyor = () => liste.scrollHeight > liste.clientHeight;

    // En az bir satır her zaman kalır: hiç satır göstermeyen bir liste,
    // kesik satırdan da kötüdür.
    let guvenlik = 40;
    while (tasiyor() && satirlar().length > 1 && guvenlik--) {
      satirlar().pop().remove();
      if (!ozet) {
        ozet = el('li', 'kayit-fazla');
        ozet.dataset.ozet = 'evet';
        liste.append(ozet);
      }
      ozet.textContent = ozetMetni(toplam - satirlar().length);
    }

    // Özet tek başına bile taşıyorsa liste tamamen özete iner. "En az bir
    // satır kalır" kilidi taşma kontrolünü geçersiz kılıyordu: 667px'de
    // 43px'lik içerik 30px'lik kutuya sıkışıp özeti ikiye kesiyordu.
    if (ozet && tasiyor() && satirlar().length === 1) {
      satirlar()[0].remove();
      ozet.textContent = ozetMetni(toplam);
    }

    // Şerit listeye bağlıysa görünen satır sayısıyla yeniden çizilmeli;
    // yoksa dört dilim çizilirken listede bir satır kalır ve kriter 19
    // tam da kısa telefonda düşer.
    if (sonra) sonra(satirlar().length, ozet);
  };

  // İki kare bekle: ilkinde ızgara satırları henüz `fr` paylarına oturmamış olur.
  requestAnimationFrame(() => requestAnimationFrame(uygula));
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
 * 2 günde bir yapılan bir işte sayıyı iki katına şişirmiş gibi gösterir.
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

/** Durumun üçüncü kanalı: kütle ve renk gitse de kelime kalır (rapor 1.2). */
function durumKodu(onay, bekleniyor) {
  if (onay && onay.durum === 'yapildi') return 'yapildi';
  if (onay && onay.durum === 'yapilmadi') return 'kacirildi';
  return bekleniyor ? 'bekliyor' : 'beklenmiyor';
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
 * Ana alışkanlığın yorum cümlesi — blok başına düşen tek cümle (kriter 26).
 * Ara gününde "atlamak seriyi bozmaz" yazması şart: gün-arası mantığının
 * ekranda görünür olması istenen tam olarak budur (rapor 3.1).
 */
function anaCumle(tanim, onay, bekleniyor, aksam) {
  const yapildi = onay && onay.durum === 'yapildi';
  const kacirildi = onay && onay.durum === 'yapilmadi';
  const gunArasi = (tanim.siklik || {}).tip === 'gun-arasi';

  // Gündüz alışkanlık İKİNCİL bloktur ve kartı alçaktır; uzun cümle kısa
  // telefonda kartın alt kenarından taşıyordu. Akşam blok birincil olunca
  // yer var, gerekçe de o an anlamlı: gün kapanırken atlanan gün sorulur.
  if (!bekleniyor && !yapildi) {
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
  const sure = saat > 0 ? `${saat} sa ${kalan} dk` : `${kalan} dk`;
  return `02:00'ye ${sure} var`;
}

function onayDugmesi(kod, kucuk) {
  const dgm = el('button', kucuk ? 'onay onay-kucuk' : 'onay');
  dgm.type = 'button';
  dgm.dataset.durum = kod;
  if (ISARET[kod]) dgm.innerHTML = ISARET[kod];
  return dgm;
}

/**
 * Alışkanlık kartı. Seçenekler kipe göre değişir; kartın iskeleti değişmez.
 *   boy          : seri sayısının puntosu (kriter 5-6, 9)
 *   cumle        : yorum cümlesi (yalnız ana kartta, blok başına bir tane)
 *   veriSatiri   : kartın kendi ham veri satırı (akşam uyku geri sayımı)
 *   kucukDugme   : ikincil alışkanlığın gündüz şeridi için 44×44
 *
 * Cümlesiz kart ALT SATIRSIZ kalır. Eskiden "6 gündür bekliyor" gibi
 * yedek satırlar konuyordu; ikisi de cümleydi ama veri sesiyle diziliydi
 * (kriter 25) ve "6 gündür seri mi sürüyor, 6 gündür mü işaretlenmiyor"
 * diye iki anlamlıydı. Yerine seri RAKAMI + durum KELİMESİ kondu.
 */
/**
 * Kart gövdesine sığmayan cümleyi kaldırır. Kesmez: yarım kalmış bir cümle,
 * olmayan cümleden kötüdür ve rapor 2.10 kesik içeriği yasaklıyor.
 */
function cumleyiSigdir(kart, cumle) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!kart.isConnected || kart.clientHeight < 24) return;
      // Ölçüm KARTIN kendisi üzerinden: gövde kendi taşmasını yönetmiyor,
      // taşan içeriği bir üstteki blok kesiyor.
      if (kart.scrollHeight - kart.clientHeight > 2) cumle.remove();
    })
  );
}

function aliskanlikKarti(tanim, veri, bugun, secenek, isaretle) {
  const kart = el('div', `kart ${secenek.ikincil ? 'kart-ikincil' : 'kart-ana'}`);
  const govde = el('div', 'kart-govde');
  let cumle = null;

  const onay = H.onayBul(veri.onaylar, tanim.id, bugun);
  const bekleniyor = H.bugunBekleniyorMu(tanim, veri.onaylar, bugun);
  const kod = durumKodu(onay, bekleniyor);
  const seri = seriSayisi(tanim, veri.onaylar, bugun);

  const ust = el('div', 'kart-ust');
  ust.append(
    el('span', 'kart-ad', secenek.ad || tanim.ad),
    el('span', 'kart-ritim', ritimMetni(tanim))
  );
  govde.append(ust);

  if (secenek.boy) {
    const satir = el('div', 'kart-seri');
    // Seri hiç başlamamışken sayı zorlanan yerdir: "0 KEZ ÜST ÜSTE" ve
    // "0 GÜNDÜR" Türkçede kurulmuyor. Sayı yerine kelime (rapor 1.4).
    satir.append(
      seri === 0
        ? buyukSayi('—', 'SERİ YOK', secenek.boy, true)
        : buyukSayi(String(seri), seriEtiketi(tanim), secenek.boy, false)
    );
    const kelime = el('span', 'durum-kelime', DURUM_KELIMESI[kod]);
    kelime.dataset.durum = kod;
    satir.append(kelime);
    govde.append(satir);
  }

  if (secenek.cumle) {
    cumle = el('p', 'yorum', anaCumle(tanim, onay, bekleniyor, secenek.aksam));
    govde.append(cumle);
    // Sığdırma listeleri koruyordu ama kart cümlelerini korumuyordu: kısa
    // telefonda (667px) bu satır kartın alt kenarından harflerin ortasından
    // kesiliyordu — düzeltilen hatanın birebir aynısı, sadece başka kutuda.
    // Sığmıyorsa cümle kesilmez, KALDIRILIR; durum zaten seri rakamı ve
    // durum kelimesiyle üç kanaldan okunuyor.
  }

  // Geri sayım, hakkında olduğu kartta durur ve VERİ sesiyle dizilir (w62),
  // cümle sesiyle değil. Önceki sürüm onu spor kartının cümlesine noktalı
  // virgülle ekliyordu: iki alakasız önerme tek cümlede, üstelik uykuyla
  // ilgili bilgi sporun kartında. Blok başına tek cümle kuralı yine geçerli.
  if (secenek.veriSatiri) {
    govde.append(el('p', 'veri kart-veri', secenek.veriSatiri));
  }

  const dgm = onayDugmesi(kod, secenek.kucukDugme);
  dgm.setAttribute('aria-pressed', String(kod === 'yapildi'));
  dgm.setAttribute(
    'aria-label',
    `${tanim.ad}: ${DURUM_KELIMESI[kod].toLocaleLowerCase('tr')}`
  );
  dgm.addEventListener('click', () => isaretle(dgm, tanim, onay));

  kart.append(govde, dgm);
  // Sığmıyorsa cümle kesilmez, KALDIRILIR; durum zaten seri rakamı ve
  // durum kelimesiyle üç kanaldan okunuyor (rapor 1.2).
  if (cumle) cumleyiSigdir(kart, cumle);
  return kart;
}

function aliskanlikBlogu(veri, bugun, aksam, simdi, isaretle) {
  const blok = el('section', 'blok blok-aliskanlik');
  if (aksam) blok.append(el('p', 'etiket', 'GÜNÜ KAPAT'));

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

  // İki kip de aynı iskeleti kurar: ad + ritim, seri rakamı + durum
  // kelimesi. Fark BOYUTTA — akşam 44px, gündüz 22px. Eşit boyutta iki
  // kart "eksik ızgara" gibi görünür (rapor 3.1, kriter 8); asimetri
  // kasıtlıdır ve iki kipte de korunur.
  blok.append(
    aliskanlikKarti(ikincil, veri, bugun, {
      ikincil: true,
      boy: aksam ? 'seri-orta' : 'seri-mini',
      kucukDugme: !aksam,
      veriSatiri: aksam ? uykuGeriSayim(simdi) : null,
      ad: 'ERKEN UYKU',
    }, isaretle)
  );

  return blok;
}

// --- Abonelik bloğu ------------------------------------------------------

/**
 * `24 $ × 49 = 1.176 ₺` — kur görünür kalmalı, sessiz çevrim yasak
 * (rapor 3.2, kriter 13). Kur SATIRIN KENDİSİNDE durur: blok dipnotundaki
 * "kur $ 49" ilk okunuşta "49 dolar" diye okunuyordu. Çarpım işareti ile
 * eşittir, sayının ne olduğunu söylemek zorunda bırakır.
 */
function aboneTutari(a, kur) {
  const birim = a.birim || 'TRY';
  const aylik = `${lira(H.aylikGider(a, kur))} ₺`;

  if (birim === 'TRY') {
    return a.periyot === 'yillik'
      ? `yılda ${lira(a.tutar)} ₺ · ${aylik}`
      : aylik;
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
 * üretilmez (kriter 12). Belirsizlik gösterilecek bir bilgidir, eksiklik
 * değil — o yüzden tarih sütunu boş bırakılmaz, hiç var edilmez (rapor 1.3).
 *
 * Kur burada TEKRARLANMAZ; döviz satırının kendisine taşındı (kriter 13).
 */
function abonelikDipnotu(aktif, veri, bugun) {
  const parcalar = [];
  const bilinmeyen = aktif.filter((a) => a.yenileme_gunu == null).length;

  if (aktif.length > 0 && bilinmeyen === aktif.length) {
    parcalar.push('Yenileme günleri henüz bilinmiyor');
  } else if (bilinmeyen > 0) {
    parcalar.push(`${bilinmeyen} aboneliğin yenileme günü bilinmiyor`);
  } else if (aktif.length > 0) {
    const y = H.yaklasanOdemeler(veri.abonelikler, bugun, 400)[0];
    if (y) parcalar.push(`sıradaki ${y.abonelik.ad}, ${kalanMetni(y.kalanGun)}`);
  }

  return parcalar.join(' · ');
}

function abonelikBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-abonelik');
  const aktif = veri.abonelikler.filter((a) => a.aktif);
  const toplam = H.aylikAbonelikToplami(veri.abonelikler, veri.kur);

  blok.append(el('p', 'etiket', 'AYLIK ABONELİK YÜKÜ'));

  // Sayı ve bağlam cümlesi AYNI SATIRDA. Ayrı satırlardayken bu bloğun
  // 187px'inin 76px'i başlık/sayı/yorum/dipnot çerçevesine gidiyor, geriye
  // tek veri satırı kalıyordu: dört abonelikten biri görünüyordu. Blok
  // ekranın dörtte birini alıp işini yapmıyorsa yer hak etmemiş olur.
  const gunluk = aktif.length === 0 ? 0 : H.yuvarla(toplam / 30);
  const tepe = el('div', 'abone-tepe');
  tepe.append(
    buyukSayi(lira(toplam), '₺', 'kucuk', aktif.length === 0),
    el(
      'p',
      'yorum',
      aktif.length === 0
        ? 'Aktif abonelik yok.'
        : `Bu, günde ${H.bicimle(gunluk)} ₺ demek.`
    )
  );
  blok.append(tepe);

  // Sıralama büyükten küçüğe: şeritteki kademe sırası da bu (rapor 2.1).
  let satirlar = aktif
    .map((a) => ({ ad: a.ad, tutar: aboneTutari(a, veri.kur), aylik: H.aylikGider(a, veri.kur) }))
    .sort((x, y) => y.aylik - x.aylik);

  if (satirlar.length > ABONE_SATIR) {
    const kuyruk = satirlar.slice(ABONE_SATIR - 1);
    const kuyrukToplam = kuyruk.reduce((t, s) => t + s.aylik, 0);
    satirlar = [
      ...satirlar.slice(0, ABONE_SATIR - 1),
      {
        ad: `diğer ${kuyruk.length} abonelik`,
        tutar: `${lira(kuyrukToplam)} ₺`,
        aylik: kuyrukToplam,
      },
    ];
  }

  // Şerit ve liste TEK kaynaktan çizilir: dilim sayısı satır sayısına eşit
  // olmalı (kriter 19). Önceki sürüm şeritte kuyruğu birleştiriyordu; şeritte
  // üç dilim, listede dört satır çıkıyor ve okuyucu eşleştiremiyordu.
  // Küçük dilimin çentik gibi durmasını min-width çözer (stil.css .serit i).
  const paylar = yuzdeDagit(satirlar.map((s) => s.aylik));
  let serit = seritCiz(
    satirlar.map((s, i) => ({ ad: s.ad, tutar: s.aylik, pay: paylar[i] })),
    true
  );
  blok.append(serit);

  const liste = el('ul', 'aboneler');
  satirlar.forEach((s, i) => {
    const li = el('li', 'abone');
    li.append(
      el('span', 'ad', s.ad),
      el('span', 'tutar', s.tutar),
      el('span', 'pay', `%${paylar[i]}`)
    );
    liste.append(li);
  });
  blok.append(liste);
  // Kısa telefonda son abonelik satırı kırpılıyordu: şerit dört dilim
  // çizerken listede üç satır kalıyor, görünen yüzdeler 100 etmiyordu.
  // Şerit listeyle birlikte kısılır: görünen satırlar kendi dilimini alır,
  // gizlenenler tek "kalan" diliminde toplanır. Böylece kısa telefonda da
  // dilim sayısı satır sayısına eşit kalır (kriter 19).
  sigdir(
    liste,
    satirlar.length,
    (kalan) => `+${kalan} abonelik daha`,
    (gorunen, ozet) => {
      if (gorunen >= satirlar.length) return;
      const gizli = satirlar.length - gorunen;
      const kalanToplam = satirlar.slice(gorunen).reduce((t, x) => t + x.aylik, 0);

      const yeniDilim = [
        ...satirlar.slice(0, gorunen).map((x) => ({ ad: x.ad, tutar: x.aylik })),
        { ad: `kalan ${gizli} abonelik`, tutar: kalanToplam },
      ];
      // Kuyruk dilimi baştaki satırı geçebilir. Harcama şeridinde bu sıralama
      // var; burada yoktu ve şerit kısıldığı anda koyu dilim açık dilimden
      // dar kalıyordu — kuralın gerekçesi kodda yazılıyken ihlali ekrandaydı.
      yeniDilim.sort((a, b) => b.tutar - a.tutar);

      const p = yuzdeDagit(yeniDilim.map((d) => d.tutar));
      const yeniSerit = seritCiz(
        yeniDilim.map((d, i) => ({ ...d, pay: p[i] })),
        true
      );
      serit.replaceWith(yeniSerit);
      serit = yeniSerit;

      // Gizlenen dilimin payı da yazılmalı: yoksa şeridin yarısından fazlası
      // etiketsiz renk olur (kriter 19) ve görünen yüzdeler 100 etmez.
      if (ozet) {
        const kalanPay = p[yeniDilim.findIndex((d) => d.ad.startsWith('kalan'))];
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
  if (cizimSurdu) return; // dakikalık yenileme, işaretleme yazarken araya girmesin
  cizimSurdu = true;

  const simdi = zorlananSaat(new Date());
  const bugun = H.gunAnahtari(simdi);
  const aksam = simdi.getHours() >= AKSAM_ESIGI;

  tarihAlani.textContent = `${simdi.getDate()} ${AYLAR[simdi.getMonth()]} ${GUNLER[simdi.getDay()]}`;
  saatAlani.textContent = `${ikiHane(simdi.getHours())}:${ikiHane(simdi.getMinutes())}`;
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

  // Kip yalnız sırayı değiştirmez, yukarıdaki bloklar zaten farklı detay
  // seviyesinde kuruldu. Abonelik her iki kipte de sonuncudur: sabit çapa.
  ekran.replaceChildren(
    ...(aksam ? [aliskanlik, harcama] : [harcama, aliskanlik]),
    abonelik
  );
  ekran.removeAttribute('aria-busy');
  cizimSurdu = false;
}

ciz();

// Gün ve kip kendiliğinden dönmeli; akşam geri sayımı da dakikada bir
// tazelenir. Daha sık çizmek görünür bir şey değiştirmez.
setInterval(ciz, 60000);
