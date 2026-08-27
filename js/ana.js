// Ana ekran. Veriyi kaynaktan alır, hesabı hesap.js'e bırakır, DOM'u kurar.
// Burada hesap yapılmaz; burada yalnız gösterim kararı verilir.

import * as H from './hesap.js';
import { yerelKaynak, veriYukle, onayIsaretle } from './veri.js';

const AKSAM_ESIGI = 22; // kararlar.md > Ana ekran saate göre yeniden sıralanır
const IZ_GUN = 14; // alışkanlık ızgarasında gösterilen gün sayısı
const EN_COK_KATEGORI = 5; // fazlası "diğer" altında toplanır

const ekran = document.getElementById('ekran');
const kaynak = yerelKaynak();

const el = (etiket, sinif, metin) => {
  const d = document.createElement(etiket);
  if (sinif) d.className = sinif;
  if (metin != null) d.textContent = metin;
  return d;
};

const GUNLER = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
const KISA_GUN = ['pz', 'pt', 'sa', 'ça', 'pe', 'cu', 'ct'];
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

// Renk kategoriyi takip eder, sıralamayı değil: market bugün ilk sırada da
// olsa dördüncü sırada da olsa aynı renktedir. Sıra değişince renklerin
// yer değiştirmesi, aynı ekranı iki gün üst üste okumayı imkânsız kılar.
const KATEGORI_RENGI = {
  market: 'k1',
  'yeme-icme': 'k2',
  ulasim: 'k3',
  fatura: 'k4',
  teknoloji: 'k5',
};

const oku = (k) => KATEGORI_ADI[k] || k;
const lira = (ham) => H.bicimle(H.yuvarla(ham));
const renkDegiskeni = (kategori) => `var(--${KATEGORI_RENGI[kategori] || 'k6'})`;

/** Bir harcamayı tek satırda anlatır: yer varsa yer, yoksa kategori. */
function kayitAdi(h) {
  const alt = h.alt ? oku(h.alt) : null;
  const kat = oku(h.kategori);
  if (h.yer) return alt ? `${h.yer}, ${alt}` : `${h.yer}, ${kat}`;
  return alt ? `${kat}, ${alt}` : kat;
}

/** Büyük sayı solda, ay bağlamı sağda. */
function tepe(sayi, etiket, baglamSatirlari) {
  const kutu = el('div', 'tepe');
  const buyuk = el('div', 'buyuk');
  buyuk.append(el('b', null, sayi), el('span', 'etiket', etiket));
  kutu.append(buyuk);

  const baglam = el('div', 'baglam');
  baglamSatirlari.forEach((parcalar, i) => {
    if (i > 0) baglam.append(document.createElement('br'));
    for (const p of parcalar) {
      baglam.append(typeof p === 'string' ? p : el('b', null, p.vurgu));
    }
  });
  kutu.append(baglam);
  return kutu;
}

// --- Bugün: yığılmış kategori şeridi -------------------------------------

/**
 * Kategorileri büyükten küçüğe alır, beşten fazlasını "diğer" altında
 * toplar. Sekiz renkli bir şeridi kimse okuyamaz; okunmayan renk bilgi
 * değil gürültüdür.
 */
function kategoriDagilimi(harcamalar, kur) {
  const tumu = H.kategoriKirilimi(harcamalar, kur);
  if (tumu.length <= EN_COK_KATEGORI) return tumu;

  const bas = tumu.slice(0, EN_COK_KATEGORI - 1);
  const kalanTutar = tumu.slice(EN_COK_KATEGORI - 1).reduce((t, k) => t + k.tutar, 0);
  return [...bas, { kategori: 'diger', tutar: kalanTutar, toplanmis: true }];
}

