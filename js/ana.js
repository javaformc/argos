// Ana ekran. Veriyi kaynaktan alır, hesabı hesap.js'e bırakır, DOM'u kurar.
// Burada hesap yapılmaz; burada yalnız gösterim kararı verilir.

import * as H from './hesap.js';
import { yerelKaynak, veriYukle, onayIsaretle } from './veri.js';

const AKSAM_ESIGI = 22; // kararlar.md > Ana ekran saate göre yeniden sıralanır
const EN_AZ_ARALIK = 42; // iki kayıt arasındaki asgari dikey mesafe (px)

// Eksen yüksekliği stil.css'te tanımlıdır ve buradan okunur. İki yerde ayrı
// yazılınca sessizce ayrıştı: JS 448'e göre konumlandırırken kutu 408'di ve
// son saat etiketi toplamın üstüne taştı.
const EKSEN_H =
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--eksen-h')) ||
  408;

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
  ulasim: 'ulaşım',
  saglik: 'sağlık',
  egitim: 'eğitim',
  eglence: 'eğlence',
  diger: 'diğer',
  'elektronik-parca': 'elektronik parça',
  'spor-salonu': 'spor salonu',
  dogalgaz: 'doğalgaz',
  yazilim: 'yazılım',
  tatli: 'tatlı',
  kirtasiye: 'kırtasiye',
};

const oku = (k) => KATEGORI_ADI[k] || k;

/** Bir harcamayı tek satırda anlatır: yer varsa yer, yoksa kategori. */
function kayitAdi(h) {
  const alt = h.alt ? oku(h.alt) : null;
  const kat = oku(h.kategori);
  if (h.yer) return alt ? `${h.yer}, ${alt}` : `${h.yer}, ${kat}`;
  return alt ? `${kat}, ${alt}` : kat;
}

// --- Zaman ekseni --------------------------------------------------------

const yuzde = (dakika) => (dakika / 1440) * EKSEN_H;

/**
 * Günü çizer: saat etiketleri, harcamalar kendi saatinde, "şu an" çizgisi.
 *
 * Aynı saate yakın düşen kayıtlar üst üste binerdi; her kayıt bir öncekinden
 * en az EN_AZ_ARALIK kadar aşağıda durmaya zorlanır. Sıra korunur, sadece
 * konum kaydırılır.
 */
function gunEkseni(harcamalar, kur, simdi, bugunMu) {
  const gun = el('div', 'gun');

  for (let s = 0; s <= 24; s += 3) {
    const etiket = el('span', 'saat-etiket', String(s).padStart(2, '0'));
    etiket.style.top = `${yuzde(s * 60)}px`;
    gun.append(etiket);
  }

  const saatli = harcamalar
    .map((h) => ({ h, dk: H.dakikaya(h.saat) }))
    .filter((x) => x.dk !== null)
    .sort((a, b) => a.dk - b.dk);

  let oncekiUst = -Infinity;
  saatli.forEach((x, i) => {
    const ust = Math.min(
      Math.max(yuzde(x.dk), oncekiUst + EN_AZ_ARALIK),
      EKSEN_H - 18
    );
    oncekiUst = ust;

    const satir = el('div', 'kayit');
    satir.style.top = `${ust}px`;
    satir.style.animationDelay = `${i * 45}ms`;
    satir.append(
      el('span', 'tutar', H.bicimle(H.gosterimTL(x.h.tutar, x.h.birim || 'TRY', kur))),
      el('span', 'nerede', kayitAdi(x.h)),
      el('span', 'ne-zaman', x.h.saat)
    );
    gun.append(satir);
  });

  if (harcamalar.length === 0) {
    gun.append(
      el(
        'p',
        'gun-bos',
        bugunMu
          ? 'Gün henüz yazılmadı. Akşam özetinde anlattığın her şey buraya düşer.'
          : 'Bu güne kayıt girilmemiş.'
      )
    );
  }

  if (bugunMu) {
    // Eksenin geçmiş kısmı dolar; ucu şu andadır.
    const dk = simdi.getHours() * 60 + simdi.getMinutes();
    const gecen = el('div', 'simdi');
    gecen.style.height = `${yuzde(dk)}px`;
    gecen.setAttribute('role', 'img');
    gecen.setAttribute(
      'aria-label',
      `Saat ${String(simdi.getHours()).padStart(2, '0')}:${String(simdi.getMinutes()).padStart(2, '0')}`
    );
    gun.append(gecen);
  }

  return gun;
}

