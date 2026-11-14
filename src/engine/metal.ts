/**
 * Metal: karanlık, ağır, akılda kalan bir riff. Özgün; bir şarkının kopyası değil.
 *
 * Fikir: güçlü bir akor çalar ve susar, boşluğu palm mute'lu chug'lar doldurur
 * (dur-kalk), cevap ölçüsünde Si bemol (tritone, "şeytan aralığı") karanlığı
 * getirir, dördüncü ölçü kromatik inişle başa bağlar.
 *
 * Yazım: her ölçü 16 adım (on altılık). Her adım bir kelime:
 *   E5 G5 A5 Bb5 B5 C5 D5  power chord, çınlar
 *   x                       Mi'de susturulmuş chug
 *   -                       önceki akor çınlamaya devam eder
 *   .                       sus, akor kesilir
 */
import { startClock } from './clock';
import { projector } from './projector';
import { techno as v } from './sound';

const BPM = 100;
/** Bir on altılık, saniye: 60 / 100 / 4 = 0.15. */
const S16 = 60 / BPM / 4;

export const METAL_RIFF = [
  'E5 -  -  .   x  x  .  x   G5 -  .  A5  -  .  x  x',
  'E5 -  -  .   x  x  .  x   Bb5 - -  -   A5 -  G5 -',
  'E5 -  -  .   x  x  .  x   G5 -  .  A5  -  .  x  x',
  'E5 .  .  .   x  x  x  x   D5 -  C5 -   B5 -  Bb5 -',
];

/** Akorun kökü, kalın Mi'ye (Mi2) göre yarım ses adımı. */
const ROOT: Record<string, number> = { E5: 0, G5: 3, A5: 5, Bb5: 6, B5: 7, C5: 8, D5: 10 };

interface Hit {
  kind: 'power' | 'mute';
  semi: number;
  /** Kaç adım çınlar. */
  len: number;
}

/** Riff'i adım adım çalınacak vuruşlara çevirir; `-` önceki akorun süresine eklenir. */
function parse(bars: string[]): (Hit | null)[] {
  const words = bars.flatMap((b) => b.trim().split(/\s+/));
  const out: (Hit | null)[] = [];
  let last: Hit | null = null;
  for (const w of words) {
    if (w === '-' && last) {
      last.len++;
      out.push(null);
      continue;
    }
    last = null;
    if (w === 'x') out.push({ kind: 'mute', semi: 0, len: 1 });
    else if (w in ROOT) out.push((last = { kind: 'power', semi: ROOT[w], len: 1 }));
    else out.push(null);
  }
  return out;
}

const STEPS = parse(METAL_RIFF);

function play(step: number, t: number, audible: boolean, delayMs: number) {
  const i = step % STEPS.length;
  const s = i % 16;
  const hit = STEPS[i];

  if (audible) {
    if (hit?.kind === 'power') v.power(hit.semi, t, hit.len * S16 + 0.06);
    if (hit?.kind === 'mute') v.mute(hit.semi, t);
    // Davul: kick gitarın her vuruşunda, trampet 2 ve 4'te, hi-hat sekizliklerde.
    if (hit) v.kick(t);
    if (s === 4 || s === 12) v.snare(t);
    if (s % 2 === 0) v.hat(t, s === 14);
    // Her turun başında zil.
    if (i === 0) v.crash(t);
  }

  if (hit) window.setTimeout(() => projector.strum(hit.kind === 'power' ? 'hit' : 'riff'), delayMs);
}

/** Riff'i başlatır, durdurmak için dönen fonksiyonu çağır. */
export function startMetal(): () => void {
  return startClock(S16, play);
}
