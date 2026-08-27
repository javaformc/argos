// Ana ekran. Veriyi kaynaktan alır, hesabı hesap.js'e bırakır, DOM'u kurar.
// Burada hesap yapılmaz; burada yalnız gösterim kararı verilir.

import * as H from './hesap.js';
import { yerelKaynak, veriYukle, onayIsaretle } from './veri.js';

const AKSAM_ESIGI = 22; // kararlar.md > Ana ekran saate göre yeniden sıralanır
const NOBET_GUN = 14;

const ekran = document.getElementById('ekran');
const kaynak = yerelKaynak();

const el = (etiket, sinif, metin) => {
  const d = document.createElement(etiket);
  if (sinif) d.className = sinif;
  if (metin != null) d.textContent = metin;
  return d;
};

const KATEGORI_ADI = {
  'yeme-icme': 'yeme içme',
  'kisisel-bakim': 'kişisel bakım',
  ulasim: 'ulaşım',
  saglik: 'sağlık',
  egitim: 'eğitim',
  eglence: 'eğlence',
  diger: 'diğer',
};

const kategoriAdi = (k) => KATEGORI_ADI[k] || k;

const GUNLER = ['paz', 'pzt', 'sal', 'çar', 'per', 'cum', 'cmt'];
const AYLAR = [
  'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran',
  'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık',
];

function tarihYaz(d) {
  return `${GUNLER[d.getDay()]} ${d.getDate()} ${AYLAR[d.getMonth()]}`;
}

// --- Nöbet şeridi --------------------------------------------------------

/**
 * Son NOBET_GUN günün her biri için bir çentik.
 * Çentik dört durumdan birini anlatır: yapıldı, kaçırıldı, beklenmiyor,
 * (yalnız bugün için) bekliyor.
 */
function nobetSeridi(tanim, onaylar, bugun) {
  const seritKutu = el('div', 'nobet');
  seritKutu.setAttribute('role', 'img');

  // Takibin başladığı gün. Öncesinde kayıt YOK demek, kaçırıldı demek değil —
  // ikisini aynı göstermek olmayan bir başarısızlığı ekrana yazar.
  const ilkKayit = onaylar
    .filter((o) => o.aliskanlik === tanim.id)
    .map((o) => o.tarih)
    .sort()[0];

  let yapilan = 0;
  for (let i = NOBET_GUN - 1; i >= 0; i--) {
    const gun = H.gunKaydir(bugun, -i);
    const onay = H.onayBul(onaylar, tanim.id, gun);

    let durum;
    if (onay) {
      durum = onay.durum;
      if (onay.durum === 'yapildi') yapilan++;
    } else if (gun === bugun) {
      durum = H.bugunBekleniyorMu(tanim, onaylar, bugun) ? 'bekliyor' : 'beklenmiyor';
    } else if (!ilkKayit || gun < ilkKayit) {
      durum = 'kayitsiz';
    } else {
      // Geçmiş bir gün için beklenip beklenmediği o günün kendi durumundan çıkar.
      durum = H.bugunBekleniyorMu(tanim, onaylar, gun) ? 'yapilmadi' : 'beklenmiyor';
    }

    const centik = el('span', 'centik');
    centik.dataset.durum = durum;
    if (gun === bugun) centik.dataset.bugun = '';
    centik.style.animationDelay = `${(NOBET_GUN - 1 - i) * 32}ms`;
    seritKutu.append(centik);
  }

  seritKutu.setAttribute(
    'aria-label',
    `Son ${NOBET_GUN} günün nöbeti: ${yapilan} gün işaretli`
  );
  return seritKutu;
}

// --- Alışkanlık bölümü ---------------------------------------------------

function seriMetni(tanim, onaylar, bugun) {
  if (tanim.siklik?.tip === 'haftalik') {
    const d = H.haftalikDurum(tanim, onaylar, bugun);
    return { sayi: `${d.yapilan}/${d.hedef}`, etiket: 'bu hafta' };
  }
  const seri = H.seriHesapla(tanim, onaylar, bugun);
  if (seri === 0) return null;
  return {
    sayi: String(seri),
    etiket: tanim.siklik?.tip === 'gun-arasi' ? 'tur kesintisiz' : 'gün kesintisiz',
  };
}