function gunBlogu(veri, bugun, simdi) {
  const blok = el('section', 'blok blok-gun');
  const bugunku = H.gununHarcamalari(veri.harcamalar, bugun);

  blok.append(gunEkseni(bugunku, veri.kur, simdi, true));

  const toplam = el('div', 'toplam');
  toplam.append(
    el('b', null, H.bicimle(H.yuvarla(H.toplamTL(bugunku, veri.kur)))),
    el('span', 'birim', 'lira, bugün')
  );

  // Saati olmayan kayıtlar eksende yerini bulamaz. Toplama girerler ama
  // sayıyı sessizce şişirmemeleri için kaç tane oldukları söylenir.
  const saatsiz = bugunku.filter((h) => H.dakikaya(h.saat) === null).length;
  if (saatsiz > 0) {
    toplam.append(
      el(
        'span',
        'saatsiz',
        `${saatsiz} kaydın saati yok, eksende görünmüyor`
      )
    );
  }

  blok.append(toplam);
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
  const birim = tanim.siklik && tanim.siklik.tip === 'gun-arasi' ? 'tur' : 'gün';
  return `${seri} ${birim} kesintisiz`;
}

function durumCumlesi(onay, bekleniyor, seri) {
  if (onay && onay.durum === 'yapildi') {
    return seri ? ['bugün işaretlendi, ', seri] : ['bugün işaretlendi', ''];
  }
  if (onay && onay.durum === 'yapilmadi') return ['bugün kaçırıldı', ''];
  if (!bekleniyor) return ['bugün serbest, sıradaki tur yarın', ''];
  return seri ? ['bugün bekleniyor, ', seri] : ['bugün bekleniyor', ''];
}

