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

/** Ayın tamamının ham TL toplamı. */
export function ayToplami(harcamalar, kur) {
  return toplamTL(harcamalar, kur);
}

/**
 * Ay başından bugüne günlük ortalama. Bölen, ayın geçen gün sayısıdır -
 * ay sonuna kadar olan günlere bölmek ortalamayı olduğundan küçük gösterir.
 */
export function gunlukOrtalama(harcamalar, kur, bugun) {
  const gecenGun = Number(bugun.slice(8, 10));
  if (!gecenGun) return 0;
  return toplamTL(harcamalar, kur) / gecenGun;
}

/**
 * Son `gunSayisi` günün günlük toplamları, eskiden yeniye.
 * Boş günler de listede yer alır - eksik sütun, sıfır harcamayla aynı şey
 * değildir ve haftanın ritmi ancak boş günlerle okunur.
 */
export function sonGunler(harcamalar, kur, bugun, gunSayisi = 7) {
  const cikti = [];
  for (let i = gunSayisi - 1; i >= 0; i--) {
    const gun = gunKaydir(bugun, -i);
    cikti.push({ gun, tutar: toplamTL(gununHarcamalari(harcamalar, gun), kur) });
  }
  return cikti;
}

/**
 * Bir alışkanlığın son `gunSayisi` gününün izi, eskiden yeniye.
 * Beş durum ayrılır; özellikle `kayitsiz` ile `yapilmadi` karıştırılmaz -
 * takip başlamadan önceki günleri kaçırılmış saymak, olmayan bir
 * başarısızlığı ekrana yazar.
 */
export function aliskanlikIzi(tanim, onaylar, bugun, gunSayisi = 14) {
  const ilkKayit = onaylar
    .filter((o) => o.aliskanlik === tanim.id)
    .map((o) => o.tarih)
    .sort()[0];

  const iz = [];
  for (let i = gunSayisi - 1; i >= 0; i--) {
    const gun = gunKaydir(bugun, -i);
    const onay = onayBul(onaylar, tanim.id, gun);

    let durum;
    if (onay) durum = onay.durum;
    else if (gun === bugun) durum = bugunBekleniyorMu(tanim, onaylar, gun) ? 'bekliyor' : 'beklenmiyor';
    else if (!ilkKayit || gun < ilkKayit) durum = 'kayitsiz';
    else durum = bugunBekleniyorMu(tanim, onaylar, gun) ? 'yapilmadi' : 'beklenmiyor';

    iz.push({ gun, durum });
  }
  return iz;
}

/**
 * Günün saat dilimlerine göre harcama. Saat alanı opsiyonel; saatsiz
 * kayıtlar hiçbir dilime girmez ve ayrı sayılır — bir dilime atmak,
 * bilinmeyen bir saati biliniyormuş gibi göstermek olurdu.
 *
 * Dilimler kullanıcının gününe göre: sabah işe/okula gidiş, öğle arası,
 * akşamüstü dönüş, gece. Eşit dört parçaya bölmek takvimsel olarak temiz
 * ama davranışsal olarak anlamsızdı.
 */
export const SAAT_DILIMLERI = [
  { ad: 'sabah', bas: 6, son: 12 },
  { ad: 'öğle', bas: 12, son: 17 },
  { ad: 'akşam', bas: 17, son: 22 },
  { ad: 'gece', bas: 22, son: 6 },
];

export function saatDagilimi(harcamalar, kur) {
  const kova = SAAT_DILIMLERI.map((d) => ({ ad: d.ad, tutar: 0, adet: 0 }));
  let saatsiz = 0;

  for (const h of harcamalar) {
    const dk = dakikaya(h.saat);
    if (dk === null) {
      saatsiz++;
      continue;
    }
    const saat = Math.floor(dk / 60);
    const i = SAAT_DILIMLERI.findIndex((d) =>
      d.bas < d.son ? saat >= d.bas && saat < d.son : saat >= d.bas || saat < d.son
    );
    if (i < 0) continue;
    kova[i].tutar += tryeCevir(h.tutar, h.birim || 'TRY', kur);
    kova[i].adet++;
  }

  return { dilimler: kova, saatsiz };
}

// --- Alışkanlık geçmişi -------------------------------------------------

/**
 * Tüm geçmişteki EN UZUN kesintisiz seri.
 *
 * `seriHesapla` bugünden geriye sayar ve "şu an ne durumdayım" sorusunu
 * cevaplar; bu ise "en iyi ne yapmıştım" sorusunu. İkisi ayrı sayı:
 * bugünkü seri kopmuş olabilir ama rekor durur.
 *
 * İzin verilen boşluk sıklığa bağlı — günlükte 1 gün, "2 günde bir"de
 * 2 gün. Aynı hesabı iki kez yazmamak için tek eşiğe indirildi.
 * Haftalık alışkanlıkta seri kavramı yok; 0 döner.
 */