function durumMetni(tanim, onay, bekleniyor) {
  if (onay?.durum === 'yapildi') return 'bugün işaretlendi';
  if (onay?.durum === 'yapilmadi') return 'bugün kaçırıldı';
  if (!bekleniyor) return 'bugün serbest — sıradaki tur yarın';
  return 'bugün bekleniyor';
}

function aliskanlikBolumu(veri, bugun, yenile) {
  const bolum = el('section', 'bolum bolum-aliskanlik');
  const tanimlar = veri.tanimlar;

  if (tanimlar.length === 0) {
    bolum.append(el('h2', 'baslik', 'Alışkanlık'));
    bolum.append(el('p', 'bos', 'Tanımlı alışkanlık yok. Claude ekleyebilir.'));
    return bolum;
  }

  const ana = tanimlar.find((t) => t.ana) || tanimlar[0];
  const digerleri = tanimlar.filter((t) => t !== ana);

  const anaOnay = H.onayBul(veri.onaylar, ana.id, bugun);
  const anaBekleniyor = H.bugunBekleniyorMu(ana, veri.onaylar, bugun);
  const isaretli = anaOnay?.durum === 'yapildi';

  bolum.append(el('h2', 'baslik', 'Nöbet'));
  bolum.append(nobetSeridi(ana, veri.onaylar, bugun));
  bolum.append(el('h3', 'ana-ad', ana.ad));

  const durum = el('p', 'ana-durum', durumMetni(ana, anaOnay, anaBekleniyor));
  durum.dataset.bekleniyor = anaBekleniyor && !anaOnay ? 'evet' : 'hayir';
  bolum.append(durum);

  // Buton adı duruma göre DEĞİŞMEZ. Bir kontrolün adı ne yaptığını söyler;
  // yapılıp yapılmadığını dolu/boş hali ve üstteki durum satırı söyler.
  const dugme = el('button', 'isaret', 'Yaptım');
  dugme.type = 'button';
  dugme.dataset.isaretli = isaretli ? 'evet' : 'hayir';
  dugme.setAttribute('aria-pressed', String(isaretli));
  dugme.addEventListener('click', () => isaretleVeCiz(dugme, veri, ana, bugun, yenile));
  bolum.append(dugme);

  const seri = seriMetni(ana, veri.onaylar, bugun);
  if (seri) {
    const p = el('p', 'seri');
    p.append(el('b', null, seri.sayi), ` ${seri.etiket}`);
    bolum.append(p);
  }

  if (digerleri.length) {
    const liste = el('ul', 'yan-liste');
    for (const t of digerleri) {
      const onay = H.onayBul(veri.onaylar, t.id, bugun);
      const dolu = onay?.durum === 'yapildi';

      const dgm = el('button', 'yan');
      dgm.type = 'button';
      dgm.dataset.isaretli = dolu ? 'evet' : 'hayir';
      dgm.setAttribute('aria-pressed', String(dolu));
      dgm.append(el('span', 'kutu'), el('span', 'yan-ad', t.ad));

      const s = seriMetni(t, veri.onaylar, bugun);
      if (s) dgm.append(el('span', 'yan-not', `${s.sayi} ${s.etiket}`));

      dgm.addEventListener('click', () => isaretleVeCiz(dgm, veri, t, bugun, yenile));

      const satir = el('li');
      satir.append(dgm);
      liste.append(satir);
    }
    bolum.append(liste);
  }

  return bolum;
}

/** Tek tuş işaretleme. Yazma başarısızsa ekran eski haline döner. */
async function isaretleVeCiz(dugme, veri, tanim, bugun, yenile) {
  const suAn = H.onayBul(veri.onaylar, tanim.id, bugun);
  const yeniDurum = suAn?.durum === 'yapildi' ? 'yapilmadi' : 'yapildi';

  dugme.disabled = true;
  try {
    await onayIsaretle(kaynak, veri, tanim.id, bugun, yeniDurum);
    yenile();
  } catch (hata) {
    dugme.disabled = false;
    hataGoster(hata, 'İşaret kaydedilemedi.');
  }
}

