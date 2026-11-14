/**
 * Görsellerin yapı taşları: poza sokulmuş maskot, kırmızı dalga, fidye mektubu
 * harfleri, patlama, ortak CSS ve sayfa iskeleti. Renkler `renk` ile gelir.
 *
 * Maskotun çizimi sitedeki React bileşeninden gelir (uret.mjs SSR ile çıkarır),
 * burada sadece poz, renk ve yerleşim belirlenir.
 */
import { pathToFileURL } from 'node:url';

const TAU = Math.PI * 2;

/* ---------- Poz: Mascot.tsx'teki RIG'in tek kareye dondurulmuş kopyası ---------- */
const bob = (t) => Math.sin(t * TAU * 2);
const sway = (t, ph = 0) => Math.sin(t * TAU + ph);
const body = (c, k = 1) => ({ x: c.L * 4, y: bob(c.t) * 2.5 * (1 + c.e) + c.k * 4, rot: (sway(c.t) * 1.4 * (1 + c.e) + c.L * 6) * k });

/** Anahtar, SSR çıktısındaki `--k` sırası (Mascot.tsx ORDER). cx/cy dönme noktası. */
export const RIG = {
  0: { ad: 'bacak-sol', cx: 192, cy: 384, pose: (c) => ({ x: 0, y: 0, rot: c.L * 1.5 }) },
  1: { ad: 'bacak-sag', cx: 229, cy: 384, pose: (c) => ({ x: 0, y: 0, rot: c.L * 1.5 }) },
  9: { ad: 'kablo', cx: 280, cy: 160, pose: (c) => ({ x: c.L * 8, y: bob(c.t) * 3, rot: sway(c.t * 0.5) * 3 + c.e * 5 }) },
  2: { ad: 'govde', cx: 210, cy: 394, pose: (c) => body(c) },
  3: { ad: 'yelek', cx: 210, cy: 394, pose: (c) => body(c, 1.3) },
  4: { ad: 'kol-sol', cx: 164, cy: 250, pose: (c) => ({ x: c.L * 4, y: bob(c.t) * 2.5 * (1 + c.e), rot: sway(c.t, 2) * 3 + c.L * 4 }) },
  5: { ad: 'gitar', cx: 205, cy: 345, pose: (c) => ({ x: c.L * 5, y: bob(c.t) * 1.5, rot: sway(c.t, 1.2) * 2.5 + c.L * 5 + c.e * 5 - c.k * 8 }) },
  6: {
    ad: 'kol-sag',
    cx: 258,
    cy: 250,
    pose: (c) =>
      c.act === 'wave'
        ? { x: c.L * 4, y: bob(c.t) * 2.5, rot: Math.sin(c.t * TAU * 2) * 13 - 4 + c.k * 10 }
        : { x: c.L * 4, y: bob(c.t) * 2.5 * (1 + c.e), rot: Math.sin(c.t * TAU * 4) * 9 * (1 + c.e * 0.8) + c.L * 4 + Math.sin(c.k * 9) * 24 * c.k },
  },
  7: {
    ad: 'kafa',
    cx: 210,
    cy: 208,
    pose: (c) => ({ x: c.L * 12, y: bob(c.t) * 3.5 * (1 + c.e) + c.k * 9, rot: sway(c.t, 0.9) * 5 * (1 + c.e) + c.L * 11 - c.k * 9 }),
  },
};
export const SAC = { ad: 'sac', cx: 210, cy: 98, pose: (c) => ({ rot: sway(c.t, 0.2) * 5 * (1 + c.e * 2) + c.k * 14 }) };
const HAWK_BAS = '<g><g class="m-halo"><polygon class="m-c1 m-o" points="164,100';

/** Hazır pozlar. t: zaman, e: enerji, L: yatış, k: pena vuruşu. */
export const POZ = {
  cal: { act: 'play', t: 0.16, e: 0.9, L: -0.35, k: 0.85 },
  selam: { act: 'wave', t: 0.08, e: 0.3, L: 0, k: 0.3 },
};

