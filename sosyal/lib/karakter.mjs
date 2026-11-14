/**
 * Karakter kiti: maskotu motion için katmanlara ayırır.
 *
 * Her katman aynı tuvalde (viewBox -50 0 520 620) ayrı SVG ve şeffaf PNG olarak
 * çıkar; üst üste koyunca birebir hizalanır. Stiller CSS'ten hesaplanıp SVG
 * özniteliklerine gömülür, dosyalar kendi başına açılır (Illustrator, Figma, AE).
 * Dönme noktaları ve sitedeki kare hızları pivotlar.json'a yazılır.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RIG, SAC } from './sahne.mjs';

const YUZLER = { open: 'acik', blink: 'kirp', talk: 'konus', shout: 'bagir', happy: 'mutlu', wink: 'goz-kirp', dead: 'bayildi', code: 'kod' };

/** Z sırası, arkadan öne. Aynı satırdakiler birbirinin alternatifi (aynı numarayı alır). */
const KATMANLAR = [
  ['bacak-sol'],
  ['bacak-sag'],
  ['kablo'],
  ['govde'],
  ['yelek'],
  ['kol-sol'],
  ['gitar'],
  ['kol-sag', 'kol-sag-selam'],
  ['sac'],
  ['kafa'],
  Object.values(YUZLER).map((y) => `yuz-${y}`),
  ['gozluk'],
];

/** Sitede her parçanın kaç karede bir poz değiştirdiği (24 kare/sn) ve gecikmesi. Mascot.tsx RIG. */
const KARE = {
  'bacak-sol': [3, 0],
  'bacak-sag': [3, 1],
  kablo: [6, 3],
  govde: [3, 0],
  yelek: [3, 2],
  'kol-sol': [3, 0],
  gitar: [4, 0],
  'kol-sag': [2, 0],
  'kol-sag-selam': [2, 0],
  kafa: [3, 1],
  sac: [4, 1],
};

const ADLAR = Object.fromEntries(Object.entries(RIG).map(([k, r]) => [k, r.ad]));
const PIVOT = Object.fromEntries([...Object.values(RIG).map((r) => [r.ad, [r.cx, r.cy]]), ['kol-sag-selam', [RIG[6].cx, RIG[6].cy]], [SAC.ad, [SAC.cx, SAC.cy]]]);

/** Tarayıcıda çalışır: isimlendirir, stilleri gömer, katmanlara böler. */
function islem({ adlar, yuzler, sira }) {
  const NS = 'http://www.w3.org/2000/svg';
  const fig = document.getElementById('fig');
  const selam = document.getElementById('selam');

  // El sallayan kol, çalan kolun hemen üstüne alternatif katman olarak eklenir.
  const kolSelam = selam.querySelector('.m-part[style*="--k:6"]').parentNode;
  kolSelam.setAttribute('data-selam', '');
  fig.querySelector('.m-part[style*="--k:6"]').parentNode.after(kolSelam);
  selam.remove();

  for (const p of fig.querySelectorAll('.m-part')) {
    const g = p.parentNode;
    g.id = g.hasAttribute('data-selam') ? 'kol-sag-selam' : adlar[p.style.getPropertyValue('--k').trim()];
    g.dataset.part = '';
  }
  const kafa = fig.querySelector('#kafa');
  const sac = kafa.querySelector('.m-part > g');
  sac.id = 'sac';
  sac.dataset.part = '';
  const gozluk = kafa.querySelector('.m-glasses');
  gozluk.id = 'gozluk';
  gozluk.dataset.part = '';
  kafa.querySelector('.m-scr').id = 'yuzler';
  for (const g of kafa.querySelectorAll('.m-scr > g')) {
    const f = [...g.classList].find((c) => c.startsWith('f-')).slice(2);
    g.id = `yuz-${yuzler[f]}`;
    g.dataset.part = '';
  }
  // Açılış animasyonu sarmalayıcısı gereksiz: içeriği bir üste alınır.
  for (const p of fig.querySelectorAll('.m-part')) {
    p.parentNode.append(...p.childNodes);
    p.remove();
  }

  // Sınıflar silinmeden önce bütün hesaplanmış stiller toplanır.
  const SEKIL = new Set(['rect', 'circle', 'polygon', 'polyline', 'path', 'line', 'ellipse', 'text']);
  const url = (v) => (v.startsWith('url(') ? `url(#${v.match(/#([^"')]+)/)[1]})` : v);
  const px = (v) => v.replace(/px/g, '');
  const kayit = [];
  for (const el of fig.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const a = {};
    if (cs.display === 'none') a.display = 'none';
    if (cs.opacity !== '1') a.opacity = cs.opacity;
    if (SEKIL.has(el.localName)) {
      a.fill = url(cs.fill);
      if (cs.fillOpacity !== '1') a['fill-opacity'] = cs.fillOpacity;
      if (cs.stroke !== 'none') {
        a.stroke = url(cs.stroke);
        a['stroke-width'] = px(cs.strokeWidth);
        if (cs.strokeLinecap !== 'butt') a['stroke-linecap'] = cs.strokeLinecap;
        if (cs.strokeLinejoin !== 'miter') a['stroke-linejoin'] = cs.strokeLinejoin;
        if (cs.strokeDasharray !== 'none') a['stroke-dasharray'] = px(cs.strokeDasharray).replace(/,\s*/g, ' ');
      }
      if (el.localName === 'text') {
        a['font-family'] = cs.fontFamily;
        a['font-size'] = px(cs.fontSize);
        a['font-weight'] = cs.fontWeight;
      }
    }
    kayit.push([el, a]);
  }
  for (const [el, a] of kayit) {
    for (const [k, v] of Object.entries(a)) el.setAttribute(k, v);
    for (const k of ['class', 'style', 'filter', 'data-selam']) el.removeAttribute(k);
  }
  fig.querySelector('#kol-sag-selam').setAttribute('display', 'none');

  const kalip = ['p-dots', 'p-stripes', 'p-news'].map((id) => document.getElementById(id));
  const tam = document.createElementNS(NS, 'svg');
  tam.setAttribute('xmlns', NS);
  tam.setAttribute('viewBox', '-50 0 520 620');
  tam.setAttribute('width', '520');
  tam.setAttribute('height', '620');
  const defs = document.createElementNS(NS, 'defs');
  for (const k of kalip) defs.append(k.cloneNode(true));
  tam.append(defs);
  const kok = fig.firstElementChild.cloneNode(true);
  kok.id = 'maskot';
  tam.append(kok);

  const yaz = (s) => {
    for (const el of s.querySelectorAll('[data-part]')) el.removeAttribute('data-part');
    return new XMLSerializer().serializeToString(s);
  };

  /** Sadece bir katman: atalar boş kap olarak kalır, kardeşler silinir. */
  const sadece = (id, altlar = false) => {
    const s = tam.cloneNode(true);
    const T = s.querySelector(`#${id}`);
    for (const el of [...s.querySelectorAll('#maskot *')]) {
      // Kopya belgeye bağlı değil (isConnected hep false): üst silindiyse s.contains yakalar.
      if (!s.contains(el) || el === T || el.contains(T) || T.contains(el)) continue;
      el.remove();
    }
    if (!altlar) for (const el of [...T.querySelectorAll('[data-part]')]) el.remove();
    T.removeAttribute('display');
    return s;
  };

  const kafaSvg = sadece('kafa', true);
  kafaSvg.setAttribute('viewBox', '114 2 192 226');
  kafaSvg.setAttribute('width', '192');
  kafaSvg.setAttribute('height', '226');

  return {
    tam: yaz(tam.cloneNode(true)),
    kafa: yaz(kafaSvg),
    parcalar: sira.map((id) => ({ id, svg: yaz(sadece(id)) })),
  };
}