function aliskanlikBlogu(veri, bugun, yenile) {
  const blok = el('section', 'blok blok-aliskanlik');
  const tanimlar = veri.tanimlar;

  if (tanimlar.length === 0) {
    blok.append(el('p', 'ana-durum', 'Tanımlı alışkanlık yok. Claude ekleyebilir.'));
    return blok;
  }

  const ana = tanimlar.find((t) => t.ana) || tanimlar[0];
  const digerleri = tanimlar.filter((t) => t !== ana);

  const onay = H.onayBul(veri.onaylar, ana.id, bugun);
  const bekleniyor = H.bugunBekleniyorMu(ana, veri.onaylar, bugun);
  const dolu = !!onay && onay.durum === 'yapildi';

  const satir = el('div', 'ana-satir');
  satir.append(el('h2', 'ana-ad', ana.ad));

  // Buton adı duruma göre değişmez. Bir kontrolün adı ne yaptığını söyler;
  // yapılıp yapılmadığını dolu/boş hali ve alttaki cümle söyler.
  const dugme = el('button', 'basilir', 'yaptım');
  dugme.type = 'button';
  dugme.dataset.dolu = dolu ? 'evet' : 'hayir';
  dugme.setAttribute('aria-pressed', String(dolu));
  dugme.addEventListener('click', () => isaretle(dugme, veri, ana, bugun, yenile));
  satir.append(dugme);
  blok.append(satir);

  const [bas, vurgu] = durumCumlesi(onay, bekleniyor, seriMetni(ana, veri.onaylar, bugun));
  const cumle = el('p', 'ana-durum', bas);
  if (vurgu) cumle.append(el('b', null, vurgu));
  blok.append(cumle);

  if (digerleri.length) {
    const liste = el('ul', 'yan-liste');
    for (const t of digerleri) {
      const o = H.onayBul(veri.onaylar, t.id, bugun);
      const d = !!o && o.durum === 'yapildi';

      const dgm = el('button', 'yan');
      dgm.type = 'button';
      dgm.dataset.dolu = d ? 'evet' : 'hayir';
      dgm.setAttribute('aria-pressed', String(d));
      dgm.append(el('span', 'halka'), el('span', 'yan-ad', t.ad));

      const s = seriMetni(t, veri.onaylar, bugun);
      if (s) dgm.append(el('span', 'yan-not', s));

      dgm.addEventListener('click', () => isaretle(dgm, veri, t, bugun, yenile));

      const li = el('li');
      li.append(dgm);
      liste.append(li);
    }
    blok.append(liste);
  }

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

function abonelikBlogu(veri, bugun) {
  const blok = el('section', 'blok blok-abonelik');
  const aktif = veri.abonelikler.filter((a) => a.aktif);

  const toplam = el('p', 'abone-toplam');
  toplam.append(
    el('b', null, H.bicimle(H.yuvarla(H.aylikAbonelikToplami(veri.abonelikler, veri.kur)))),
    el('span', null, `lira aylık abonelik, ${aktif.length} adet`)
  );
  blok.append(toplam);

  if (aktif.length === 0) {
    blok.append(el('p', 'ana-durum', 'Aktif abonelik yok.'));
    return blok;
  }

  for (const y of H.yaklasanOdemeler(veri.abonelikler, bugun, 7)) {
    const satir = el('div', 'abone-satir');
    satir.append(el('span', null, y.abonelik.ad));
    satir.append(
      el('span', 'ne-zaman', y.kalanGun === 0 ? 'bugün ödenecek' : `${y.kalanGun} gün sonra`)
    );
    blok.append(satir);
  }

  // Yenileme günü bilinmeyeni saklamak yerine söyle: eksik veri ekranda da
  // eksik görünmeli, tahmin üretmek yanlış güven verir.
  const bilinmeyen = aktif.filter((a) => a.yenileme_gunu == null);
  if (bilinmeyen.length) {
    blok.append(
      el(
        'p',
        'dipnot',
        `Yenileme günü bilinmiyor: ${bilinmeyen.map((a) => a.ad).join(', ')}.`
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

  document.getElementById('gun-no').textContent = String(simdi.getDate());
  document.getElementById('gun-ad').textContent =
    `${AYLAR[simdi.getMonth()]}, ${GUNLER[simdi.getDay()]}`;

  let veri;
  try {
    veri = await veriYukle(kaynak, bugun);
  } catch (hata) {
    hataGoster(hata, 'Veri okunamadı. Geliştirme sunucusu çalışıyor mu?');
    return;
  }

  // Gündüz gün akışı önce gelir, akşam (22:00 sonrası) alışkanlık öne çıkar.
  // Sıra CSS order ile değil burada kurulur: bölüm ayracı DOM sırasına
  // bakar, order kullanılınca ayraç yanlış bloğun üstünde çıkıyordu.
  // Karar: kararlar.md > Ana ekran saate göre yeniden sıralanır
  const aksam = simdi.getHours() >= AKSAM_ESIGI;
  const gun = gunBlogu(veri, bugun, simdi);
  const aliskanlik = aliskanlikBlogu(veri, bugun, ciz);

  ekran.dataset.kip = aksam ? 'aksam' : 'gunduz';
  ekran.replaceChildren(
    ...(aksam ? [aliskanlik, gun] : [gun, aliskanlik]),
    abonelikBlogu(veri, bugun)
  );
  ekran.removeAttribute('aria-busy');
}

ciz();

// Gün ilerledikçe "şu an" çizgisi de ilerlemeli. Dakikada bir yeniden
// çizmek yeterli; daha sık çizmek görünür bir şey değiştirmez.
setInterval(ciz, 60000);