export function enUzunSeri(tanim, onaylar) {
  const tip = tanim.siklik && tanim.siklik.tip;
  if (tip === 'haftalik') return 0;
  const izin = tip === 'gun-arasi' ? tanim.siklik.deger || 1 : 1;

  const gunler = onaylar
    .filter((o) => o.aliskanlik === tanim.id && o.durum === 'yapildi')
    .map((o) => o.tarih)
    .sort();

  let enUzun = 0;
  let mevcut = 0;
  let onceki = null;
  for (const g of gunler) {
    mevcut = onceki && gunFarki(g, onceki) <= izin ? mevcut + 1 : 1;
    if (mevcut > enUzun) enUzun = mevcut;
    onceki = g;
  }
  return enUzun;
}

/**
 * Haftanın günlerine göre tutturma oranı, pazartesi başlangıçlı.
 *
 * Payda BEKLENEN gün sayısı: kayıt tutulmamış günler ve alışkanlığın
 * beklenmediği günler hesaba girmez. "Cumartesi hep kaçırıyorum" ancak
 * cumartesi gerçekten beklendiği günlerle karşılaştırılınca söylenebilir.
 */
export function aliskanlikGunDagilimi(tanim, onaylar, bugun, gunSayisi) {
  const kova = Array.from({ length: 7 }, () => ({ yapildi: 0, beklenen: 0 }));

  for (const g of aliskanlikIzi(tanim, onaylar, bugun, gunSayisi)) {
    if (g.durum === 'kayitsiz' || g.durum === 'beklenmiyor') continue;
    const i = (new Date(g.gun + 'T00:00:00').getDay() + 6) % 7; // 0 = pazartesi
    kova[i].beklenen++;
    if (g.durum === 'yapildi') kova[i].yapildi++;
  }

  return kova.map((k, i) => ({
    gun: i,
    yapildi: k.yapildi,
    beklenen: k.beklenen,
    oran: k.beklenen > 0 ? k.yapildi / k.beklenen : null,
  }));
}

/**
 * İzin durum sayıları. `beklenmiyor` ve `kayitsiz` ayrı tutulur —
 * ikisini "yapılmadı"ya katmak, olmayan bir başarısızlığı sayıya yazar.
 */
export function izSayaci(iz) {
  const sayac = { yapildi: 0, yapilmadi: 0, bekliyor: 0, beklenmiyor: 0, kayitsiz: 0 };
  for (const g of iz) sayac[g.durum]++;
  return sayac;
}

// --- Ay penceresi -------------------------------------------------------

/** "2026-08" -> o ayın çektiği gün sayısı. */
export function aydaGun(ay) {
  const yil = Number(ay.slice(0, 4));
  const ayNo = Number(ay.slice(5, 7));
  return new Date(yil, ayNo, 0).getDate();
}

/**
 * Bir ayın KAÇ GÜNÜ geçti.
 * İçinde bulunulan ayda bugüne kadar, geçmiş ayda ayın tamamı, gelecek
 * ayda sıfır. Ortalamanın paydası budur; ay sonuna kadar olan günlere
 * bölmek ortalamayı olduğundan küçük gösterir.
 */
export function ayinGecenGunu(ay, bugun) {
  const buAy = bugun.slice(0, 7);
  if (ay === buAy) return Number(bugun.slice(8, 10));
  if (ay > buAy) return 0;
  return aydaGun(ay);
}

/**
 * Bir ayın günlük toplamları, 1'inden `gunSayisi`ye.
 * `sonGunler` bugünden GERİYE sayar ve geçmiş bir aya bakarken yanlış
 * pencere verir; bu ayın kendi takvimine bakar.
 */
export function ayinGunleri(harcamalar, kur, ay, gunSayisi) {
  const cikti = [];
  for (let i = 1; i <= gunSayisi; i++) {
    const gun = ay + '-' + String(i).padStart(2, '0');
    cikti.push({ gun, tutar: toplamTL(gununHarcamalari(harcamalar, gun), kur) });
  }
  return cikti;
}

/** Ay başından itibaren birikimli toplam, eskiden yeniye. */
export function birikimli(harcamalar, kur, ay, gunSayisi) {
  let t = 0;
  return ayinGunleri(harcamalar, kur, ay, gunSayisi).map((g) => {
    t += g.tutar;
    return { gun: g.gun, toplam: t };
  });
}

// --- Kırılımlar ---------------------------------------------------------

