// GitHub kaynağı — veri katmanının ikinci uygulaması.
//
// `yerelKaynak` ile AYNI arayüzü doldurur (`oku`, `onayYaz`); ekran kodu
// hangisiyle konuştuğunu bilmez. Bu ayrım projenin ilk gününde kuruldu ve
// bugün karşılığını verdi: tek satır ekran kodu değişmeden veri diskten
// GitHub'a taşındı.
//
// Neden `raw.githubusercontent.com` değil: private depoda raw uç noktası
// bir Authorization başlığını kabul etmiyor, ayrı bir imzalı bağlantı
// istiyor. Contents API tokenla doğrudan çalışıyor ve aynı istekte
// yazma için gereken `sha` değerini de veriyor.

const API = 'https://api.github.com';

/**
 * UTF-8 metni base64'e çevirir.
 *
 * `btoa` yalnız Latin-1 kabul eder; "İçecek" ya da "₺" geçen bir dosyada
 * doğrudan çağrılırsa InvalidCharacterError atar. Metin önce bayta
 * çevrilip her bayt bir karaktere eşlenmeli.
 */
export function base64Yaz(metin) {
  const baytlar = new TextEncoder().encode(metin);
  let ikili = '';
  for (const b of baytlar) ikili += String.fromCharCode(b);
  return btoa(ikili);
}

/** base64 -> UTF-8 metin. `base64Yaz`ın tersi. */
export function base64Oku(veri) {
  const ikili = atob(veri.replace(/\s/g, ''));
  const baytlar = Uint8Array.from(ikili, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(baytlar);
}

/**
 * GitHub deposundan okuyan/yazan kaynak.
 *
 * @param sahip  kullanıcı adı ("javaformc")
 * @param depo   depo adı ("argos-veri")
 * @param token  fine-grained PAT; yalnız o deponun Contents izni
 * @param dal    varsayılan "main"
 */
export function githubKaynak({ sahip, depo, token, dal = 'main' }) {
  const baslik = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  };

  const icerikYolu = (yol) =>
    `${API}/repos/${sahip}/${depo}/contents/${yol}?ref=${encodeURIComponent(dal)}`;

  /** Dosyanın içeriği + sha. Yoksa null; sha yazma için gerekli. */
  async function dosyaGetir(yol) {
    const yanit = await fetch(icerikYolu(yol), {
      headers: baslik,
      cache: 'no-store',
    });

    if (yanit.status === 404) return null;
    if (yanit.status === 401 || yanit.status === 403) {
      // Token yanlış ya da yetkisi yetmiyor. Bu ikisi ayrı ayrı
      // anlatılmalı: biri "anahtarı değiştir", diğeri "anahtarın kapısı
      // yanlış" demek ve kullanıcı ikisini farklı çözer.
      const sebep =
        yanit.status === 401
          ? 'Token geçersiz ya da süresi dolmuş.'
          : 'Token bu depoya erişemiyor — izinlerde Contents: Read and write olmalı.';
      const hata = new Error(sebep);
      hata.tokenSorunu = true;
      throw hata;
    }
    if (!yanit.ok) throw new Error(`${yol} okunamadı (${yanit.status})`);

    const govde = await yanit.json();
    return { metin: base64Oku(govde.content), sha: govde.sha };
  }

  return {
    ad: 'github',

    async oku(yol) {
      const dosya = await dosyaGetir(yol);
      if (!dosya) return null;
      return JSON.parse(dosya.metin);
    },

    async onayYaz(ay, kayitlar) {
      const yol = `aliskanlik/onay-app-${ay}.json`;
      const govde = JSON.stringify(kayitlar, null, 2) + '\n';

      // Mevcut dosyanın sha'sı gerekli: GitHub üzerine yazmayı ancak
      // "hangi sürümün üstüne yazdığını" söylersen kabul ediyor. Dosya
      // yoksa sha gönderilmez, yeni dosya oluşturulur.
      const mevcut = await dosyaGetir(yol);

      const yanit = await fetch(
        `${API}/repos/${sahip}/${depo}/contents/${yol}`,
        {
          method: 'PUT',
          headers: { ...baslik, 'content-type': 'application/json' },
          body: JSON.stringify({
            message: `Argos: ${ay} onayları`,
            content: base64Yaz(govde),
            branch: dal,
            ...(mevcut ? { sha: mevcut.sha } : {}),
          }),
        }
      );

      if (yanit.status === 409) {
        // Başka bir cihaz aynı dosyayı bu istek hazırlanırken değiştirdi.
        // Sessizce üzerine yazmak o cihazın işaretini silerdi.
        throw new Error(
          'Kayıt başka bir cihazdan değişmiş. Sayfayı yenile, işaretini tekrar koy.'
        );
      }
      if (!yanit.ok) {
        throw new Error(`onay yazılamadı (${yanit.status})`);
      }
    },
  };
}