// --- Harcama bölümü ------------------------------------------------------

function harcamaBolumu(veri, bugun) {
  const bolum = el('section', 'bolum bolum-harcama');
  bolum.append(el('h2', 'baslik', 'Bugün'));

  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);

  if (bugunku.length === 0) {
    bolum.append(el('p', 'bos', 'Bugün için kayıt yok. Akşam özetinde anlatınca düşer.'));
    return bolum;
  }

  const toplamHam = H.toplamTL(bugunku, veri.kur);
  const tutar = el('p', 'tutar', H.bicimle(H.yuvarla(toplamHam)));
  tutar.append(el('span', 'simge', '₺'));
  bolum.append(tutar);

  const kirilim = H.kategoriKirilimi(bugunku, veri.kur);
  const liste = el('ul', 'kirilim');
  for (const k of kirilim) {
    const li = el('li');
    li.style.setProperty('--pay', `${Math.round((k.tutar / toplamHam) * 100)}%`);
    li.append(
      el('span', 'ad', kategoriAdi(k.kategori)),
      el('span', 'deger', `${H.bicimle(H.yuvarla(k.tutar))} ₺`)
    );
    liste.append(li);
  }
  bolum.append(liste);

  return bolum;
}

// --- Abonelik bölümü -----------------------------------------------------

function abonelikBolumu(veri, bugun) {
  const bolum = el('section', 'bolum bolum-abonelik');
  const aktif = veri.abonelikler.filter((a) => a.aktif);

  const ust = el('div', 'abone-ust');
  ust.append(el('h2', 'baslik', 'Abonelik'));

  const toplam = el('p', 'abone-toplam');
  toplam.append(
    H.bicimle(H.yuvarla(H.aylikAbonelikToplami(veri.abonelikler, veri.kur))),
    el('span', null, ' ₺/ay')
  );
  ust.append(toplam);
  bolum.append(ust);

  if (aktif.length === 0) {
    bolum.append(el('p', 'bos', 'Aktif abonelik yok.'));
    return bolum;
  }

  const yaklasan = H.yaklasanOdemeler(veri.abonelikler, bugun, 7);
  for (const y of yaklasan) {
    const satir = el('div', 'uyari');
    satir.append(el('span', null, y.abonelik.ad));
    satir.append(
      el('span', 'kalan', y.kalanGun === 0 ? 'bugün' : `${y.kalanGun} gün sonra`)
    );
    bolum.append(satir);
  }

  // Yenileme günü bilinmeyenleri saklamak yerine söyle: eksik veri, ekranda
  // eksik görünmeli. Tahmin üretmek yanlış güven verir.
  const bilinmeyen = aktif.filter((a) => a.yenileme_gunu == null);
  if (bilinmeyen.length) {
    bolum.append(
      el(
        'p',
        'belirsiz',
        `${bilinmeyen.length} aboneliğin yenileme günü bilinmiyor: ` +
          bilinmeyen.map((a) => a.ad).join(', ')
      )
    );
  } else if (yaklasan.length === 0) {
    bolum.append(el('p', 'bos', 'Bu hafta ödeme yok.'));
  }

  return bolum;
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
  document.getElementById('tarih').textContent = tarihYaz(simdi);

  let veri;
  try {
    veri = await veriYukle(kaynak, bugun);
  } catch (hata) {
    hataGoster(hata, 'Veri okunamadı. Geliştirme sunucusu çalışıyor mu?');
    return;
  }

  ekran.dataset.kip = simdi.getHours() >= AKSAM_ESIGI ? 'aksam' : 'gunduz';
  ekran.replaceChildren(
    aliskanlikBolumu(veri, bugun, ciz),
    harcamaBolumu(veri, bugun),
    abonelikBolumu(veri, bugun)
  );
  ekran.removeAttribute('aria-busy');
}

ciz();