/**
 * Yere göre kırılım — kayıttaki `yer` alanı ("Migros", "Espressolab").
 *
 * Kategori "ne aldım" der, yer "nereye bıraktım" der; ikisi ayrı sorudur
 * ve aynı kayıtta ikisi de bulunabilir.
 *
 * `yer` alanı OPSİYONEL ve seyrek. Yeri yazılmamış kayıtlar bir yere
 * atanmaz, ayrı sayılır: eksik veriyi bir kutuya koymak, olmayan bir
 * bilgiyi varmış gibi gösterir.
 */
export function yerKirilimi(harcamalar, kur) {
  const toplamlar = new Map();
  let yersiz = 0;
  let yersizTutar = 0;

  for (const h of harcamalar) {
    const tl = tryeCevir(h.tutar, h.birim || 'TRY', kur);
    const ad = typeof h.yer === 'string' && h.yer.trim() ? h.yer.trim() : null;
    if (!ad) {
      yersiz++;
      yersizTutar += tl;
      continue;
    }
    const mevcut = toplamlar.get(ad) || { yer: ad, tutar: 0, adet: 0 };
    mevcut.tutar += tl;
    mevcut.adet++;
    toplamlar.set(ad, mevcut);
  }

  return {
    yerler: [...toplamlar.values()].sort((a, b) => b.tutar - a.tutar),
    yersiz,
    yersizTutar,
  };
}

/**
 * Haftanın günlerine göre ORTALAMA, pazartesi başlangıçlı.
 *
 * Toplam değil ortalama: ayda beş pazartesi dört cumartesi olabiliyor ve
 * toplam o eşitsizliği "pazartesi daha pahalı" diye okutur.
 */
export function haftaGunuDagilimi(harcamalar, kur, ay, gunSayisi) {
  const kova = Array.from({ length: 7 }, () => ({ toplam: 0, gunSayisi: 0 }));

  for (const g of ayinGunleri(harcamalar, kur, ay, gunSayisi)) {
    const haftaninGunu = new Date(g.gun + 'T00:00:00').getDay(); // 0 = pazar
    const i = (haftaninGunu + 6) % 7; // 0 = pazartesi
    kova[i].gunSayisi++;
    kova[i].toplam += g.tutar;
  }

  return kova.map((k, i) => ({
    gun: i,
    toplam: k.toplam,
    gunSayisi: k.gunSayisi,
    ortalama: k.gunSayisi > 0 ? k.toplam / k.gunSayisi : 0,
  }));
}

/** En büyük `n` kayıt, TL karşılığına göre. Döviz kaydı da doğru sıralanır. */
export function enBuyukler(harcamalar, kur, n = 5) {
  return harcamalar
    .map((h) => ({ kayit: h, tutar: tryeCevir(h.tutar, h.birim || 'TRY', kur) }))
    .sort((a, b) => b.tutar - a.tutar)
    .slice(0, n);
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
 * Ay içindeki ödeme dağılımı: her gün için o gün çıkan toplam.
 *
 * "Aylık 3.031 ₺" tek sayı olarak yükü gösteriyor ama ne zaman çıktığını
 * göstermiyor; ayın ilk haftasında 1.440 ₺ çıkması ile aya eşit yayılması
 * aynı toplamı verir, aynı şeyi yaşatmaz.
 *
 * Ayın çekmediği güne düşen yenileme son güne çekilir (31'i olmayan ayda
 * 31 -> 30), `sonrakiYenileme` ile aynı kural.
 *
 * YILLIK abonelikler takvimde YOK: veri modeli yalnız ayın gününü tutuyor,
 * hangi ayda çıktığını tutmuyor. Onları her aya koymak yılda bir çıkan bir
 * tutarı on iki kez göstermek olurdu; sayıları ayrıca döndürülüyor ki
 * ekran "takvimde görünmeyen N abonelik var" diyebilsin.
 */
export function odemeTakvimi(abonelikler, kur, ay) {
  const gunSayisi = aydaGun(ay);
  const gunler = Array.from({ length: gunSayisi }, (_, i) => ({
    gun: i + 1,
    tutar: 0,
    adlar: [],
  }));

  let takvimDisi = 0;
  let gunuBilinmeyen = 0;

  for (const a of abonelikler) {
    if (!a.aktif) continue;
    if (a.yenileme_gunu == null) {
      gunuBilinmeyen++;
      continue;
    }
    if (a.periyot === 'yillik') {
      takvimDisi++;
      continue;
    }
    const g = Math.min(a.yenileme_gunu, gunSayisi);
    gunler[g - 1].tutar += tryeCevir(a.tutar, a.birim || 'TRY', kur);
    gunler[g - 1].adlar.push(a.ad);
  }

  return { gunler, takvimDisi, gunuBilinmeyen };
}

/** Aktif aboneliklerin yıllık karşılığı. Ham TL. */
export function yillikAbonelikToplami(abonelikler, kur) {
  return aylikAbonelikToplami(abonelikler, kur) * 12;
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
