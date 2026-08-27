// Saf hesap çekirdeği. DOM'a, ağa, sistem saatine dokunmaz — "bugün" hep
// parametre olarak girer. Bu sayede Node'da test edilebilir ve veri modeli
// Jarvis'e taşınabilir kalır.
// Kurallar: C:\ws\projeler\Argos\kararlar.md

// --- Para ---------------------------------------------------------------

/**
 * Gösterim yuvarlaması: her zaman en yakın ÜST tam sayı.
 * Ham veri asla yuvarlanmaz; bu yalnız ekrana giden sayı içindir.
 */
export function yuvarla(tutar) {
  return Math.ceil(tutar);
}

/** Ham tutarı TRY'ye çevirir. Yuvarlamaz. */
export function tryeCevir(tutar, birim, kur) {
  if (birim === 'TRY') return tutar;
  const oran = kur[birim];
  if (typeof oran !== 'number') {
    throw new Error('kur.json içinde ' + birim + ' yok');
  }
  return tutar * oran;
}

/** Çevir + yuvarla. Ekrana giden tek yol bu olmalı. */
export function gosterimTL(tutar, birim, kur) {
  return yuvarla(tryeCevir(tutar, birim, kur));
}

/** 1234 -> "1.234" */
export function bicimle(tamSayi) {
  return tamSayi.toLocaleString('tr-TR');
}

// --- Tarih --------------------------------------------------------------

/** Date -> "2026-08-27" (yerel saat; UTC'ye çevirmeden, gün kaymasın diye) */
export function gunAnahtari(d) {
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + ay + '-' + gun;
}

/** Date -> "2026-08" */
export function ayAnahtari(d) {
  return gunAnahtari(d).slice(0, 7);
}

/** İki gün anahtarı arasındaki tam gün farkı (a - b). */
export function gunFarki(a, b) {
  const ms = Date.parse(a + 'T00:00:00') - Date.parse(b + 'T00:00:00');
  return Math.round(ms / 86400000);
}

/**
 * "14:30" -> 870 (gün başından beri geçen dakika).
 * Saat alanı opsiyoneldir; geçersiz veya eksikse null döner ve kayıt
 * zaman ekseninde değil, saatsizler arasında gösterilir.
 */
export function dakikaya(saat) {
  if (typeof saat !== 'string') return null;
  const e = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(saat.trim());
  if (!e) return null;
  return Number(e[1]) * 60 + Number(e[2]);
}