function harcamaBlogu(veri, bugun) {
  const blok = el('section', 'blok');
  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);
  const gunToplam = H.toplamTL(bugunku, veri.kur);

  // Bugünün rakamı tek başına bir şey anlatmaz; neyle kıyaslandığı olmadan
  // "çok mu az mı" sorusu cevapsız kalır.
  blok.append(
    tepe(lira(gunToplam), 'lira bugün', [
      [{ vurgu: lira(H.ayToplami(veri.harcamalar, veri.kur)) }, ' bu ay'],
      ['günde ', { vurgu: lira(H.gunlukOrtalama(veri.harcamalar, veri.kur, bugun)) }],
    ])
  );

  if (bugunku.length === 0) {
    blok.append(el('div', 'serit-bos'));
    blok.append(
      el('p', 'bos', 'Bugüne kayıt düşmedi. Akşam özetinde anlattığın her şey buraya iner.')
    );
    return blok;
  }

  const dagilim = kategoriDagilimi(bugunku, veri.kur);

  const serit = el('div', 'serit');
  serit.setAttribute('role', 'img');
  serit.setAttribute(
    'aria-label',
    `Kategori dağılımı: ${dagilim.map((k) => `${oku(k.kategori)} ${lira(k.tutar)} lira`).join(', ')}`
  );
  for (const k of dagilim) {
    const parca = el('span');
    parca.style.flexGrow = String(k.tutar);
    parca.style.background = renkDegiskeni(k.kategori);
    serit.append(parca);
  }
  blok.append(serit);

  const liste = el('ul', 'kategoriler');
  for (const k of dagilim) {
    const nokta = el('span', 'nokta');
    nokta.style.background = renkDegiskeni(k.kategori);

    const satir = el('li', 'kategori');
    satir.append(
      nokta,
      el('span', 'ad', k.toplanmis ? 'diğer' : oku(k.kategori)),
      el('span', 'tut', lira(k.tutar))
    );
    liste.append(satir);
  }
  blok.append(liste);

  return blok;
}

// --- Hafta sütunları -----------------------------------------------------

function haftaBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-hafta');
  const gunler = H.sonGunler(veri.harcamalar, veri.kur, bugun, 7);
  const haftaToplam = gunler.reduce((t, g) => t + g.tutar, 0);
  const enBuyuk = Math.max(...gunler.map((g) => g.tutar), 1);

  const baslik = el('p', 'baslik');
  baslik.append('son yedi gün');
  const sag = el('span');
  sag.append(el('b', null, lira(haftaToplam)), ' lira');
  baslik.append(sag);
  blok.append(baslik);

  const grafik = el('div', 'hafta');
  grafik.setAttribute('role', 'img');
  grafik.setAttribute(
    'aria-label',
    `Son yedi günün harcaması: ${gunler.map((g) => `${g.gun} ${lira(g.tutar)} lira`).join(', ')}`
  );

  const etiketler = el('div', 'hafta-etiket');

  for (const g of gunler) {
    const bugunMu = g.gun === bugun;

    const kutu = el('div', 'hafta-gun');
    if (bugunMu) kutu.dataset.bugun = '';
    const sutun = el('div', 'sutun');
    // Boş gün de görünür bir taban bırakır; sıfır ile veri yokluğu ayrı şeyler.
    sutun.style.height = `${Math.max((g.tutar / enBuyuk) * 100, 2)}%`;
    kutu.append(sutun);
    grafik.append(kutu);

    const gunAdi = KISA_GUN[new Date(`${g.gun}T00:00:00`).getDay()];
    const etiket = el('span', null, gunAdi);
    if (bugunMu) etiket.dataset.bugun = '';
    etiketler.append(etiket);
  }

  blok.append(grafik, etiketler);
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
    const not = notMetni(onay, bekleniyor, seri);

    const dolu = onay && onay.durum === 'yapildi';
    const kacirildi = onay && onay.durum === 'yapilmadi';

    const dgm = el('button', 'satir');
    dgm.type = 'button';
    dgm.dataset.ana = t === ana ? 'evet' : 'hayir';
    dgm.dataset.dolu = dolu ? 'evet' : kacirildi ? 'kacirildi' : 'hayir';
    dgm.dataset.bekleniyor = !onay && bekleniyor ? 'evet' : 'hayir';
    dgm.setAttribute('aria-pressed', String(!!dolu));
    dgm.setAttribute('aria-label', `${t.ad}: ${not}`);

    const adSatiri = el('div', 'ad-satiri');
    adSatiri.append(el('span', 'isim', t.ad), el('span', 'not', not));

    const iz = el('div', 'iz');
    const gunler = H.aliskanlikIzi(t, veri.onaylar, bugun, IZ_GUN);
    const yapilan = gunler.filter((g) => g.durum === 'yapildi').length;
    iz.setAttribute('aria-hidden', 'true'); // durumu ad satırı zaten söylüyor
    iz.title = `Son ${IZ_GUN} günde ${yapilan} işaret`;
    for (const g of gunler) {
      const kare = el('i');
      kare.dataset.d = g.durum;
      iz.append(kare);
    }

    dgm.append(adSatiri, iz, el('span', 'kutu'));
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

