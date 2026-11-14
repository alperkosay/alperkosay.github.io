/**
 * Sosyal medya görsellerini ve karakter kitini üretir.
 *
 *   npm run sosyal                    hepsi
 *   npm run sosyal -- gorsel          sadece görseller  (sosyal/gorseller)
 *   npm run sosyal -- karakter        sadece karakter   (sosyal/karakter)
 *
 * Maskot sitedeki React bileşeninden çizilir, isim/unvan/slogan src/content.ts'ten
 * gelir: sitede değişen şey burada da değişir. Yerleşim formatlar.mjs'te.
 */
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { formatlar } from './formatlar.mjs';
import { karakterKiti } from './lib/karakter.mjs';
import { sahneKur } from './lib/sahne.mjs';
import { tarayiciAc } from './lib/tarayici.mjs';

/** Renkler. Metinler src/content.ts'ten gelir. */
const AYAR = {
  renk: {
    kirmizi: '#ff1a1a', // vurgu: şeritler, etiketler, iz
    ceket: '#ff1a1a', // ceket ve mohawk
    ikinci: '#ffffff', // gitarın sapı, yama, bazı tuşlar
    ekran: '#ff2b2b', // monitördeki yüz
    gozluk: '#8a5326',
    zemin: '#000000',
    dalga: ['#4a0000', '#7d0000', '#b30000', '#ff1a1a', '#ff6a5c', '#ffd6cf'],
  },
};

const burasi = dirname(fileURLToPath(import.meta.url));
// Windows'ta "c:\" ile "C:\" ayrı modül sayılır; React'in Vite'ınkiyle aynı kopyası
// yüklensin diye gerçek yol kullanılır.
const kok = realpathSync.native(resolve(burasi, '..'));
const gerek = createRequire(join(kok, 'package.json'));
const { createElement: h } = gerek('react');
const { renderToStaticMarkup } = gerek('react-dom/server');
const secim = process.argv[2];
const yap = (ne) => !secim || secim === ne;

// Maskotu sitedeki bileşenden statik SVG'ye çevir.
const vite = await createServer({ root: kok, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
let parts;
let me;
try {
  const M = await vite.ssrLoadModule('/src/components/Mascot.tsx');
  const B = await vite.ssrLoadModule('/src/components/Bits.tsx');
  ({ me } = await vite.ssrLoadModule('/src/content.ts'));
  parts = {
    defs: renderToStaticMarkup(h(B.SvgDefs)),
    play: renderToStaticMarkup(h(M.Mascot, { act: 'play' })),
    wave: renderToStaticMarkup(h(M.Mascot, { act: 'wave' })),
    head: renderToStaticMarkup(h(M.MascotHead, { face: 'open', faces: ['open', 'happy', 'shout', 'wink', 'code'] })),
  };
} finally {
  await vite.close();
}

const k = sahneKur({ parts, renk: AYAR.renk, kok });
const gecici = mkdtempSync(join(tmpdir(), 'maskot-sayfa-'));
const br = await tarayiciAc();
try {
  if (yap('gorsel')) {
    const dir = join(burasi, 'gorseller');
    mkdirSync(dir, { recursive: true });
    for (const f of formatlar(k, me)) {
      const html = join(gecici, `${f.ad}.html`);
      writeFileSync(html, f.html);
      await br.ac(html, f.w, f.h);
      await br.foto(join(dir, `${f.ad}.png`));
      console.log(`görsel   ${f.ad}.png`);
    }
  }
  if (yap('karakter')) {
    const dir = join(burasi, 'karakter');
    mkdirSync(dir, { recursive: true });
    const n = await karakterKiti({ parts, k, br, gecici, cikti: dir });
    console.log(`karakter maskot.svg/png, maskot-kafa.svg/png, ${n} katman, pivotlar.json`);
  }
} finally {
  await br.kapat();
  rmSync(gecici, { recursive: true, force: true });
}
