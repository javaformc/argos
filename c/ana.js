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
import {
  veriYukle,
  ayVerisi,
  onayIsaretle,
  kaynakSec,
  tokenYaz,
  tokenSil,
  tokenDene,
} from '../js/veri.js';
import {
  aySayfasi,
  kategoriSayfasi,
  gunSayfasi,
  yerSayfasi,
} from './harcama.js';
import { aliskanlikSayfasi } from './aliskanlik.js';
import {
  kapiBasligi,
  genisEkran,
  el,
  AYLAR,
  GUNLER,
  KISA_GUN,
  SEMBOL,
  oku,
  lira,
  ikiHane,
  yuzdeDagit,
  buyukSayi,
  ustSatir,
  seritCiz,
  kategoriDagilimi,
  lejantCiz,
  kayitSatiri,
  saateGore,
  ayGrafigiBlogu,
  ayKategoriBlogu,
  saatBlogu,
} from './ortak.js';

const AKSAM_ESIGI = 22;
const KIYAS_GUN = 7; // "son 7 günün ortalaması"
const KIYAS_ESIGI = 3; // altında kıyas cümlesi kurulmaz
const HAFTA_GUN = 7; // sütun grafiğindeki gün sayısı
const IZ_GUN = 14; // telefonda alışkanlık izindeki gün sayısı
const IZ_GUN_GENIS = 30; // masaüstünde: alan varken pencereyi dar tutmanın gerekçesi yok
// Listede yalnız SON ÜÇ harcama durur, kalanı tek satırda özetlenir.
// Sayfa kaydırılabiliyor ama bu blok "bugün ne oldu" sorusunun kısa
// cevabı; altı satırlık dökümü ekranın en üstünde taşımak kalabalık
// ediyordu. Tam döküm gerektiğinde ayrı bir ekranın işi.
const KAYIT_SATIR = 3;
// Masaüstünde liste kısılmaz: telefonda üç satır "kalabalık etmesin" diye
// seçilmişti, geniş ekranda o gerekçe yok.
const KAYIT_SATIR_GENIS = 9;
// Telefonda dört satır: abonelik şeridi ana ekranın en altındaki blok ve
// orada sabit bir çapa olması gerekiyor. Masaüstünde o kısıt yok — sağ
// sütun zaten uzun ve sekiz satır kuyruk oluşturmadan sığıyor.
const ABONE_SATIR = 4;
const ABONE_SATIR_GENIS = 8;
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

// Kaynak çalışma anında seçilir ve token girilince DEĞİŞİR; bu yüzden
// sabit değil. Yerelde dosya sunucusu, yayında GitHub deposu.
let kaynak = kaynakSec();

const ekran = document.getElementById('ekran');
const tarihAlani = document.getElementById('tarih');
const saatAlani = document.getElementById('saat');
const kipAlani = document.getElementById('kip');


// --- Harcama bloğu -------------------------------------------------------


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
  return kutu;
}