export function sahneKur({ parts, renk, kok }) {
  const tf = (p, r) => `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(2)} ${r.cx} ${r.cy})`;

  /** SSR figürünü (gölgesiz) verilen poza sokar, svg'nin içini döndürür. */
  function figur(c) {
    const html = parts[c.act];
    const bas = html.indexOf('<svg class="mascot__fig" ');
    let svg = html.slice(bas, html.indexOf('</svg>', bas) + 6);
    svg = svg.replace(/<g class="([^"]*)"><g class="m-part" style="--k:(\d+)">/g, (_, cls, k) => {
      const r = RIG[k];
      return `<g class="${cls}" transform="${tf(r.pose(c), r)}"><g class="m-part">`;
    });
    const h = SAC.pose(c);
    svg = svg.replace(HAWK_BAS, HAWK_BAS.replace('<g>', `<g transform="rotate(${h.rot.toFixed(2)} ${SAC.cx} ${SAC.cy})">`));
    return svg.slice(svg.indexOf('>') + 1, -6);
  }

  /* ---------- Kırmızı dalga: sitedeki mavi dalganın donmuş, kırmızı hali ---------- */
  const TONLAR = renk.dalga;

  /** Figür koordinatlarında dalga. Gitarın ucundan (-3, 279) sola uzar. */
  function dalga({ boy = 0.5, faz = 1.2, aci = 12 } = {}) {
    const size = 620;
    const N = 40;
    const R = size * 0.9 * boy;
    const swing = size * 0.065 * 1.35 * Math.min(1, boy + 0.15);
    const curl = 8.5 * Math.min(1.6, boy * 0.9 + 0.25);
    const thick = size * 0.017;
    const a = (aci * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const line = (off) => {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const x = -u * R;
        const y = Math.sin(u * curl - faz) * swing * Math.min(1, u * 2.4) + off * Math.min(1, u * 6);
        pts.push(`${(-3 + x * cos - y * sin).toFixed(1)} ${(279 + x * sin + y * cos).toFixed(1)}`);
      }
      return `M${pts.join('L')}`;
    };
    const half = (TONLAR.length - 1) / 2;
    let s = '<g class="wave">';
    for (const k of [-1, 1]) s += `<path class="wave__e" d="${line(k * (half + 0.56) * thick)}"/>`;
    TONLAR.forEach((c, i) => (s += `<path class="wave__s" stroke="${c}" stroke-width="${(thick * 1.12).toFixed(1)}" d="${line((i - half) * thick)}"/>`));
    return s + '</g>';
  }

  /**
   * Maskot: figür + arkasında beyaz ve kırmızı iz (sitedeki kırmızı/mavi izin karşılığı).
   * `stil` ile konum ve boy (height) verilir; genişlik 520/620 oranından gelir.
   */
  function maskot({ poz = POZ.cal, yuz = 'shout', dalga: d, kablo = true, iz = true, stil = '' }) {
    const ic = figur(poz);
    const golge = (f, dx, dy) => `<svg class="fig" viewBox="-50 0 520 620" style="translate:${dx}% ${dy}%"><g filter="url(#${f})">${ic}</g></svg>`;
    return `<div class="mascot${kablo ? '' : ' no-cable'}" data-face="${yuz}" style="${stil}">
      ${iz ? golge('ghost-d', -5.5, 2.5) + golge('ghost-r', -2.8, 1.2) : ''}
      <svg class="fig" viewBox="-50 0 520 620">${ic}</svg>
      ${d ? `<svg class="fig" viewBox="-50 0 520 620">${dalga(d)}</svg>` : ''}
    </div>`;
  }

  /** Sadece monitör kafa. */
  function kafa({ yuz = 'happy', stil = '' }) {
    return parts.head.replace('data-face="open"', `data-face="${yuz}"`).replace('<svg ', `<svg style="${stil}" `);
  }

  /* ---------- Fidye mektubu yazısı: Ransom.tsx'in statik hali ---------- */
  const rng = (seed) => {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  };
  const YAZI_TIPLERI = [
    ["'Anton'", 1.1],
    ["'Abril Fatface'", 1],
    ["'Alfa Slab One'", 0.92],
    ["'Bungee'", 0.84],
    ["'DM Serif Display'", 1.06],
    ["'Archivo Black'", 0.9],
    ["'Shrikhand'", 0.96],
    ["'Rubik Mono One'", 0.78],
    ["'Bangers'", 1.06],
    ["'Special Elite'", 0.98],
  ];
  const KAGITLAR = ['ink', 'paper', 'c1', 'white', 'c1', 'news'];

  /** Her harf ayrı kağıt. `tohum` değişince harflerin fontu, rengi, açısı değişir. */
  function fidye(metin, tohum, boyut) {
    const r = rng(tohum * 7919);
    let f = -1;
    let k = -1;
    const sec = (n, once) => {
      let v = Math.floor(r() * n);
      if (v === once) v = (v + 1 + Math.floor(r() * (n - 1))) % n;
      return v;
    };
    const kelimeler = metin.split(' ').map(
      (w) =>
        `<span class="rw">${Array.from(w)
          .map((ch) => {
            f = sec(YAZI_TIPLERI.length, f);
            k = sec(KAGITLAR.length, k);
            const j = () => (r() * 7).toFixed(1);
            const q = () => (100 - r() * 7).toFixed(1);
            const kes = `polygon(${j()}% ${j()}%,${q()}% ${j()}%,${q()}% ${q()}%,${j()}% ${q()}%)`;
            return `<span class="rl" style="--r:${((r() - 0.5) * 13).toFixed(1)}deg;--y:${((r() - 0.5) * 0.16).toFixed(3)}em"><span class="rl__in rl--${KAGITLAR[k]}" style="font-family:${YAZI_TIPLERI[f][0]};--s:${YAZI_TIPLERI[f][1]};clip-path:${kes}">${ch}</span></span>`;
          })
          .join('')}</span>`,
    );
    return `<span class="ransom" style="font-size:${boyut}px">${kelimeler.join(' ')}</span>`;
  }

  function patlama(uc, stil) {
    const pts = [];
    for (let i = 0; i < uc * 2; i++) {
      const a = (i / (uc * 2)) * TAU;
      const rad = i % 2 ? 34 : 49;
      pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)},${(50 + Math.sin(a) * rad).toFixed(1)}`);
    }
    return `<svg class="burst" style="${stil}" viewBox="0 0 100 100"><polygon points="${pts.join(' ')}" filter="url(#rough)"/></svg>`;
  }

  /** Mutlak konumlu kutu. */
  const yer = (x, y, ic, ek = '') => `<div style="position:absolute;left:${x}px;top:${y}px;${ek}">${ic}</div>`;

  /* ---------- Ortak sayfa ---------- */
  const font = (paket, dosya = 'index.css') => `<link rel="stylesheet" href="${pathToFileURL(`${kok}/node_modules/@fontsource/${paket}/${dosya}`).href}">`;
  const FONTLAR =
    ['anton', 'rubik-mono-one', 'caveat-brush', 'abril-fatface', 'alfa-slab-one', 'bungee', 'archivo-black', 'shrikhand', 'bangers', 'special-elite', 'dm-serif-display']
      .map((p) => font(p))
      .join('') +
    font('courier-prime', '400.css') +
    font('courier-prime', '700.css');

  const TANIMLAR = `<svg width="0" height="0" style="position:absolute">${parts.defs
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .replace('flood-color="#ff1f3d"', `flood-color="${renk.kirmizi}"`)
    .replace(
      '</defs>',
      `<filter id="ghost-d" x="-10%" y="-10%" width="120%" height="120%"><feFlood flood-color="#fff"/><feComposite in2="SourceAlpha" operator="in"/></filter>
       <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -.72"/></filter>
       </defs>`,
    )}</svg>`;

  /** Maskotun çizim kuralları (film.css'teki .m-* kurallarının kopyası). */
  const MASKOT_CSS = `
