// Geliştirme sunucusu. Yalnız yerel makinede çalışır, yayına çıkmaz.
//
// İki iş yapar:
//   /            -> proje kökündeki statik dosyalar
//   /veri/...    -> vault'taki gerçek veri klasörü (VERI_KOK)
//
// Neden ayrı klasör: veri vault'ta yaşar, kod deposuna kopyalanmaz.
// Kopyalansaydı iki kaynak ayrışır ve hangisinin doğru olduğu belirsizleşirdi.

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJE_KOK = dirname(dirname(fileURLToPath(import.meta.url)));
// resolve(): ARGOS_VERI POSIX kipinde de verilebiliyor (Git Bash). Ayrık
// biçimdeki bir yol join() çıktısıyla asla eşleşmez ve her istek 403 döner.
const VERI_KOK = resolve(process.env.ARGOS_VERI || 'C:\\ws\\veri');
const PORT = Number(process.env.PORT) || 4173;

const TURLER = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
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

sunucu.listen(PORT, () => {
  console.log(`Argos geliştirme sunucusu: http://localhost:${PORT}`);
  console.log(`  kod  : ${PROJE_KOK}`);
  console.log(`  veri : ${VERI_KOK}`);
});