function harcamaBlogu(veri, bugun, aksam) {
  const blok = el('section', 'blok blok-harcama');
  blok.dataset.alan = 'harcama';
  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);
  const toplam = H.toplamTL(bugunku, veri.kur);
  const bos = bugunku.length === 0;
  const dagilim = kategoriDagilimi(bugunku, veri.kur);
  const k = kiyas(veri, bugun);

  // Blok aynı zamanda ayrıntı sayfasının kapısı: burada kesilen her şey
  // (üç kayıt, beş dilim, yedi gün) orada tam duruyor. Tıklama hedefi
  // başlık değil kutunun tamamı — kapiBasligi'ndeki nota bak.
  blok.classList.add('blok-kapi');
  blok.append(kapiBasligi(aksam ? 'BUGÜN HARCANAN' : 'BUGÜN', 'harcama'));
  blok.append(buyukSayi(lira(toplam), '₺', aksam ? 'orta' : 'dev', { bos }));

  // Kıyas cümlesi büyük sayının HEMEN ALTINDA, iki kipte de. Sayı ile
  // bağlamı arasına grafik girerse cümle sayıya değil grafiğe ait gibi
  // okunuyor.
  blok.append(el('p', 'yorum', kiyasCumlesi(k, toplam)));

  // Boş gün: şerit YERİNİ korur ama çizilmez. Boş bir yüzdelik çubuk
  // sıfır bilgi taşıyıp "yükleniyor iskeleti" silueti veriyordu.
  const serit = seritCiz(dagilim);
  if (bos) serit.dataset.bos = 'evet';
  blok.append(serit);
  if (!bos) blok.append(lejantCiz(dagilim));

  blok.append(haftaCiz(veri, bugun, k.ortalama));

  // Son üç harcama İKİ kipte de durur. Akşam sürümü bir zamanlar bunu
  // "6 kayıt · son kayıt 19:00" özetine indiriyordu (tek ekran kısıtından
  // kalma); kaydırma serbest olunca o tasarrufun karşılığı kalmadı ve
  // "bugün ne aldım" sorusu akşam da sorulan bir soru.
  const liste = el('ul', 'kayitlar');

  if (bos) {
    // Boş listenin üst AYRACI çizilmez: sınırı çizilip içi boş bırakılan
    // alan "burada içerik vardı ve yüklenemedi" der.
    liste.classList.add('kayitlar-bos');
    liste.append(el('li', 'kayit-bos', 'Bugün kayıt yok'));
    blok.append(liste);
    return blok;
  }

  const sirali = saateGore(bugunku);

  const gosterilen = sirali.slice(0, genisEkran() ? KAYIT_SATIR_GENIS : KAYIT_SATIR);
  for (const h of gosterilen) liste.append(kayitSatiri(h, veri.kur));

  // Tavan yüzünden gizlenen kayıt da SAYILIR. 844px'te altı kayıttan beşi
  // çiziliyor ve altıncısının varlığı hiçbir yerde yazmıyordu: sığdırma
  // özeti yalnız KENDİ attığı satırlar için ekliyor, tavanın attığı satır
  // sessizce kayboluyordu.
  if (sirali.length > gosterilen.length) {
    const kalan = sirali.length - gosterilen.length;
    const kalanTL = sirali.slice(gosterilen.length).reduce(
      (t, h) => t + H.tryeCevir(h.tutar, h.birim || 'TRY', veri.kur),
      0
    );
    const ozet = el('li', 'kayit-fazla', `diğer ${kalan} kayıt · ${lira(kalanTL)} ₺`);
    ozet.dataset.ozet = 'evet';
    liste.append(ozet);
  }

  blok.append(liste);

  return blok;
}

/**
 * AY ÖZETİ — masaüstünde kendi bloğu.
 *
 * Önce harcama bloğunun içindeydi; sol sütun zaten en uzunuydu ve orada
 * durunca dengesizliği artırıyordu. Sağ sütun ise kısa kalıyordu. Blok
 * olarak ayrılınca hem yer dengelendi hem de ayın üç sayısı (toplam,
 * ortalama, kayıt) kendi başlığı altında okunur oldu.
 */
function ayOzetBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-ayozet');
  blok.dataset.alan = 'ayozet';

  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);
  const ayToplam = H.ayToplami(veri.harcamalar, veri.kur);
  const ortalama = H.gunlukOrtalama(veri.harcamalar, veri.kur, bugun);

  const ay = el('div', 'ay-ozet');
  ay.append(
    ayOzetOgesi('BU AY', lira(ayToplam)),
    ayOzetOgesi('GÜNDE ORTALAMA', lira(ortalama)),
    ayOzetOgesi('KAYIT', String(bugunku.length), 'bugün')
  );
  blok.append(ay);
  return blok;
}

/** Ay özetindeki tek öğe: etiket üstte, sayı altta. */
function ayOzetOgesi(etiket, deger, ek) {
  const kutu = el('div', 'ay-oge');
  kutu.append(el('p', 'etiket', etiket));
  const satir = el('p', 'ay-deger');
  satir.append(el('b', null, deger));
  satir.append(el('span', null, ek || '₺'));
  kutu.append(satir);
  return kutu;
}


// --- Masaüstü modülleri --------------------------------------------------
// Bunlar YALNIZ geniş ekranda çizilir. Telefonda yer yok ve zaten orada
// ekran "bugün ne oldu" sorusunun kısa cevabı; bu üçü "son zamanlarda ne
// oluyor" sorusunu cevaplıyor, o soru bilgisayar başında sorulan bir soru.



/**
 * ALIŞKANLIK / BU AY — masaüstünde, orta sütunun altında.
 *
 * Kartlar bugünü anlatıyor: yapıldı mı, seri kaç. Bu blok ayı anlatıyor:
 * ayın kaç gününde işaretlendi. İz şeridi deseni gösteriyor ama saymıyor;
 * burada sayı var ve alışkanlıklar birbiriyle karşılaştırılabiliyor.
 *
 * Payda BEKLENEN gün sayısı: günlük bir alışkanlıkta ayın tamamı, iki
 * günde birde yarısı. Aynı paydayla ölçmek "2 günde bir" olanı yarı yarıya
 * başarısız gösterirdi.
 */
function aliskanlikAyBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-alay');
  blok.dataset.alan = 'alay';

  const gecenGun = Number(bugun.slice(8, 10));
  blok.append(ustSatir('ALIŞKANLIK · BU AY', `${gecenGun} gün`));

  if (veri.tanimlar.length === 0) {
    blok.append(el('p', 'veri', 'Tanımlı alışkanlık yok'));
    return blok;
  }

  const liste = el('ul', 'kategori-barlar');

  for (const t of veri.tanimlar) {
    const iz = H.aliskanlikIzi(t, veri.onaylar, bugun, gecenGun);
    const yapilan = iz.filter((g) => g.durum === 'yapildi').length;

    const tip = (t.siklik || {}).tip;
    const aralik = tip === 'gun-arasi' ? (t.siklik.deger || 1) : 1;
    const beklenen =
      tip === 'haftalik'
        ? Math.round((gecenGun / 7) * (t.siklik.deger || 1))
        : Math.ceil(gecenGun / aralik);
    const oran = beklenen > 0 ? Math.min(yapilan / beklenen, 1) : 0;

    const satir = el('li', 'kategori-bar');
    const yol = el('span', 'kb-yol');
    const dolgu = el('i');
    dolgu.style.width = `${Math.max(oran * 100, 2)}%`;
    dolgu.dataset.durum = yapilan >= beklenen ? 'tam' : 'eksik';
    yol.append(dolgu);

    satir.append(
      el('span', 'kb-ad', kartAdi(t).toLocaleLowerCase('tr')),
      yol,
      el('span', 'kb-tutar', `${yapilan}/${beklenen}`)
    );
    liste.append(satir);
  }

  blok.append(liste);
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

  // Gün-arası alışkanlıkta "bugün spor günü" bir BİLGİDİR (ritim bugüne
  // denk geldi) ve sonucuyla birlikte okunabilir. Günlük alışkanlıkta ise
  // "bekleniyor" bir DURUMDUR; yapılmışken hâlâ beklendiğini söylemek
  // kendini çürütür — "Bugün de bekleniyor, yapıldı." çıkıyordu.
  if (gunArasi) {
    const bas = `Bugün ${tanim.ad.toLocaleLowerCase('tr')} günü`;
    if (yapildi) return `${bas}, yapıldı.`;
    if (kacirildi) return `${bas}, kaçırıldı.`;
    return aksam ? `${bas}, henüz işaretlenmedi.` : `${bas}.`;
  }

  if (yapildi) return 'Bugün de yapıldı.';
  if (kacirildi) return 'Bugün kaçırıldı.';
  return aksam ? 'Bugün de bekleniyor, henüz işaretlenmedi.' : 'Bugün de bekleniyor.';
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
  const izGun = genisEkran() ? IZ_GUN_GENIS : IZ_GUN;
  const gunler = H.aliskanlikIzi(tanim, veri.onaylar, bugun, izGun).map((g) =>
    g.durum === 'yapilmadi' && !H.bugunBekleniyorMu(tanim, veri.onaylar, g.gun)
      ? { gun: g.gun, durum: 'beklenmiyor' }
      : g
  );

  const iz = el('div', 'iz');
  const yapilan = gunler.filter((g) => g.durum === 'yapildi').length;
  // Durumu ad satırı ve durum kelimesi zaten söylüyor; iz görsel bir ek.
  iz.setAttribute('aria-hidden', 'true');
  iz.title = `Son ${izGun} günde ${yapilan} işaret`;
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
  // Geçiş bu adla eşleşir: kart bloklar arası taşınsa da tarayıcı onu
  // "aynı kart" olarak tanır ve eski konumundan yenisine kaydırır.
  kart.style.viewTransitionName = `alk-${tanim.id}`;
  const govde = el('div', 'kart-govde');

  // KART DA KAPI — harcama kutusuyla aynı desen: görünürde başlıkta bir
  // ok var, basılacak alan kartın tamamı.
  //
  // Buradaki fark, kartın İÇİNDE zaten basılan bir şey olması: onay
  // halkası. Kaplama onun üstüne binmemeli, yoksa tek tuş onay çalışmaz
  // ve bunun ekranda hiçbir belirtisi olmaz — düğme duruyor, basılıyor,
  // hiçbir şey olmuyor. Halka CSS'te bir kademe yukarı alındı.
  kart.classList.add('blok-kapi');

  const onay = H.onayBul(veri.onaylar, tanim.id, bugun);
  const bekleniyor = H.bugunBekleniyorMu(tanim, veri.onaylar, bugun);
  const kod = durumKodu(onay, bekleniyor);
  const seri = seriSayisi(tanim, veri.onaylar, bugun);

  // KART DA KAPI — harcama kutusuyla aynı desen: bağlantı `::after` ile
  // kartın tamamını kaplıyor, görünürde yalnız sağ üstteki ok var.
  //
  // Ok GEREKLİ: onsuz bağlantının hiçbir görsel karşılığı kalmıyor ve
  // kartın açılabildiği anlaşılmıyordu. Ayrıca boş bir <a> sıfır boyutlu
  // oluyor; klavye odağı ona geldiğinde odak halkası görünmüyordu.
  //
  // Kartın İÇİNDE zaten basılan bir şey var: onay halkası. Kaplama onun
  // üstüne binmemeli, yoksa tek tuş onay çalışmaz ve bunun ekranda hiçbir
  // belirtisi olmaz — düğme durur, basılır, hiçbir şey olmaz. Halka CSS'te
  // bir kademe yukarı alındı.
  const kapi = el('a', 'kapi-bag kart-kapi');
  kapi.href = '#aliskanlik/' + encodeURIComponent(tanim.id);
  kapi.setAttribute('aria-label', `${secenek.ad || tanim.ad} geçmişi`);
  kapi.append(el('span', 'kapi-ok', '›'));

  const ust = el('div', 'ust-satir');
  const ustSag = el('div', 'kart-ustsag');
  ustSag.append(el('span', 'kart-ritim', ritimMetni(tanim)), kapi);
  ust.append(el('span', 'kart-ad', secenek.ad || tanim.ad), ustSag);
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
  return kart;
}