:root{--ink:#000;--paper:#f1f1ea;--red:${renk.kirmizi};--c1:${renk.ceket};--c2:${renk.ikinci};--brown:${renk.gozluk};--m-screen:${renk.ekran};
--f-type:'Courier Prime',monospace;--f-hand:'Caveat Brush',cursive;--f-poster:'Anton',sans-serif;--f-label:'Rubik Mono One',sans-serif}
.m-ink{fill:#000}.m-paper{fill:var(--paper)}.m-white{fill:#fff}.m-c1{fill:var(--c1)}.m-c2{fill:var(--c2)}
.m-o{stroke:#000;stroke-width:3.5;stroke-linejoin:round}.m-o-thin{stroke:#000;stroke-width:2.2}
.m-halo *{fill:#fff!important;stroke:#fff!important;stroke-width:14px!important;stroke-linejoin:round!important}
.m-scr>g{display:none}
[data-face=open] .f-open,[data-face=blink] .f-blink,[data-face=talk] .f-talk,[data-face=shout] .f-shout,[data-face=happy] .f-happy,[data-face=wink] .f-wink,[data-face=dead] .f-dead,[data-face=code] .f-code{display:inline}
.m-scr rect{fill:var(--m-screen)}
.m-scr-l{fill:none;stroke:var(--m-screen);stroke-width:6;stroke-linecap:square}
.m-glasses-h *{fill:none;stroke:#fff;stroke-width:10.5;stroke-linecap:round;stroke-linejoin:round}
.m-frame *{fill:none;stroke:var(--brown);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.m-lens{fill:var(--brown);fill-opacity:.34}
.m-glint{fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round;opacity:.85}
.m-line{fill:none;stroke:#000;stroke-width:2.2}.m-string{fill:none;stroke:#000;stroke-width:1.3}
.m-chain{fill:none;stroke:var(--paper);stroke-width:3.5;stroke-dasharray:5 4}
.m-pin{fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round}
.m-wire,.m-wire-h,.m-arm-h,.m-arm-o,.m-arm-f,.m-band{fill:none;stroke-linecap:round;stroke-linejoin:round}
.m-wire{stroke:#000;stroke-width:5}.m-wire-h{stroke:#fff;stroke-width:14}
.m-arm-h{stroke:#fff;stroke-width:37}.m-arm-o{stroke:#000;stroke-width:25}.m-arm-f{stroke:var(--paper);stroke-width:18}
.m-band{stroke:#000;stroke-width:25;stroke-linecap:butt}
.m-patch{font:700 15px var(--f-type);fill:#000}
.m-code-b{opacity:0}
.m-led{fill:var(--red)}
.no-cable .m-cable{display:none}
`;

  const CSS = `${MASKOT_CSS}
*{box-sizing:border-box;margin:0}
html,body{width:var(--w);height:var(--h);overflow:hidden;background:${renk.zemin}}
body{position:relative;color:#fff;font-family:var(--f-type)}
.dots{position:absolute;inset:0;background:radial-gradient(circle,#202020 0 30%,transparent 33%) 0 0/var(--dot,11px) var(--dot,11px)}
.grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:.5}
.grain svg{width:100%;height:100%}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at var(--vx,50%) var(--vy,50%),transparent 35%,rgba(0,0,0,.75) 100%)}
.mascot{position:absolute;aspect-ratio:520/620}
.fig{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mascot-head{position:absolute;overflow:visible}
.wave__s{fill:none;stroke-linecap:round;stroke-linejoin:round}
.wave__e{fill:none;stroke:#fff;stroke-width:5;stroke-linejoin:round}
.burst{position:absolute;overflow:visible}
.burst polygon{fill:var(--bc,var(--red))}
.ransom{display:inline-block;line-height:1;white-space:nowrap}
.rw{display:inline-block;margin-right:.22em}.rw:last-child{margin-right:0}
.rl{display:inline-block;rotate:var(--r);translate:0 var(--y);filter:drop-shadow(.035em .05em 0 color-mix(in srgb,var(--red) 85%,transparent))}
.rl__in{display:block;font-size:calc(1em*var(--s));line-height:1;padding:.1em .17em .05em}
.rl--ink{background:#111;color:var(--paper);outline:2px solid #fff;outline-offset:-2px}
.rl--paper{background:var(--paper);color:#000}.rl--white{background:#fff;color:#000}
.rl--c1{background:var(--red);color:#000}
.rl--news{background:#d6d6ce repeating-linear-gradient(0deg,transparent 0 5px,rgba(0,0,0,.2) 5px 6px);color:#000}
.tag{position:absolute;font:var(--tf,22px) var(--f-label);text-transform:uppercase;letter-spacing:.02em;padding:.3em .6em .25em;background:var(--red);color:#000;white-space:nowrap}
.tag--white{background:#fff;color:#000}
.hand{font-family:var(--f-hand)}
.tape{position:absolute;height:var(--th,40px);background:repeating-linear-gradient(-45deg,var(--red) 0 22px,#000 22px 44px);outline:4px solid #000}
.slab{position:absolute;background:var(--red)}
.poster{font-family:var(--f-poster);text-transform:uppercase;line-height:.86;color:#fff}
.stroke{-webkit-text-stroke:var(--sw,3px) var(--red);color:transparent}
`;

  const GREN = `<div class="grain"><svg><rect width="100%" height="100%" filter="url(#grain)"/></svg></div>`;

  /**
   * Sayfa iskeleti. `zemin` noktalı arka plan + vinyet (sadece zemini karartır),
   * `ic` her şeyin üstünde, en üstte fotokopi greni.
   */
  function sayfa(w, h, { nokta = 11, vinyet = '50% 50%', zemin = '', ic }) {
    const [vx, vy] = vinyet.split(' ');
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8">${FONTLAR}<style>${CSS}</style></head>
<body style="--w:${w}px;--h:${h}px">${TANIMLAR}
<div class="dots" style="--dot:${nokta}px"></div><div class="vig" style="--vx:${vx};--vy:${vy}"></div>
${zemin}${ic}${GREN}</body></html>`;
  }

  return { maskot, kafa, fidye, patlama, yer, sayfa, FONTLAR, MASKOT_CSS, TANIMLAR };
}