/** Gün anahtarını n gün ileri (negatifse geri) kaydırır. */
export function gunKaydir(anahtar, n) {
  const d = new Date(anahtar + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return gunAnahtari(d);
}

// --- Alışkanlık onayı ---------------------------------------------------

/**
 * Claude'un ve Argos'un yazdığı onay listelerini birleştirir.
 * Aynı gün + aynı alışkanlık iki listede de varsa DAMGASI YENİ OLAN kazanır.
 * Karar: kararlar.md > Alışkanlık onayı senkronu
 */
export function onaylariBirlestir(...listeler) {
  const kazanan = new Map();
  for (const liste of listeler) {
    for (const kayit of liste || []) {
      const anahtar = kayit.tarih + '|' + kayit.aliskanlik;
      const mevcut = kazanan.get(anahtar);
      if (!mevcut || kayit.damga > mevcut.damga) kazanan.set(anahtar, kayit);
    }
  }
  return [...kazanan.values()].sort(
    (a, b) =>
      a.tarih.localeCompare(b.tarih) || a.aliskanlik.localeCompare(b.aliskanlik)
  );
}

/** Belirli gün + alışkanlık için onay kaydı (yoksa null). */
export function onayBul(onaylar, aliskanlikId, gun) {
  return onaylar.find((o) => o.aliskanlik === aliskanlikId && o.tarih === gun) || null;
}

/** Bugün dahil, geriye doğru en son "yapildi" işaretli gün (yoksa null). */
export function sonYapildiGunu(onaylar, aliskanlikId, bugun) {
  let enSon = null;
  for (const o of onaylar) {
    if (o.aliskanlik !== aliskanlikId || o.durum !== 'yapildi') continue;
    if (o.tarih > bugun) continue;
    if (!enSon || o.tarih > enSon) enSon = o.tarih;
  }
  return enSon;
}

/** Pazartesi başlangıçlı haftada kaç kez yapıldı. */
export function haftalikDurum(tanim, onaylar, bugun) {
  const d = new Date(bugun + 'T00:00:00');
  const pazartesiFarki = (d.getDay() + 6) % 7;
  const haftaBasi = gunKaydir(bugun, -pazartesiFarki);
  const yapilan = onaylar.filter(
    (o) =>
      o.aliskanlik === tanim.id &&
      o.durum === 'yapildi' &&
      o.tarih >= haftaBasi &&
      o.tarih <= bugun
  ).length;
  return { haftaBasi, yapilan, hedef: (tanim.siklik && tanim.siklik.deger) || 0 };
}

/**
 * Bu alışkanlık bugün bekleniyor mu?
 * - gunluk    : her gün
 * - gun-arasi : son "yapildi" gününden bu yana >= deger gün geçtiyse
 * - haftalik  : bu haftaki hedef sayıya ulaşılmadıysa
 */
export function bugunBekleniyorMu(tanim, onaylar, bugun) {
  const tip = tanim.siklik && tanim.siklik.tip;
  if (tip === 'gun-arasi') {
    const son = sonYapildiGunu(onaylar, tanim.id, bugun);
    if (!son) return true;
    return gunFarki(bugun, son) >= tanim.siklik.deger;
  }
  if (tip === 'haftalik') {
    return haftalikDurum(tanim, onaylar, bugun).yapilan < tanim.siklik.deger;
  }
  return true; // gunluk ve tanımsız tip
}

/**
 * Kesintisiz seri.
 * "gun-arasi" için sayılan ardışık gün değil, kaçırılmamış TUR sayısıdır.
 * Bugün henüz işaretlenmediyse seri bozulmaz — dünden geriye sayılır.
 */
export function seriHesapla(tanim, onaylar, bugun) {
  const tip = tanim.siklik && tanim.siklik.tip;
  const yapildiMi = (gun) => {
    const o = onayBul(onaylar, tanim.id, gun);
    return !!o && o.durum === 'yapildi';
  };

  if (tip === 'gun-arasi') {
    const aralik = tanim.siklik.deger;
    let gun = sonYapildiGunu(onaylar, tanim.id, bugun);
    if (!gun) return 0;
    // Son işaret çoktan bayatladıysa seri bugün itibarıyla kopmuştur.
    if (gunFarki(bugun, gun) > aralik) return 0;
    let seri = 1;
    for (;;) {
      const oncekiler = onaylar
        .filter(
          (o) => o.aliskanlik === tanim.id && o.durum === 'yapildi' && o.tarih < gun
        )
        .map((o) => o.tarih)
        .sort();
      const onceki = oncekiler[oncekiler.length - 1];
      if (!onceki || gunFarki(gun, onceki) > aralik) break;
      seri++;
      gun = onceki;
    }
    return seri;
  }

  if (tip === 'haftalik') {
    return 0; // seri yerine haftalık sayaç gösterilir
  }

  // gunluk
  let seri = 0;
  let gun = yapildiMi(bugun) ? bugun : gunKaydir(bugun, -1);
  while (yapildiMi(gun)) {
    seri++;
    gun = gunKaydir(gun, -1);
  }
  return seri;
}

// --- Harcama ------------------------------------------------------------

/** Verilen günün kayıtları. */
export function gununHarcamalari(harcamalar, gun) {
  return harcamalar.filter((h) => h.tarih === gun);
}

/** TL cinsinden HAM toplam. Yuvarlama gösterimde yapılır. */
export function toplamTL(harcamalar, kur) {
  return harcamalar.reduce((t, h) => t + tryeCevir(h.tutar, h.birim || 'TRY', kur), 0);
}

/** Kategoriye göre kırılım, büyükten küçüğe. Ham TL. */
export function kategoriKirilimi(harcamalar, kur) {
  const toplamlar = new Map();
  for (const h of harcamalar) {
    const tl = tryeCevir(h.tutar, h.birim || 'TRY', kur);
    toplamlar.set(h.kategori, (toplamlar.get(h.kategori) || 0) + tl);
  }
  return [...toplamlar.entries()]
    .map(([kategori, tutar]) => ({ kategori, tutar }))
    .sort((a, b) => b.tutar - a.tutar);
}

// --- Abonelik -----------------------------------------------------------

/** Aylık gider karşılığı (yıllık olan 12'ye bölünür). Ham TL. */
export function aylikGider(abonelik, kur) {
  const tl = tryeCevir(abonelik.tutar, abonelik.birim || 'TRY', kur);
  return abonelik.periyot === 'yillik' ? tl / 12 : tl;
}

/** Aktif aboneliklerin aylık toplamı. Ham TL. */
export function aylikAbonelikToplami(abonelikler, kur) {
  return abonelikler
    .filter((a) => a.aktif)
    .reduce((t, a) => t + aylikGider(a, kur), 0);
}

/**
 * Bir sonraki yenileme tarihi.
 * yenileme_gunu null ise BİLİNMİYOR demektir — tahmin üretilmez, null döner.
 * Veri belirsizliği ekranda da belirsiz kalmalı.
 */
export function sonrakiYenileme(abonelik, bugun) {
  const gun = abonelik.yenileme_gunu;
  if (gun == null) return null;

  const parcalar = bugun.split('-');
  const yil = Number(parcalar[0]);
  const ay = Number(parcalar[1]);

  const ayda = (y, a) => {
    const sonGun = new Date(y, a, 0).getDate(); // o ayın kaç gün çektiği
    const g = Math.min(gun, sonGun);
    return y + '-' + String(a).padStart(2, '0') + '-' + String(g).padStart(2, '0');
  };

  const buAy = ayda(yil, ay);
  if (buAy >= bugun) return buAy;
  return ay === 12 ? ayda(yil + 1, 1) : ayda(yil, ay + 1);
}

/** Önümüzdeki `pencere` gün içinde ödemesi gelen abonelikler, yakından uzağa. */
export function yaklasanOdemeler(abonelikler, bugun, pencere = 7) {
  return abonelikler
    .filter((a) => a.aktif)
    .map((a) => ({ abonelik: a, tarih: sonrakiYenileme(a, bugun) }))
    .filter((x) => x.tarih && gunFarki(x.tarih, bugun) <= pencere)
    .map((x) => ({ ...x, kalanGun: gunFarki(x.tarih, bugun) }))
    .sort((a, b) => a.kalanGun - b.kalanGun);
}