/**
 * Bir alışkanlık akşam YUKARI ÇIKMAYI hak ediyor mu?
 *
 * Akşam kipinin varlık sebebi işaretlemedir: gün kapanırken bugün beklenen
 * ama henüz işaretlenmemiş alışkanlıklar öne alınır. İşaretlendiği anda o
 * görev biter ve kart gündüzkü yerine döner — akşam boyunca yukarıda
 * durması, yapılmış bir işi yapılacakmış gibi göstermek olurdu. Aynı
 * sebeple gündüz işaretlenmiş bir alışkanlık akşam hiç yukarı çıkmaz.
 *
 * Ara günü (bugün beklenmiyor) de yukarı çıkmaz: yapılacak bir şey yok.
 */
function aksamOncelikli(tanim, veri, bugun) {
  const onay = H.onayBul(veri.onaylar, tanim.id, bugun);
  if (onay) return false; // işaretlenmiş (yapıldı ya da kaçırıldı): iş bitti
  return H.bugunBekleniyorMu(tanim, veri.onaylar, bugun);
}

/**
 * @param {'bekleyen'|'kalan'|'tumu'} kume
 *   Akşam kipinde alışkanlıklar iki bloğa bölünür: bekleyenler ekranın
 *   üstüne, kalanlar gündüzkü yerine. Gündüz tek blok vardır (`tumu`).
 */
function aliskanlikBlogu(veri, bugun, aksam, simdi, isaretle, kume) {
  const blok = el('section', 'blok blok-aliskanlik');
  blok.dataset.alan = 'aliskanlik';

  if (veri.tanimlar.length === 0) {
    // İskelet çökmez: blok yerini korur, yalnız içi boştur.
    const kart = el('div', 'kart kart-ana');
    const govde = el('div', 'kart-govde');
    govde.append(el('p', 'veri', 'Tanımlı alışkanlık yok'));
    kart.append(govde);
    blok.append(kart);
    return blok;
  }

  // İKİ SINIF, İKİ KUTU BOYU. `ana: true` olanlar ÖNEMLİ alışkanlıklardır
  // ve büyük kart alırlar; kalanlar BASİT alışkanlıklardır ve sıkı kartta
  // dururlar. Sıra sabit: önce bütün önemliler, sonra bütün basitler.
  //
  // Neden gruplu: alışkanlık sayısı zamanla artacak. Boyut farkı tek tek
  // kartlara dağılmış olsaydı (büyük, küçük, büyük, küçük) liste bir
  // ızgaraya değil kazaya benzerdi; sınıf sınıf dizilince boyut farkı
  // sıralamanın kendisini anlatan bir işarete dönüşüyor.
  const secili = veri.tanimlar.filter((t) => {
    if (kume === 'bekleyen') return aksamOncelikli(t, veri, bugun);
    if (kume === 'kalan') return !aksamOncelikli(t, veri, bugun);
    return true;
  });
  if (secili.length === 0) return null;

  const onemliler = secili.filter((t) => t.ana);
  const basitler = secili.filter((t) => !t.ana);
  // Hiç önemli işaretlenmemişse ilki öne çıkar: ekran sınıfsız kalmasın.
  if (onemliler.length === 0 && basitler.length > 0) onemliler.push(basitler.shift());

  for (const t of onemliler) {
    blok.append(
      aliskanlikKarti(t, veri, bugun, {
        boy: aksam ? 'seri-dev' : 'seri-kucuk',
        cumle: true,
        aksam,
        ad: t.ad.toLocaleUpperCase('tr'),
      }, isaretle)
    );
  }

  for (const t of basitler) {
    blok.append(
      aliskanlikKarti(t, veri, bugun, {
        ikincil: true,
        boy: aksam ? 'seri-orta' : 'seri-mini',
        kucukDugme: !aksam,
        veriSatiri: aksam && t.id === 'erken-uyku' ? uykuGeriSayim(simdi) : null,
        // Tanımdaki ad bir cümle olabilir ("Gece 02:00'den önce uyu");
        // kart adı etiket sesiyle dizilir ve etiket cümle olamaz.
        ad: kartAdi(t),
      }, isaretle)
    );
  }

  return blok;
}

