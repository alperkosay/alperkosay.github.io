/** Tohumlu rastgele sayı üreteci (mulberry32). Aynı tohum her seferinde aynı kolajı verir. */
export function rng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface TornOpts {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  /** Kenar başına diş sayısı. */
  n?: number;
}

/** Yırtık kağıt kenarı için clip-path. Değerler diş derinliği, piksel. */
export function torn(seed: number, { top = 0, right = 0, bottom = 0, left = 0, n = 26 }: TornOpts): string {
  const r = rng(seed);
  const pts: string[] = [];
  const f = (v: number) => v.toFixed(1);
  const edge = (depth: number, fn: (along: number, d: number) => void) => {
    if (!depth) return;
    for (let i = 1; i < n; i++) {
      const along = ((i + (r() - 0.5) * 0.7) / n) * 100;
      fn(along, r() * depth);
    }
  };

  pts.push(`${f(left * r())}px ${f(top * r())}px`);
  edge(top, (a, d) => pts.push(`${f(a)}% ${f(d)}px`));
  pts.push(`calc(100% - ${f(right * r())}px) ${f(top * r())}px`);
  edge(right, (a, d) => pts.push(`calc(100% - ${f(d)}px) ${f(a)}%`));
  pts.push(`calc(100% - ${f(right * r())}px) calc(100% - ${f(bottom * r())}px)`);
  edge(bottom, (a, d) => pts.push(`${f(100 - a)}% calc(100% - ${f(d)}px)`));
  pts.push(`${f(left * r())}px calc(100% - ${f(bottom * r())}px)`);
  edge(left, (a, d) => pts.push(`${f(d)}px ${f(100 - a)}%`));

  return `polygon(${pts.join(',')})`;
}
