// Vault kopyası üretici.
//
// Argos'un verisi 30-08-2026'da Drive'ın dışına çıktı ve bunun bir bedeli
// oldu: telefondaki Claude (normal uygulama, Drive'ı okuyor) harcamayı
// artık göremiyor. Sayıyı Argos gösteriyor ama YORUMLAMIYOR — "geçen aya
// göre nasıl" sorusu cevapsız kaldı.
//
// Bu script o boşluğu kapatır: kaynaktan okur, vault'a TÜRETİLMİŞ bir
// kopya yazar.
//
//   C:\MY_Code\argos-veri   kaynak, tek yazan Claude Code + Argos
//   C:\ws\veri\             kopya, kimse yazmaz, yalnız okunur
//
// Yön TEK. Kopyaya yazılırsa bir sonraki çalıştırmada üzerine yazılır ve
// yazılan şey kaybolur; dosyaların başındaki uyarı bunu söylüyor.
//
// ÖZET ARGOS'UN KENDİ HESABIYLA üretilir (js/hesap.js). Ham JSON'dan
// hesaplayan bir okuyucu kur çevrimini ve yukarı yuvarlamayı bilmez ve
// ekranda görünenden farklı bir sayı söyler — sessiz ve fark edilmesi zor
// bir hata türü.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as H from '../js/hesap.js';

const KAYNAK = resolve(process.env.ARGOS_VERI || 'C:\\MY_Code\\argos-veri');
const HEDEF = resolve(process.env.ARGOS_VAULT || 'C:\\ws\\veri');

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const GUNLER = [
  'pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi',
];

const KATEGORI_ADI = {
  'yeme-icme': 'yeme-içme',
  'kisisel-bakim': 'kişisel bakım',
  'toplu-tasima': 'toplu taşıma',
  ulasim: 'ulaşım',
  saglik: 'sağlık',
  egitim: 'eğitim',
  eglence: 'eğlence',
  diger: 'diğer',
  yazilim: 'yazılım',
  kirtasiye: 'kırtasiye',
};

const oku = async (yol) => {
  try {
    return JSON.parse(await readFile(join(KAYNAK, yol), 'utf8'));
  } catch (hata) {
    if (hata.code === 'ENOENT') return null;
    throw hata;
  }
};

const lira = (ham) => H.bicimle(H.yuvarla(ham));
const kategoriAdi = (k) => KATEGORI_ADI[k] || k;
const gunAdi = (t) => GUNLER[new Date(t + 'T00:00:00').getDay()];
const ayAdi = (ay) => `${AYLAR[Number(ay.slice(5, 7)) - 1]} ${ay.slice(0, 4)}`;
const tarihTR = (t) => `${Number(t.slice(8))} ${AYLAR[Number(t.slice(5, 7)) - 1]}`;

