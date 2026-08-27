// Ana ekran. Veriyi kaynaktan alır, hesabı hesap.js'e bırakır, DOM'u kurar.
// Burada hesap yapılmaz; burada yalnız gösterim kararı verilir.
//
// Kısıt: her şey tek ekrana sığar. Bir bilgi yer kaplıyorsa taşıdığı kadar
// kaplamalı - bu yüzden ayrı grafik alanı yok, pay bilgisi satırın kendi
// zeminine gömülü.

import * as H from './hesap.js';
import { yerelKaynak, veriYukle, onayIsaretle } from './veri.js';

const AKSAM_ESIGI = 22; // kararlar.md > Ana ekran saate göre yeniden sıralanır
const EN_COK_KAYIT = 6; // ekrana sığan satır sayısı; kalanı tek satırda özetlenir

const ekran = document.getElementById('ekran');
const kaynak = yerelKaynak();

const el = (etiket, sinif, metin) => {
  const d = document.createElement(etiket);
  if (sinif) d.className = sinif;
  if (metin != null) d.textContent = metin;
  return d;
};

const GUNLER = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
const AYLAR = [
  'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran',
  'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık',
];

const KATEGORI_ADI = {
  'yeme-icme': 'yeme içme',
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

const oku = (k) => KATEGORI_ADI[k] || k;
const lira = (ham) => H.bicimle(H.yuvarla(ham));

/** Bir harcamayı tek satırda anlatır: yer varsa yer, yoksa kategori. */
function kayitAdi(h) {
  const alt = h.alt ? oku(h.alt) : null;
  const kat = oku(h.kategori);
  if (h.yer) return alt ? `${h.yer}, ${alt}` : `${h.yer}, ${kat}`;
  return alt ? `${kat}, ${alt}` : kat;
}

/** Büyük sayı + etiket. Her bloğun başında aynı biçim. */
function tepe(sayi, etiket, baglamSatirlari) {
  const kutu = el('div', 'tepe');

  const buyuk = el('div', 'buyuk');
  buyuk.append(el('b', null, sayi), el('span', 'etiket', etiket));
  kutu.append(buyuk);

  if (baglamSatirlari && baglamSatirlari.length) {
    const baglam = el('div', 'baglam');
    baglamSatirlari.forEach((parcalar, i) => {
      if (i > 0) baglam.append(document.createElement('br'));
      for (const p of parcalar) {
        baglam.append(typeof p === 'string' ? p : el('b', null, p.vurgu));
      }
    });
    kutu.append(baglam);
  }

  return kutu;
}

// --- Bugünkü harcama -----------------------------------------------------

function harcamaBlogu(veri, bugun) {
  const blok = el('section', 'blok');
  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);
  const gunToplam = H.toplamTL(bugunku, veri.kur);

  // Bugünün rakamı tek başına bir şey anlatmaz; ay toplamı ve günlük
  // ortalama olmadan "çok mu az mı" sorusu cevapsız kalır.
  blok.append(
    tepe(lira(gunToplam), 'lira bugün', [
      [{ vurgu: lira(H.ayToplami(veri.harcamalar, veri.kur)) }, ' bu ay'],
      ['günde ', { vurgu: lira(H.gunlukOrtalama(veri.harcamalar, veri.kur, bugun)) }],
    ])
  );

  if (bugunku.length === 0) {
    blok.append(
      el('p', 'bos', 'Bugüne kayıt düşmedi. Akşam özetinde anlattığın her şey buraya iner.')
    );
    return blok;
  }

  // Büyükten küçüğe: gözün ilk gördüğü satır günün en büyük kalemi olmalı.
  const sirali = bugunku
    .map((h) => ({ h, tl: H.tryeCevir(h.tutar, h.birim || 'TRY', veri.kur) }))
    .sort((a, b) => b.tl - a.tl);

  const gosterilen = sirali.slice(0, EN_COK_KAYIT);
  const liste = el('ul', 'kayitlar');

  // Zemin, gün toplamına göre değil günün EN BÜYÜK kalemine göre ölçülür.
  // Toplama göre ölçünce yalnız en büyük satır okunuyor, küçük kalemler
  // birkaç piksellik kırıntıya iniyordu.
  const enBuyuk = sirali[0].tl;

  for (const x of gosterilen) {
    const satir = el('li', 'kayit');
    satir.style.setProperty('--oran', `${Math.round((x.tl / enBuyuk) * 100)}%`);
    satir.append(
      el('span', 'saat', x.h.saat || ''),
      el('span', 'ad', kayitAdi(x.h)),
      el('span', 'tut', lira(x.tl))
    );
    liste.append(satir);
  }
  blok.append(liste);

  const kalan = sirali.length - gosterilen.length;
  if (kalan > 0) {
    const kalanTL = sirali.slice(EN_COK_KAYIT).reduce((t, x) => t + x.tl, 0);
    blok.append(el('p', 'bos', `${kalan} küçük kalem daha, toplam ${lira(kalanTL)} lira.`));
  }

  return blok;
}