export async function karakterKiti({ parts, k, br, gecici, cikti }) {
  const ic = (html) => {
    const bas = html.indexOf('<svg class="mascot__fig" ');
    const s = html.slice(bas, html.indexOf('</svg>', bas) + 6);
    return s.slice(s.indexOf('>') + 1, -6);
  };
  const sayfa = join(gecici, 'karakter.html');
  writeFileSync(
    sayfa,
    `<!doctype html><html><head><meta charset="utf-8">${k.FONTLAR}<style>${k.MASKOT_CSS}</style></head><body>${k.TANIMLAR}
<svg id="fig" viewBox="-50 0 520 620" data-face="open">${ic(parts.play)}</svg>
<svg id="selam" viewBox="-50 0 520 620" data-face="open">${ic(parts.wave)}</svg></body></html>`,
  );
  await br.ac(sayfa, 800, 800);
  const sira = KATMANLAR.flat();
  const sonuc = await br.calistir(`(${islem.toString()})(${JSON.stringify({ adlar: ADLAR, yuzler: YUZLER, sira })})`);

  const parcaDir = join(cikti, 'parcalar');
  rmSync(parcaDir, { recursive: true, force: true });
  mkdirSync(parcaDir, { recursive: true });

  /** SVG'yi şeffaf PNG'ye basar. */
  const png = async (svg, dosya, w, h) => {
    const html = join(gecici, 'png.html');
    writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8">${k.FONTLAR}<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh;overflow:visible}</style></head><body>${svg}</body></html>`);
    await br.ac(html, w, h, { seffaf: true });
    await br.foto(dosya);
  };

  writeFileSync(join(cikti, 'maskot.svg'), sonuc.tam);
  await png(sonuc.tam, join(cikti, 'maskot.png'), 1040, 1240);
  writeFileSync(join(cikti, 'maskot-kafa.svg'), sonuc.kafa);
  await png(sonuc.kafa, join(cikti, 'maskot-kafa.png'), 768, 904);

  const numara = Object.fromEntries(KATMANLAR.flatMap((satir, i) => satir.map((id) => [id, String(i + 1).padStart(2, '0')])));
  const katmanlar = [];
  for (const { id, svg } of sonuc.parcalar) {
    const ad = `${numara[id]}-${id}`;
    writeFileSync(join(parcaDir, `${ad}.svg`), svg);
    await png(svg, join(parcaDir, `${ad}.png`), 1040, 1240);
    const ebeveyn = id === 'sac' || id === 'gozluk' || id.startsWith('yuz-') ? 'kafa' : null;
    const [x, y] = PIVOT[id] ?? PIVOT.kafa;
    katmanlar.push({
      katman: id,
      dosya: `parcalar/${ad}.svg`,
      sira: Number(numara[id]),
      ebeveyn,
      pivot: [x, y],
      pivotPng: [(x + 50) * 2, y * 2],
      ...(KARE[id] && { kare: { her: KARE[id][0], gecikme: KARE[id][1] } }),
    });
  }

  writeFileSync(
    join(cikti, 'pivotlar.json'),
    JSON.stringify(
      {
        not: 'pivot: SVG birimi (viewBox -50 0 520 620). pivotPng: 1040x1240 PNG üzerinde piksel. kare.her: sitede kaç karede bir poz değiştirdiği (24 kare/sn), kare.gecikme: kaç kare geç yakaladığı. ebeveyni kafa olanlar kafayla birlikte hareket eder.',
        katmanlar,
      },
      null,
      2,
    ) + '\n',
  );
  return katmanlar.length;
}
