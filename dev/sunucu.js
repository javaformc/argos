// Geliştirme sunucusu. Yalnız yerel makinede çalışır, yayına çıkmaz.
//
// İki iş yapar:
//   /            -> proje kökündeki statik dosyalar
//   /veri/...    -> argos-veri deposunun çalışma kopyası (VERI_KOK)
//
// Neden ayrı klasör: veri KENDİ deposunda yaşar (argos-veri, private),
// kod deposuna kopyalanmaz. Kopyalansaydı iki kaynak ayrışır ve hangisinin
// doğru olduğu belirsizleşirdi — ayrıca kod deposu public.

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const PROJE_KOK = dirname(dirname(fileURLToPath(import.meta.url)));
// resolve(): ARGOS_VERI POSIX kipinde de verilebiliyor (Git Bash). Ayrık
// biçimdeki bir yol join() çıktısıyla asla eşleşmez ve her istek 403 döner.
//
// Varsayılan yol 30-08-2026'da `C:\ws\veri`'den buraya taşındı: veri artık
// kendi git deposunda ve Drive senkronunun dışında. Drive `.git` klasörünü
// de senkronluyor, dosya kilidi yok ve git yazarken senkron başlarsa depo
// bozulabiliyor.
const VERI_KOK = resolve(process.env.ARGOS_VERI || 'C:\\MY_Code\\argos-veri');
const PORT = Number(process.env.PORT) || 4173;

/**
 * Ağa açılma BİLİNÇLİ bir karardır, varsayılan değil.
 *
 * `ARGOS_AG=1` verilmedikçe sunucu yalnız bu makineden erişilebilir.
 * Sebep: bu sunucu vault'taki gerçek veriyi servis ediyor ve
 * `onay-app-*.json` dosyasına YAZMA izni var. Aynı ağdaki herkes —
 * misafir Wi-Fi'ı dahil — harcama geçmişini okuyabilir ve alışkanlık
 * kaydını değiştirebilir. Telefonda denemek için açılır, iş bitince
 * kapatılır.
 */
const AGA_ACIK = process.env.ARGOS_AG === '1';
const ADRES = AGA_ACIK ? '0.0.0.0' : '127.0.0.1';

/** Bu makinenin yerel ağ adresleri (telefondan yazılacak olan). */
function yerelAdresler() {
  const bulunan = [];
  for (const arayuzler of Object.values(networkInterfaces())) {
    for (const a of arayuzler || []) {
      if (a.family === 'IPv4' && !a.internal) bulunan.push(a.address);
    }
  }
  return bulunan;
}

const TURLER = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/**
 * İstek yolunu bir klasörün içine sabitler.
 * `..` ile klasör dışına çıkma denemesi null döner — dev sunucusu da olsa
 * diskin geri kalanını servis etmemeli.
 */
function guvenliYol(kok, istekYolu) {
  const temiz = normalize(decodeURIComponent(istekYolu)).replace(/^([/\\])+/, '');
  const tam = join(kok, temiz);
  return tam === kok || tam.startsWith(kok + sep) ? tam : null;
}

async function dosyaGonder(yanit, yol) {
  try {
    const icerik = await readFile(yol);
    yanit.writeHead(200, {
      'content-type': TURLER[extname(yol)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    yanit.end(icerik);
  } catch (hata) {
    if (hata.code === 'ENOENT' || hata.code === 'EISDIR') {
      yanit.writeHead(404).end('bulunamadı');
    } else {
      yanit.writeHead(500).end(String(hata.message));
    }
  }
}

function govdeOku(istek) {
  return new Promise((coz, red) => {
    let veri = '';
    istek.on('data', (p) => {
      veri += p;
      if (veri.length > 2_000_000) red(new Error('gövde çok büyük'));
    });
    istek.on('end', () => coz(veri));
    istek.on('error', red);
  });
}

const sunucu = createServer(async (istek, yanit) => {
  const yol = istek.url.split('?')[0];

  // --- Veri yazma: yalnız Argos'un sahibi olduğu dosyalar ---------------
  if (istek.method === 'PUT' && yol.startsWith('/veri/')) {
    const hedef = guvenliYol(VERI_KOK, yol.slice('/veri'.length));
    const ad = hedef && hedef.split(sep).pop();

    // Mimarideki dosya sahipliği burada zorlanır: Argos yalnız onay-app-*
    // dosyasına yazar. Diğerleri Claude'undur; yanlışlıkla üzerine yazmak
    // sessiz veri kaybı demektir.
    if (!hedef || !ad.startsWith('onay-app-') || !ad.endsWith('.json')) {
      yanit.writeHead(403).end('Argos yalnız onay-app-*.json dosyasına yazabilir');
      return;
    }

    try {
      const govde = await govdeOku(istek);
      JSON.parse(govde); // bozuk JSON diske yazılmasın
      await mkdir(dirname(hedef), { recursive: true });
      await writeFile(hedef, govde, 'utf8');
      yanit.writeHead(204).end();
      console.log(`[yazildi] ${hedef}`);
    } catch (hata) {
      yanit.writeHead(400).end(String(hata.message));
    }
    return;
  }

  if (istek.method !== 'GET') {
    yanit.writeHead(405).end('desteklenmiyor');
    return;
  }

  // --- Veri okuma -------------------------------------------------------
  if (yol.startsWith('/veri/')) {
    const hedef = guvenliYol(VERI_KOK, yol.slice('/veri'.length));
    if (!hedef) return void yanit.writeHead(403).end('yol dışı');
    return void dosyaGonder(yanit, hedef);
  }

  // --- Statik dosyalar --------------------------------------------------
  // Klasör isteği (/b/) o klasörün index.html'ine düşer; tarayıcı adres
  // çubuğuna klasör yazıldığında 404 dönüyordu.
  const istenen = yol.endsWith('/') ? yol + 'index.html' : yol;
  const hedef = guvenliYol(PROJE_KOK, istenen);
  if (!hedef) return void yanit.writeHead(403).end('yol dışı');
  dosyaGonder(yanit, hedef);
});

sunucu.listen(PORT, ADRES, () => {
  console.log(`Argos geliştirme sunucusu: http://localhost:${PORT}`);
  console.log(`  kod  : ${PROJE_KOK}`);
  console.log(`  veri : ${VERI_KOK}`);

  if (!AGA_ACIK) {
    console.log('  ağ   : kapalı (telefondan açmak için ARGOS_AG=1)');
    return;
  }

  const adresler = yerelAdresler();
  console.log('  ağ   : AÇIK — aynı Wi-Fi ağındaki her cihaz erişebilir');
  if (adresler.length === 0) {
    console.log('         (ağ arayüzü bulunamadı)');
  } else {
    for (const a of adresler) {
      console.log(`         telefondan: http://${a}:${PORT}/c/`);
    }
  }
});