// --- Alışkanlık ----------------------------------------------------------

function seriMetni(tanim, onaylar, bugun) {
  if (tanim.siklik && tanim.siklik.tip === 'haftalik') {
    const d = H.haftalikDurum(tanim, onaylar, bugun);
    return `bu hafta ${d.yapilan}/${d.hedef}`;
  }
  const seri = H.seriHesapla(tanim, onaylar, bugun);
  if (seri === 0) return null;
  return `${seri} ${tanim.siklik && tanim.siklik.tip === 'gun-arasi' ? 'tur' : 'gün'}`;
}

function notMetni(onay, bekleniyor, seri) {
  if (onay && onay.durum === 'yapilmadi') return 'kaçırıldı';
  if (onay && onay.durum === 'yapildi') return seri || 'bugün';
  if (!bekleniyor) return 'yarın';
  return seri ? `bekleniyor, ${seri}` : 'bekleniyor';
}

function aliskanlikBlogu(veri, bugun, yenile) {
  const blok = el('section', 'blok');
  const tanimlar = veri.tanimlar;

  if (tanimlar.length === 0) {
    blok.append(el('p', 'bos', 'Tanımlı alışkanlık yok. Claude ekleyebilir.'));
    return blok;
  }

  const ana = tanimlar.find((t) => t.ana) || tanimlar[0];
  const sirali = [ana, ...tanimlar.filter((t) => t !== ana)];
  const liste = el('ul', 'aliskanliklar');

  for (const t of sirali) {
    const onay = H.onayBul(veri.onaylar, t.id, bugun);
    const bekleniyor = H.bugunBekleniyorMu(t, veri.onaylar, bugun);
    const seri = seriMetni(t, veri.onaylar, bugun);

    const dolu = onay && onay.durum === 'yapildi';
    const kacirildi = onay && onay.durum === 'yapilmadi';

    const dgm = el('button', 'satir');
    dgm.type = 'button';
    dgm.dataset.ana = t === ana ? 'evet' : 'hayir';
    dgm.dataset.dolu = dolu ? 'evet' : kacirildi ? 'kacirildi' : 'hayir';
    dgm.dataset.bekleniyor = !onay && bekleniyor ? 'evet' : 'hayir';
    dgm.setAttribute('aria-pressed', String(!!dolu));
    dgm.setAttribute('aria-label', `${t.ad}: ${notMetni(onay, bekleniyor, seri)}`);

    dgm.append(
      el('span', 'isim', t.ad),
      el('span', 'not', notMetni(onay, bekleniyor, seri)),
      el('span', 'kutu')
    );
    dgm.addEventListener('click', () => isaretle(dgm, veri, t, bugun, yenile));

    const li = el('li');
    li.append(dgm);
    liste.append(li);
  }

  blok.append(liste);
  return blok;
}

/** Tek tuş işaretleme. Yazma başarısızsa ekran eski haline döner. */
async function isaretle(dugme, veri, tanim, bugun, yenile) {
  const suAn = H.onayBul(veri.onaylar, tanim.id, bugun);
  const yeniDurum = suAn && suAn.durum === 'yapildi' ? 'yapilmadi' : 'yapildi';

  dugme.disabled = true;
  try {
    await onayIsaretle(kaynak, veri, tanim.id, bugun, yeniDurum);
    yenile();
  } catch (hata) {
    dugme.disabled = false;
    hataGoster(hata, 'İşaret kaydedilemedi.');
  }
}

// --- Abonelik ------------------------------------------------------------

const kalanMetni = (gun) => (gun === 0 ? 'bugün' : gun === 1 ? 'yarın' : `${gun} gün sonra`);

/**
 * İlk ekranın alt kenarındaki tek satır: yalnız SIRADAKİ ödeme.
 * Abonelik bugünkü harcamayla eşit ağırlıkta değil; tam liste aşağıda kalır.
 */