/** Hangi aylar var — dosya adlarından. */
async function aylariBul() {
  try {
    const dosyalar = await readdir(join(KAYNAK, 'harcama'));
    return dosyalar
      .filter((d) => /^\d{4}-\d{2}\.json$/.test(d))
      .map((d) => d.slice(0, 7))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function main() {
  const bugun = H.gunAnahtari(new Date());
  const kur = (await oku('kur.json')) || {};
  const tanimlar = (await oku('aliskanlik/tanim.json')) || [];
  const abonelikler = (await oku('abonelik.json')) || [];
  const aylar = await aylariBul();

  // Bütün onaylar tek listede: seri ve rekor hesabı ay sınırını aşıyor.
  let onaylar = [];
  for (const ay of aylar) {
    const claude = (await oku(`aliskanlik/onay-${ay}.json`)) || [];
    const app = (await oku(`aliskanlik/onay-app-${ay}.json`)) || [];
    onaylar = H.onaylariBirlestir(onaylar, claude, app);
  }

  const s = [];
  const yaz = (satir = '') => s.push(satir);

  yaz('---');
  yaz('tur: sistem');
  yaz(`guncelleme: ${bugun.slice(8)}-${bugun.slice(5, 7)}-${bugun.slice(0, 4)}`);
  yaz('uretim: otomatik');
  yaz('---');
  yaz();
  yaz('# Argos — Özet');
  yaz();
  yaz('> **Bu dosya elle düzenlenmez.** `argos` deposundaki');
  yaz('> `dev/vault-ozet.js` üretir; kaynak `C:\\MY_Code\\argos-veri`.');
  yaz('> Buraya yazılan bir şey bir sonraki üretimde kaybolur.');
  yaz('>');
  yaz('> Sayılar Argos ekranındakilerle aynı hesaptan geçer: döviz kurla');
  yaz('> çevrilir, gösterimde yukarı yuvarlanır. Ham tutarlar `kopya/`');
  yaz('> altındaki JSON dosyalarında.');
  yaz();
  yaz(`Üretildiği gün: **${tarihTR(bugun)} ${bugun.slice(0, 4)}, ${gunAdi(bugun)}**`);
  yaz();

  // --- Bu ay -------------------------------------------------------------
  const buAy = bugun.slice(0, 7);
  const buAyHarcama = (await oku(`harcama/${buAy}.json`)) || [];
  const gecenGun = H.ayinGecenGunu(buAy, bugun);
  const buAyToplam = H.toplamTL(buAyHarcama, kur);

  yaz('## Şu an');
  yaz();
  yaz(`- **Bu ay (${ayAdi(buAy)}):** ${lira(buAyToplam)} ₺`);
  if (gecenGun > 0) {
    yaz(`- Günde ortalama: ${lira(buAyToplam / gecenGun)} ₺ (${gecenGun} gün geçti)`);
  }
  yaz(`- Kayıt sayısı: ${buAyHarcama.length}`);
  const bugunku = H.gununHarcamalari(buAyHarcama, bugun);
  yaz(
    `- Bugün: ${bugunku.length ? `${lira(H.toplamTL(bugunku, kur))} ₺, ${bugunku.length} kayıt` : 'kayıt yok'}`
  );

  const aylikAbone = H.aylikAbonelikToplami(abonelikler, kur);
  yaz(`- Abonelik yükü: ${lira(aylikAbone)} ₺/ay, ${lira(aylikAbone * 12)} ₺/yıl`);
  const yaklasan = H.yaklasanOdemeler(abonelikler, bugun, 400)[0];
  if (yaklasan) {
    yaz(
      `- Sıradaki ödeme: ${yaklasan.abonelik.ad}, ` +
        `${yaklasan.kalanGun === 0 ? 'bugün' : `${yaklasan.kalanGun} gün sonra`}`
    );
  }
  yaz();

  // --- Aylar -------------------------------------------------------------
  yaz('## Aylar');
  yaz();
  for (const ay of aylar) {
    const harcama = (await oku(`harcama/${ay}.json`)) || [];
    const gun = H.ayinGecenGunu(ay, bugun);
    const toplam = H.toplamTL(harcama, kur);

    yaz(`### ${ayAdi(ay)}`);
    yaz();
    if (harcama.length === 0) {
      yaz('Kayıt yok.');
      yaz();
      continue;
    }

    yaz(
      `**${lira(toplam)} ₺** · ${harcama.length} kayıt · ` +
        (gun > 0 ? `günde ortalama ${lira(toplam / gun)} ₺` : '')
    );
    yaz();

    const kirilim = H.kategoriKirilimi(harcama, kur);
    yaz('| Kategori | Tutar | Pay |');
    yaz('|---|---|---|');
    for (const k of kirilim) {
      const pay = toplam > 0 ? Math.round((k.tutar / toplam) * 100) : 0;
      yaz(`| ${kategoriAdi(k.kategori)} | ${lira(k.tutar)} ₺ | %${pay} |`);
    }
    yaz();

    const enBuyuk = H.enBuyukler(harcama, kur, 5);
    yaz('En büyük kayıtlar:');
    for (const x of enBuyuk) {
      const h = x.kayit;
      const nerede = h.yer || (h.alt ? kategoriAdi(h.alt) : '');
      yaz(
        `- ${tarihTR(h.tarih)} · ${kategoriAdi(h.kategori)}` +
          `${nerede ? ` (${nerede})` : ''} · ${lira(x.tutar)} ₺`
      );
    }
    yaz();

    const { yerler, yersiz } = H.yerKirilimi(harcama, kur);
    if (yerler.length) {
      yaz('Nereye:');
      for (const y of yerler.slice(0, 8)) {
        yaz(`- ${y.yer}: ${lira(y.tutar)} ₺ (${y.adet} kez)`);
      }
      if (yersiz > 0) yaz(`- (${yersiz} kayıtta yer yazılmamış)`);
      yaz();
    }
  }

  // --- Alışkanlıklar -----------------------------------------------------
  yaz('## Alışkanlıklar');
  yaz();
  if (tanimlar.length === 0) {
    yaz('Tanımlı alışkanlık yok.');
    yaz();
  }
  for (const t of tanimlar) {
    const tip = (t.siklik || {}).tip;
    const ritim =
      tip === 'gun-arasi'
        ? `${t.siklik.deger} günde bir`
        : tip === 'haftalik'
          ? `haftada ${t.siklik.deger}`
          : 'her gün';

    const seri =
      tip === 'haftalik'
        ? H.haftalikDurum(t, onaylar, bugun).yapilan
        : H.seriHesapla(t, onaylar, bugun);
    const rekor = H.enUzunSeri(t, onaylar);
    const iz = H.aliskanlikIzi(t, onaylar, bugun, gecenGun || 1);
    const sayac = H.izSayaci(iz);
    const olculen = sayac.yapildi + sayac.yapilmadi;
    const onay = H.onayBul(onaylar, t.id, bugun);
    const bekleniyor = H.bugunBekleniyorMu(t, onaylar, bugun);

    yaz(`### ${t.ad}${t.ana ? ' (ana)' : ''}`);
    yaz();
    yaz(`- Ritim: ${ritim}`);
    yaz(`- Şu anki seri: ${seri}${tip === 'gun-arasi' ? ' tur' : ' gün'}`);
    yaz(`- En uzun seri: ${rekor}`);
    yaz(
      `- Bu ay: ${sayac.yapildi} yapıldı, ${sayac.yapilmadi} kaçtı` +
        (olculen > 0 ? ` (%${Math.round((sayac.yapildi / olculen) * 100)})` : '')
    );
    yaz(
      `- Bugün: ${onay ? (onay.durum === 'yapildi' ? 'yapıldı' : 'kaçırıldı') : bekleniyor ? 'bekleniyor' : 'ara günü'}`
    );

    const gunDesen = H.aliskanlikGunDagilimi(t, onaylar, bugun, 84)
      .filter((d) => d.oran !== null)
      .map((d) => `${GUNLER[(d.gun + 1) % 7]} ${d.yapildi}/${d.beklenen}`);
    if (gunDesen.length) yaz(`- Haftanın günü: ${gunDesen.join(' · ')}`);
    yaz();
  }

  // --- Abonelikler -------------------------------------------------------
  yaz('## Abonelikler');
  yaz();
  const aktif = abonelikler.filter((a) => a.aktif);
  if (aktif.length === 0) {
    yaz('Aktif abonelik yok.');
  } else {
    // Sütun başlığı "yenileme günü", değer çıplak sayı: Türkçede sayı
    // ekleri düzensiz (2'si, 6'sı, 19'u, 23'ü) ve tek kalıpla üretilemiyor.
    // Ek koymak yerine başlık taşıyor.
    yaz('| Abonelik | Aylık | Yıllık | Yenileme günü |');
    yaz('|---|---|---|---|');
    for (const a of aktif.slice().sort((x, y) => H.aylikGider(y, kur) - H.aylikGider(x, kur))) {
      const ay = H.aylikGider(a, kur);
      const kendi =
        (a.birim || 'TRY') === 'TRY' ? '' : ` (${H.bicimle(a.tutar)} ${a.birim})`;
      yaz(
        `| ${a.ad}${kendi} | ${lira(ay)} ₺ | ${lira(ay * 12)} ₺ | ` +
          `${a.yenileme_gunu != null ? a.yenileme_gunu : 'bilinmiyor'} |`
      );
    }
    const pasif = abonelikler.filter((a) => !a.aktif);
    if (pasif.length) {
      yaz();
      yaz(`Kapalı: ${pasif.map((a) => a.ad).join(', ')}`);
    }
  }
  yaz();

  // --- Son kayıtlar ------------------------------------------------------
  // Ayrıntı soruları çoğunlukla yakın geçmişe ait ("geçen çarşamba ne
  // aldım"); daha eskisi için ham JSON kopyası var.
  yaz('## Son 30 günün kayıtları');
  yaz();
  const otuzGun = [];
  for (const ay of aylar.slice(0, 2)) {
    const harcama = (await oku(`harcama/${ay}.json`)) || [];
    for (const h of harcama) {
      if (H.gunFarki(bugun, h.tarih) <= 30 && h.tarih <= bugun) otuzGun.push(h);
    }
  }
  if (otuzGun.length === 0) {
    yaz('Kayıt yok.');
  } else {
    yaz('| Tarih | Gün | Kategori | Yer | Tutar |');
    yaz('|---|---|---|---|---|');
    for (const h of otuzGun.sort((a, b) => b.tarih.localeCompare(a.tarih))) {
      const tl = H.tryeCevir(h.tutar, h.birim || 'TRY', kur);
      const nerede = h.yer || (h.alt ? kategoriAdi(h.alt) : '—');
      yaz(
        `| ${tarihTR(h.tarih)} | ${gunAdi(h.tarih)} | ` +
          `${kategoriAdi(h.kategori)} | ${nerede} | ${lira(tl)} ₺ |`
      );
    }
  }
  yaz();

  yaz('## Kur');
  yaz();
  yaz(`USD ${kur.USD ?? '?'} · EUR ${kur.EUR ?? '?'}` + (kur.guncelleme ? ` (${kur.guncelleme})` : ''));
  yaz();

  await mkdir(HEDEF, { recursive: true });
  await writeFile(join(HEDEF, 'ozet.md'), s.join('\n'), 'utf8');

  // --- Ham kopya ---------------------------------------------------------
  const kopyaKok = join(HEDEF, 'kopya');
  await mkdir(join(kopyaKok, 'harcama'), { recursive: true });
  await mkdir(join(kopyaKok, 'aliskanlik'), { recursive: true });

  const kopyala = async (yol) => {
    try {
      await writeFile(join(kopyaKok, yol), await readFile(join(KAYNAK, yol), 'utf8'), 'utf8');
      return 1;
    } catch (hata) {
      if (hata.code === 'ENOENT') return 0;
      throw hata;
    }
  };

  let sayi = 0;
  sayi += await kopyala('abonelik.json');
  sayi += await kopyala('kur.json');
  sayi += await kopyala('aliskanlik/tanim.json');
  for (const ay of aylar) {
    sayi += await kopyala(`harcama/${ay}.json`);
    sayi += await kopyala(`aliskanlik/onay-${ay}.json`);
    sayi += await kopyala(`aliskanlik/onay-app-${ay}.json`);
  }

  await writeFile(
    join(kopyaKok, 'BURAYA-YAZMA.md'),
    '# Bu klasör otomatik üretilir\n\n' +
      'Kaynak: `C:\\MY_Code\\argos-veri` (private GitHub deposu)\n' +
      'Üreten: `argos` deposu, `dev/vault-ozet.js`\n\n' +
      'Buradaki dosyalara yazılan hiçbir şey kaynağa gitmez ve bir sonraki\n' +
      'üretimde kaybolur. Ölçüm kaydı için `gelen/` klasörünü kullan\n' +
      '(`kurallar/gelen.md > Ölçüm notu`).\n',
    'utf8'
  );

  console.log(`ozet.md yazildi  -> ${join(HEDEF, 'ozet.md')}`);
  console.log(`ham kopya: ${sayi} dosya -> ${kopyaKok}`);
  console.log(`kapsam: ${aylar.length} ay (${aylar.join(', ') || 'yok'})`);
}

main().catch((hata) => {
  console.error('vault-ozet basarisiz:', hata.message);
  process.exit(1);
});