/** İlk ekranın alt kenarındaki tek satır: yalnız sıradaki ödeme. */
function sonrakiOdeme(veri, bugun) {
  const blok = el('section', 'blok-sonraki');
  const satir = el('div', 'sonraki');
  satir.append(el('span', 'onek', 'SIRADAKİ'));

  // Pencere geniş: bir sonraki ödeme bu hafta olmayabilir ama yine de
  // sıradaki odur.
  const yaklasan = H.yaklasanOdemeler(veri.abonelikler, bugun, 40);

  if (yaklasan.length === 0) {
    const aktif = veri.abonelikler.filter((a) => a.aktif).length;
    satir.append(
      el('span', 'kim', aktif ? 'Yenileme günleri bilinmiyor' : 'Aktif abonelik yok')
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

// --- Katlamanın altı -----------------------------------------------------

/** Bugünün kalem kalem dökümü. Şerit "nereye", bu liste "tam olarak ne". */
function dokumBlogu(veri, bugun) {
  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);
  if (bugunku.length === 0) return null;

  const blok = el('section', 'alt-blok');
  const baslik = el('p', 'alt-baslik');
  baslik.append(
    el('b', null, String(bugunku.length)),
    el('span', null, 'kayıt, bugün')
  );
  blok.append(baslik);

  const sirali = bugunku
    .map((h) => ({ h, tl: H.tryeCevir(h.tutar, h.birim || 'TRY', veri.kur) }))
    .sort((a, b) => b.tl - a.tl);

  for (const x of sirali) {
    // Renk noktası, satırı yukarıdaki şeritteki segmentine bağlar.
    const nokta = el('span', 'nokta');
    nokta.style.background = renkDegiskeni(x.h.kategori);

    const satir = el('div', 'dokum');
    satir.append(
      el('span', 'saat', x.h.saat || ''),
      nokta,
      el('span', 'ad', kayitAdi(x.h)),
      el('span', 'tut', lira(x.tl))
    );
    blok.append(satir);
  }

  return blok;
}

function abonelikBlogu(veri, bugun) {
  const blok = el('section', 'alt-blok');
  const aktif = veri.abonelikler.filter((a) => a.aktif);

  const baslik = el('p', 'alt-baslik');
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
    const satir = el('div', 'dokum');
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
  // Karar: kararlar.md > Ana ekran saate göre yeniden sıralanır
  const aksam = simdi.getHours() >= AKSAM_ESIGI;
  const harcama = harcamaBlogu(veri, bugun);
  const hafta = haftaBlogu(veri, bugun);
  const aliskanlik = aliskanlikBlogu(veri, bugun, ciz);

  const ilkEkran = el('div', 'ilk-ekran');
  ilkEkran.append(
    ...(aksam ? [aliskanlik, harcama, hafta] : [harcama, hafta, aliskanlik]),
    sonrakiOdeme(veri, bugun)
  );

  const dokum = dokumBlogu(veri, bugun);

  ekran.dataset.kip = aksam ? 'aksam' : 'gunduz';
  ekran.replaceChildren(
    ilkEkran,
    ...(dokum ? [dokum] : []),
    abonelikBlogu(veri, bugun)
  );
  ekran.removeAttribute('aria-busy');
}

ciz();

// Gün dönünce ekran kendiliğinden yeni güne geçmeli; dakikada bir kontrol
// yeterli, daha sık çizmek görünür bir şey değiştirmez.
setInterval(ciz, 60000);