function sonrakiOdeme(veri, bugun) {
  const blok = el('section', 'blok-sonraki');
  const satir = el('div', 'sonraki');
  satir.append(el('span', 'onek', 'SIRADAKİ'));

  // Pencere geniş tutulur: bir sonraki ödeme bu hafta olmayabilir, ama
  // "sıradaki" olduğu için yine de gösterilmeli.
  const yaklasan = H.yaklasanOdemeler(veri.abonelikler, bugun, 40);

  if (yaklasan.length === 0) {
    const aktif = veri.abonelikler.filter((a) => a.aktif).length;
    satir.append(
      el(
        'span',
        'kim',
        aktif ? 'Yenileme günleri bilinmiyor' : 'Aktif abonelik yok'
      )
    );
  } else {
    const y = yaklasan[0];
    const tl = H.tryeCevir(y.abonelik.tutar, y.abonelik.birim || 'TRY', veri.kur);
    satir.append(
      el('span', 'kim', `${y.abonelik.ad}, ${lira(tl)} lira`),
      el('span', 'ne-zaman', kalanMetni(y.kalanGun))
    );
  }

  blok.append(satir);
  return blok;
}

/** Katlamanın altındaki tam liste. */
function abonelikBlogu(veri, bugun) {
  const blok = el('section', 'blok-abonelik');
  const aktif = veri.abonelikler.filter((a) => a.aktif);

  const baslik = el('p', 'abone-baslik');
  baslik.append(
    el('b', null, lira(H.aylikAbonelikToplami(veri.abonelikler, veri.kur))),
    el('span', null, `lira aylık, ${aktif.length} abonelik`)
  );
  blok.append(baslik);

  // Ödemesi yakın olan üstte; günü bilinmeyenler sona düşer.
  const sirali = aktif
    .map((a) => ({ a, tarih: H.sonrakiYenileme(a, bugun) }))
    .sort((x, y) => {
      if (!x.tarih) return 1;
      if (!y.tarih) return -1;
      return x.tarih.localeCompare(y.tarih);
    });

  for (const { a, tarih } of sirali) {
    const tl = H.tryeCevir(a.tutar, a.birim || 'TRY', veri.kur);
    const satir = el('div', 'abone-satir');
    satir.append(
      el('span', 'ad', a.ad),
      el('span', 'tut', lira(tl)),
      el('span', 'ne-zaman', tarih ? kalanMetni(H.gunFarki(tarih, bugun)) : 'gün bilinmiyor')
    );
    blok.append(satir);
  }

  // Eksik veri ekranda da eksik görünmeli; tahmin üretmek yanlış güven verir.
  const bilinmeyen = sirali.filter((x) => !x.tarih).length;
  if (bilinmeyen > 0) {
    blok.append(
      el(
        'p',
        'dipnot',
        `${bilinmeyen} aboneliğin yenileme günü kayıtlı değil. Claude'a söyleyince eklenir.`
      )
    );
  }

  return blok;
}

// --- Çizim ---------------------------------------------------------------

function hataGoster(hata, baslik) {
  ekran.replaceChildren();
  const kutu = el('div', 'hata');
  kutu.append(el('p', null, baslik));
  kutu.append(el('code', null, String(hata.message || hata)));
  ekran.append(kutu);
  ekran.removeAttribute('aria-busy');
  console.error(hata);
}

async function ciz() {
  const simdi = new Date();
  const bugun = H.gunAnahtari(simdi);

  document.getElementById('tarih').textContent =
    `${simdi.getDate()} ${AYLAR[simdi.getMonth()]} ${GUNLER[simdi.getDay()]}`;

  let veri;
  try {
    veri = await veriYukle(kaynak, bugun);
  } catch (hata) {
    hataGoster(hata, 'Veri okunamadı. Geliştirme sunucusu çalışıyor mu?');
    return;
  }

  // Gündüz harcama önce gelir, akşam (22:00 sonrası) alışkanlık öne çıkar.
  // Sıra CSS order ile değil burada kurulur; ayraçlar DOM sırasına bakar.
  // Karar: kararlar.md > Ana ekran saate göre yeniden sıralanır
  const aksam = simdi.getHours() >= AKSAM_ESIGI;
  const harcama = harcamaBlogu(veri, bugun);
  const aliskanlik = aliskanlikBlogu(veri, bugun, ciz);

  // İlk ekran tam yüksekliktedir ve sıradaki ödeme satırıyla biter.
  // Abonelik listesi onun kardeşidir, yani katlamanın altında kalır.
  const ilkEkran = el('div', 'ilk-ekran');
  ilkEkran.append(
    ...(aksam ? [aliskanlik, harcama] : [harcama, aliskanlik]),
    sonrakiOdeme(veri, bugun)
  );

  ekran.dataset.kip = aksam ? 'aksam' : 'gunduz';
  ekran.replaceChildren(ilkEkran, abonelikBlogu(veri, bugun));
  ekran.removeAttribute('aria-busy');
}

ciz();

// Gün dönünce ekran kendiliğinden yeni güne geçmeli; dakikada bir kontrol
// yeterli, daha sık çizmek görünür bir şey değiştirmez.
setInterval(ciz, 60000);
