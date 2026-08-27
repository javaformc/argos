// Veri katmanı. Kaynak-bağımsızdır: ekran kodu verinin yerel bir klasörden
// mi yoksa GitHub deposundan mı geldiğini bilmez.
//
// Bir kaynak şu iki işi yapar:
//   oku(yol)              -> ayrıştırılmış JSON, dosya yoksa null
//   onayYaz(ay, kayitlar) -> onay-app-YYYY-AA.json dosyasını değiştirir
//
// Argos'un yazma hakkı OLAN tek dosya onay-app-*.json'dur.
// Karar: kararlar.md > Alışkanlık onayı senkronu

import { ayAnahtari, onaylariBirlestir } from './hesap.js';

/** Geliştirme sunucusundan (dev/sunucu.js) okuyan kaynak. */
export function yerelKaynak(kok = '/veri') {
  return {
    ad: 'yerel',

    async oku(yol) {
      const yanit = await fetch(`${kok}/${yol}`, { cache: 'no-store' });
      if (yanit.status === 404) return null;
      if (!yanit.ok) throw new Error(`${yol} okunamadı (${yanit.status})`);
      return yanit.json();
    },

    async onayYaz(ay, kayitlar) {
      const yanit = await fetch(`${kok}/aliskanlik/onay-app-${ay}.json`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(kayitlar, null, 2),
      });
      if (!yanit.ok) throw new Error(`onay yazılamadı (${yanit.status})`);
    },
  };
}

/**
 * Ana ekranın ihtiyacı olan her şeyi tek seferde toplar.
 * Eksik dosya hata değildir — boş kabul edilir; yeni bir ayın ilk gününde
 * o ayın dosyaları henüz yoktur.
 */
export async function veriYukle(kaynak, bugun) {
  const ay = ayAnahtari(new Date(`${bugun}T00:00:00`));

  const [tanimlar, onayClaude, onayApp, harcamalar, abonelikler, kur] = await Promise.all([
    kaynak.oku('aliskanlik/tanim.json'),
    kaynak.oku(`aliskanlik/onay-${ay}.json`),
    kaynak.oku(`aliskanlik/onay-app-${ay}.json`),
    kaynak.oku(`harcama/${ay}.json`),
    kaynak.oku('abonelik.json'),
    kaynak.oku('kur.json'),
  ]);

  return {
    ay,
    tanimlar: tanimlar || [],
    onaylar: onaylariBirlestir(onayClaude || [], onayApp || []),
    onayApp: onayApp || [],
    harcamalar: harcamalar || [],
    abonelikler: abonelikler || [],
    kur: kur || {},
  };
}

/**
 * Bir alışkanlığı işaretler ve yalnız Argos'un dosyasını günceller.
 * Aynı gün + alışkanlık için eski kayıt değiştirilir, çoğaltılmaz.
 */
export async function onayIsaretle(kaynak, veri, aliskanlikId, gun, durum) {
  const kayit = {
    tarih: gun,
    aliskanlik: aliskanlikId,
    durum,
    damga: new Date().toISOString(),
    kaynak: 'app',
  };

  const kalanlar = veri.onayApp.filter(
    (o) => !(o.tarih === gun && o.aliskanlik === aliskanlikId)
  );
  const yeni = [...kalanlar, kayit].sort(
    (a, b) => a.tarih.localeCompare(b.tarih) || a.aliskanlik.localeCompare(b.aliskanlik)
  );

  await kaynak.onayYaz(veri.ay, yeni);

  veri.onayApp = yeni;
  veri.onaylar = onaylariBirlestir(veri.onaylar, [kayit]);
  return veri;
}