/**
 * Kart başlığı. Ad kelime sınırından KESİLMEZ — "Gece 02:00'den önce uyu"
 * ilk iki kelimeye indirilince "GECE 02:00'DEN" kalıyordu ve bu bir ad
 * değil, yarım cümle. Sayfa kaydırılabildiği için başlığın sarmasında bir
 * sakınca yok; uzun ad sarar, kart onun kadar uzar.
 */
function kartAdi(tanim) {
  return tanim.ad.trim().toLocaleUpperCase('tr');
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

/**
 * SIRADAKİ ÖDEME — kendi kutusu, harcamanın hemen altında.
 *
 * Aylık abonelik yükü ekranın en altında duruyor ve "bir sonraki ödemem ne
 * zaman" sorusu oraya kadar inmeyi gerektiriyordu. O soru günün her saati
 * sorulabilir ve cevabı tek satırdır; listeyi taşımadan yalnız cevabı öne
 * almak yeterli.
 *
 * Yenileme günü bilinmiyorsa tahmin ÜRETİLMEZ. Kutu yine durur ve neyi
 * bilmediğini söyler: boş bir vaat, yanlış bir tarihten iyidir.
 */
function sonrakiOdemeBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-odeme');
  blok.dataset.alan = 'odeme';
  const aktif = veri.abonelikler.filter((a) => a.aktif);
  const y = H.yaklasanOdemeler(veri.abonelikler, bugun, 400)[0];

  blok.append(el('p', 'etiket', 'SIRADAKİ ÖDEME'));

  const satir = el('div', 'odeme-satir');

  if (!y) {
    satir.append(
      el(
        'p',
        'veri',
        aktif.length === 0
          ? 'Aktif abonelik yok'
          : 'Yenileme günleri henüz bilinmiyor'
      )
    );
    blok.append(satir);
    return blok;
  }

  const tl = H.tryeCevir(y.abonelik.tutar, y.abonelik.birim || 'TRY', veri.kur);
  const sol = el('div', 'odeme-kim');
  sol.append(
    el('p', 'odeme-ad', y.abonelik.ad),
    el('p', 'veri', kalanMetni(y.kalanGun))
  );
  satir.append(sol, buyukSayi(lira(tl), '₺', 'kucuk'));
  blok.append(satir);

  return blok;
}

function abonelikBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-abonelik');
  blok.dataset.alan = 'abonelik';
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

  const tavan = genisEkran() ? ABONE_SATIR_GENIS : ABONE_SATIR;
  if (satirlar.length > tavan) {
    const kuyruk = satirlar.slice(tavan - 1);
    const kuyrukToplam = kuyruk.reduce((t, s) => t + s.aylik, 0);
    satirlar = [
      ...satirlar.slice(0, tavan - 1),
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

  const dipnot = abonelikDipnotu(aktif, veri, bugun);
  if (dipnot) blok.append(el('p', 'dipnot', dipnot));

  return blok;
}

// --- Token ekranı --------------------------------------------------------

/**
 * İlk açılışta bir kez: GitHub erişim anahtarı.
 *
 * "Argos'ta hiçbir metin girişi yoktur" kararının bilinçli istisnası.
 * Girilen şey VERİ değil, veriye açılan kapının anahtarı — ve bir kez
 * girilir, tarayıcıda kalır. Karara aykırı olan, her gün klavye açtıran
 * bir giriş yüzeyiydi; bu o değil.
 *
 * Token KAYDEDİLMEDEN ÖNCE denenir. Yanlış bir anahtarı kaydedip sonra
 * "veri okunamadı" demek, kullanıcıyı sorunu yanlış yerde aratır:
 * ekranda hata görünür ama nedeni saklanmış olur.
 */
function tokenEkrani(sonra) {
  const blok = el('section', 'blok blok-token');
  blok.append(el('p', 'etiket', 'ARGOS'));
  blok.append(
    el('p', 'yorum', 'Verine erişmek için bir GitHub anahtarı gerekiyor.')
  );

  const form = el('form', 'token-form');
  const alan = el('input', 'token-alan');
  alan.type = 'password';
  alan.placeholder = 'github_pat_…';
  alan.autocomplete = 'off';
  alan.spellcheck = false;
  alan.setAttribute('aria-label', 'GitHub erişim anahtarı');

  const dugme = el('button', 'token-dugme', 'Bağlan');
  dugme.type = 'submit';

  const durum = el('p', 'token-durum');

  form.append(alan, dugme);
  blok.append(form, durum);

  blok.append(
    el(
      'p',
      'dipnot',
      'Anahtar yalnız bu tarayıcıda saklanır, hiçbir yere gönderilmez.'
    )
  );

  form.addEventListener('submit', async (olay) => {
    olay.preventDefault();
    const girilen = alan.value.trim();
    if (!girilen) return;

    dugme.disabled = true;
    alan.disabled = true;
    durum.textContent = 'Deneniyor…';
    durum.dataset.durum = 'bekliyor';

    try {
      await tokenDene(girilen);
      tokenYaz(girilen);
      durum.textContent = 'Bağlandı.';
      durum.dataset.durum = 'oldu';
      sonra();
    } catch (hata) {
      // Ağ hatası ile yetki hatası ayrı anlatılır: biri "bağlantını
      // kontrol et", diğeri "anahtarı değiştir" demek.
      durum.textContent =
        hata instanceof TypeError
          ? 'Bağlantı kurulamadı. Ağını kontrol et.'
          : hata.message;
      durum.dataset.durum = 'olmadi';
      dugme.disabled = false;
      alan.disabled = false;
      alan.focus();
      alan.select();
    }
  });

  ekran.dataset.duzen = 'sutun';
  ekran.replaceChildren(blok);
  ekran.removeAttribute('aria-busy');
  alan.focus();
}

// --- Çizim ---------------------------------------------------------------

/**
 * Hata kutusu.
 *
 * Çevrimdışıyken mesaj DEĞİŞİR: "geliştirme sunucusu çalışıyor mu" telefonda
 * karşılığı olmayan bir soru ve altındaki "Failed to fetch" hiçbir şey
 * anlatmıyor. Kabuk çevrimdışı açılabildiği için bu ekran gerçekten
 * görülecek bir ekran; ne olduğunu söylemesi gerekiyor.
 */
function hataGoster(hata, baslik) {
  const kutu = el('div', 'blok hata');
  // Ağ hatası mı, sunucu hatası mı? `fetch` ağa hiç ulaşamazsa TypeError
  // atar; HTTP durum kodları veri katmanında normal Error'a çevriliyor.
  // Ayrımı buradan yapmak `navigator.onLine`dan sağlam: o bayrak sayfa
  // yüklenirken bir süre eski değerinde kalabiliyor ve tam çizim anında
  // yanlış cevap veriyor (ölçüldü — çevrimdışı açılışta `true` dönüyordu).
  const cevrimdisi = hata instanceof TypeError || !navigator.onLine;
  kutu.append(
    el('p', 'yorum', cevrimdisi ? 'Bağlantı yok. Veri okunamadı.' : baslik)
  );
  kutu.append(
    el(
      'code',
      null,
      cevrimdisi
        ? 'Argos veriyi her açılışta yeniden okur; bayat bir kopya göstermez.'
        : String(hata.message || hata)
    )
  );
  ekran.replaceChildren(kutu);
  ekran.removeAttribute('aria-busy');
  console.error(hata);
}

/**
 * YUMUŞAK GEÇİŞ — kart bloklar arası taşınırken kayar, sıçramaz.
 *
 * İşaretleme, alışkanlık kartını akşam üst bloğundan gündüzkü yerine
 * taşıyor. DOM baştan kurulduğu için kart eski yerinde kaybolup yenisinde
 * beliriyor; hareket görünmüyor, ekran "zıplıyor". View Transitions API
 * eski ve yeni kareyi kendisi eşleştirip aradaki yolu oynatıyor.
 *
 * Destek yoksa (ya da kullanıcı azaltılmış hareket istiyorsa) çizim
 * doğrudan yapılır: animasyon bir süs değil, kaybolan hareketin yerine
 * konan şey — olmadığında da ekran doğru çalışır.
 */
function yumusakGecis(cizimi) {
  const azalt = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (azalt || !document.startViewTransition) return cizimi();
  return document.startViewTransition(cizimi).finished.catch(() => {});
}

/**
 * ROTA — hash tabanlı, tek sayfa.
 *
 *   (boş)                    ana ekran
 *   harcama                  içinde bulunulan ay
 *   harcama/2026-07          o ay
 *   kategori/2026-08/market  o ayda o kategori
 *   gun/2026-08-27           o gün
 *   yer/2026-08/Migros       o ayda o mekân
 *   aliskanlik/spor          o alışkanlığın geçmişi
 *
 * Ayrı .html dosyaları yerine hash: tema betiği, yazı tipi ve alışkanlık
 * verisi yeniden yüklenmiyor, geçiş beyaz bir kareye düşmüyor. Geri tuşu
 * yine tarayıcının kendi geri tuşu.
 *
 * Ay parametresi rotanın içinde duruyor, bir yerde saklanmıyor: kategori
 * sayfasından geri dönünce hangi aya döneceği bağlantıda yazılı olmalı,
 * yoksa "geri" her zaman bu aya götürür ve geçmiş ayda gezinen biri her
 * tıklamada bugüne fırlar.
 */
function rotaCoz() {
  const p = decodeURIComponent(location.hash.replace(/^#/, ''))
    .split('/')
    .filter(Boolean);

  if (p[0] === 'harcama') return { sayfa: 'harcama', ay: p[1] || null };
  if (p[0] === 'kategori' && p[1] && p[2]) {
    return { sayfa: 'kategori', ay: p[1], ad: p[2] };
  }
  if (p[0] === 'yer' && p[1] && p[2]) {
    return { sayfa: 'yer', ay: p[1], ad: p[2] };
  }
  if (p[0] === 'gun' && p[1]) return { sayfa: 'gun', tarih: p[1] };
  if (p[0] === 'aliskanlik' && p[1]) return { sayfa: 'aliskanlik', ad: p[1] };
  return { sayfa: 'ana' };
}

/** Rotanın istediği ayın verisi. Bu ay zaten yüklü, geçmiş ay ek istek. */
async function rotaVerisi(rota, veri) {
  const ay = rota.sayfa === 'gun' ? rota.tarih.slice(0, 7) : rota.ay || veri.ay;
  if (ay === veri.ay) return veri;
  return ayVerisi(kaynak, ay);
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

  // Yayındayken token gerekiyor ve yoksa çizilecek bir şey yok. Bu bir
  // hata değil, ilk açılışın normal hâli.
  if (!kaynak) {
    cizimSurdu = false;
    tokenEkrani(() => {
      kaynak = kaynakSec();
      ciz();
    });
    return;
  }

  let veri;
  try {
    veri = await veriYukle(kaynak, bugun);
  } catch (hata) {
    cizimSurdu = false;
    // Token reddedildiyse ekranda "veri okunamadı" demek yanlış yere
    // baktırır: anahtar değişmiş ya da süresi dolmuş olabilir. Kayıtlı
    // token silinip giriş ekranına dönülür.
    if (hata.tokenSorunu) {
      tokenSil();
      kaynak = null;
      tokenEkrani(() => {
        kaynak = kaynakSec();
        ciz();
      });
      return;
    }
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
      // İşaretleme kartı bir bloktan diğerine taşıyor; sert bir sıçrama
      // yerine kayarak gitsin (yumuşakGecis).
      await yumusakGecis(() => ciz());
    } catch (hata) {
      dugme.disabled = false;
      hataGoster(hata, 'İşaret kaydedilemedi.');
    }
  }

  // Ayrıntı sayfaları: ana ekranın blokları hiç kurulmaz. Kurulup
  // atılmaları görünmeyen bir maliyet olurdu ve tek tuş onay yalnız ana
  // ekranda var — orada olmayan bir düğmenin işleyicisi de gereksiz.
  const rota = rotaCoz();
  if (rota.sayfa !== 'ana') {
    let ayVeri;
    try {
      ayVeri = await rotaVerisi(rota, veri);
    } catch (hata) {
      cizimSurdu = false;
      hataGoster(hata, 'Ay verisi okunamadı.');
      return;
    }

    if (rota.sayfa === 'aliskanlik') {
      ekran.dataset.duzen = genisEkran() ? 'ayrinti' : 'sutun';
      ekran.replaceChildren(...aliskanlikSayfasi(veri, bugun, rota.ad));
      ekran.removeAttribute('aria-busy');
      cizimSurdu = false;
      return;
    }

    const dugumler =
      rota.sayfa === 'harcama'
        ? aySayfasi(ayVeri, bugun)
        : rota.sayfa === 'kategori'
          ? kategoriSayfasi(ayVeri, bugun, rota.ad)
          : rota.sayfa === 'yer'
            ? yerSayfasi(ayVeri, bugun, rota.ad)
            : gunSayfasi(ayVeri, bugun, rota.tarih);

    ekran.dataset.duzen = genisEkran() ? 'ayrinti' : 'sutun';
    ekran.replaceChildren(...dugumler);
    ekran.removeAttribute('aria-busy');
    cizimSurdu = false;
    return;
  }

  const harcama = harcamaBlogu(veri, bugun, aksam);
  const odeme = sonrakiOdemeBlogu(veri, bugun);
  const abonelik = abonelikBlogu(veri, bugun);

  // Akşam alışkanlıklar İKİYE bölünür: bekleyenler ekranın en üstüne,
  // kalanlar (işaretlenmiş ya da bugün beklenmeyenler) gündüzkü yerine.
  // Bir alışkanlık işaretlendiği anda kart aşağı iner — akşam boyunca
  // yukarıda kalması yapılmış işi yapılacakmış gibi gösterirdi. Hepsi
  // işaretliyse üst blok hiç oluşmaz ve ekran gündüz düzenine döner.
  const bekleyen = aksam
    ? aliskanlikBlogu(veri, bugun, aksam, simdi, isaretle, 'bekleyen')
    : null;
  const kalan = aliskanlikBlogu(
    veri,
    bugun,
    aksam,
    simdi,
    isaretle,
    aksam ? 'kalan' : 'tumu'
  );

  if (genisEkran()) {
    // MASAÜSTÜ: ekran bir sayfa değil bir PANO. Bloklar tek sütunda alt
    // alta dizilmez; üç bölgeye dağılır ve hepsi aynı anda görünür.
    //
    // Sütunlar CSS ızgarasıyla değil burada kuruluyor: blok sayısı değişken
    // (akşam bekleyen bloğu var, gündüz yok) ve değişken satır sayısına
    // `grid-row: 1 / -1` ile sütun kurmak sağ sütunu boş bırakıp abonelik
    // bloğunu ekrandan taşırıyordu.
    const sol = el('div', 'sutun sutun-sol');
    const orta = el('div', 'sutun sutun-orta');
    const sag = el('div', 'sutun sutun-sag');

    // Sol: günün parası, altında ayın şekli.
    sol.append(harcama, ayGrafigiBlogu(veri, bugun));
    // Orta: alışkanlıklar (bekleyenler üstte), altında sıradaki ödeme.
    for (const b of [bekleyen, kalan].filter(Boolean)) orta.append(b);
    orta.append(aliskanlikAyBlogu(veri, bugun), odeme);
    // Sağ: ayın dökümü — kategori, saat, abonelik.
    sag.append(
      ayOzetBlogu(veri, bugun),
      ayKategoriBlogu(veri, bugun, { tavan: 7, bagli: true }),
      saatBlogu(veri, bugun),
      abonelik
    );

    ekran.dataset.duzen = 'pano';
    ekran.replaceChildren(sol, orta, sag);
  } else {
    // Telefon: tek sütun. Sıradaki ödeme harcamanın hemen altında — cevabı
    // bir satırlık bir soru, listeye inmeden görünmeli. Abonelik sonuncu.
    ekran.dataset.duzen = 'sutun';
    ekran.replaceChildren(
      ...[bekleyen, harcama, odeme, kalan, abonelik].filter(Boolean)
    );
  }
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

// Sayfa değişimi de bir kart hareketi: yumuşakGecis aynı işi burada da
// yapıyor. Kaydırma başa alınır — ayrıntı sayfasına ortasından girmek,
// yeni bir sayfaya girildiğini gizler.
addEventListener('hashchange', () => {
  cizimSurdu = false;
  yumusakGecis(() => {
    ciz();
    scrollTo(0, 0);
  });
});

// Pencere telefon genişliğiyle masaüstü arasında geçerse düzen değişmeli:
// sütunlar JS'te kurulduğu için CSS tek başına yetişemiyor.
matchMedia('(min-width: 1024px)').addEventListener('change', () => {
  cizimSurdu = false;
  ciz();
});

// Gün ve kip kendiliğinden dönmeli; akşam geri sayımı da dakikada bir
// tazelenir. Daha sık çizmek görünür bir şey değiştirmez.
setInterval(ciz, 60000);
