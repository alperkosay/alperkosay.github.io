import { createElement, type CSSProperties } from 'react';
import { Step } from '../engine/Step';
import { rng } from '../engine/rand';

/** Her harf başka bir dergiden kesilmiş gibi dursun diye yazı tipi havuzu. */
const FACES: { f: string; s: number }[] = [
  { f: "'Anton'", s: 1.1 },
  { f: "'Abril Fatface'", s: 1 },
  { f: "'Alfa Slab One'", s: 0.92 },
  { f: "'Bungee'", s: 0.84 },
  { f: "'DM Serif Display'", s: 1.06 },
  { f: "'Archivo Black'", s: 0.9 },
  { f: "'Shrikhand'", s: 0.96 },
  { f: "'Rubik Mono One'", s: 0.78 },
  { f: "'Bangers'", s: 1.06 },
  { f: "'Special Elite'", s: 0.98 },
];

const SKINS = ['ink', 'paper', 'c1', 'c2', 'white', 'news'] as const;
const CADENCE = [2, 3, 3, 4, 3, 6];

interface RansomProps {
  text: string;
  seed?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  /** Harfler scroll ile kendi kare hızlarında dağılır. */
  scatter?: boolean;
  /** Sayfa açılırken harfler tek tek yapıştırılır. */
  intro?: boolean;
  /** Başlık ekrana girerken harfler yukarıdan tek tek düşer. */
  drop?: boolean;
}

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Fidye mektubu yazısı: her harf ayrı kağıt, ayrı yazı tipi, ayrı açı. */
export function Ransom({ text, seed = 1, as = 'span', className = '', scatter, intro, drop }: RansomProps) {
  const r = rng(seed * 7919);
  let face = -1;
  let skin = -1;
  let i = 0;

  const pick = (n: number, prev: number) => {
    let v = Math.floor(r() * n);
    if (v === prev) v = (v + 1 + Math.floor(r() * (n - 1))) % n;
    return v;
  };

  const words = text.split(' ').map((word, wi) => (
    <span className="ransom__w" key={wi} aria-hidden="true">
      {Array.from(word).map((ch, ci) => {
        face = pick(FACES.length, face);
        skin = pick(SKINS.length, skin);
        const j = () => (r() * 7).toFixed(1);
        const clip = `polygon(${j()}% ${j()}%,${(100 - r() * 7).toFixed(1)}% ${j()}%,${(100 - r() * 7).toFixed(1)}% ${(100 - r() * 7).toFixed(1)}%,${j()}% ${(100 - r() * 7).toFixed(1)}%)`;
        const outer: Vars = {
          '--r': `${((r() - 0.5) * 13).toFixed(1)}deg`,
          '--y': `${((r() - 0.5) * 0.16).toFixed(3)}em`,
          '--dx': `${((r() - 0.5) * 170).toFixed(0)}vw`,
          '--dy': `${(-(85 + r() * 60)).toFixed(0)}vh`,
          '--dr': `${((r() - 0.5) * 260).toFixed(0)}deg`,
          '--i': i,
          '--ph': `${(-r() * 0.5).toFixed(2)}s`,
        };
        const inner: Vars = { fontFamily: FACES[face].f, '--s': FACES[face].s, clipPath: clip };
        const on = CADENCE[Math.floor(r() * CADENCE.length)];
        const offset = Math.floor(r() * on);
        const cls = `rl live${on === 2 ? 3 : on}${intro ? ' rl--intro' : ''}${drop ? ' rl--drop' : ''}`;
        const body = (
          <span className={`rl__in rl--${SKINS[skin]}`} style={inner}>
            {ch}
          </span>
        );
        i++;
        return scatter || drop ? (
          <Step as="span" key={ci} className={cls} style={outer} on={on} offset={offset}>
            {body}
          </Step>
        ) : (
          <span key={ci} className={cls} style={outer}>
            {body}
          </span>
        );
      })}
    </span>
  ));

  // Ekran okuyucu düz metni okur, kesilmiş harfleri değil.
  return createElement(
    as,
    { className: `ransom ${className}` },
    <span className="sr" key="sr">
      {text}
    </span>,
    words,
  );
}
