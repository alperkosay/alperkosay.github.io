/**
 * Techno: 128 BPM, Mi minör. Senin tab'ındaki motif lead olarak çalar.
 *
 * Zamanlama clock.ts'te: notalar ses kartının saatine göre ileriden planlanır.
 *
 * Yapı: 4 ölçü giriş (bir kere), sonra 8 ölçülük ana döngü. Döngünün son iki
 * ölçüsünde kick susar, gerilim birikir, sonra yeniden girer.
 */
import { startClock } from './clock';
import { projector } from './projector';
import { ARP_TAB, parseTab } from './riffs';
import { techno as v } from './sound';

const BPM = 128;
/** Bir on altılık, saniye: 60 / 128 / 4 = 0.1171875. */
const S16 = 60 / BPM / 4;
const INTRO = 4;
const LOOP = 8;

/**
 * Lead: tab'daki iki ölçü on altılıklara oturtulur. Tab'da üç karakter bir
 * adım; ölçü çizgisiyle birlikte bir ölçü 34 karakter. Motif ilk 8 adımı
 * doldurur, ölçünün ikinci yarısı boş kalır, yankı onu doldurur.
 */
const LEAD: number[][][] = (() => {
  const cols = parseTab(ARP_TAB);
  const bars: number[][][] = [];
  cols.forEach((notes, col) => {
    if (!notes.length) return;
    const bar = Math.floor(col / 34);
    const step = Math.round((col - bar * 34 - 1) / 3);
    bars[bar] ??= Array.from({ length: 16 }, () => []);
    // Bir oktav yukarıda: tab gitarın kalın tellerinde, lead'in sesi açılsın.
    bars[bar][step].push(...notes.map((n) => n + 12));
  });
  return bars;
})();

/** Ana döngünün ölçü ölçü kökleri (Mi2'ye göre yarım ses): Mi, Mi, Do, Re. */
const ROOT = [0, 0, -4, -2];
/** Ölçünün pad akoru: Mim, Mim, Do, Re. */
const PAD = [
  [12, 15, 19],
  [12, 15, 19],
  [8, 12, 15],
  [10, 14, 17],
];

function play(step: number, t: number, audible: boolean, delayMs: number) {
  const bar = Math.floor(step / 16);
  const s = step % 16;
  const intro = bar < INTRO;
  const loopBar = intro ? bar : (bar - INTRO) % LOOP;
  const chordBar = loopBar % 4;
  const breakdown = !intro && loopBar >= LOOP - 2;

  const kick = s % 4 === 0 && !breakdown;
  const bassOn = !intro || bar >= 2;
  const leadOn = !intro;
  const leadNotes = leadOn ? LEAD[loopBar % LEAD.length][s] : [];

  if (audible) {
    if (kick) v.kick(t);
    // Hi-hat: on altılıklar hafif, ara sekizliklerde açık hat.
    if (s % 4 === 2) v.hat(t, true);
    else if (!intro || bar >= 1) v.hat(t);
    if ((s === 4 || s === 12) && (bassOn || breakdown)) v.clap(t);
    // Bas: kick'in arasına düşen klasik offbeat, kök bir oktav aşağıda.
    if (bassOn && s % 4 === 2) v.bass(ROOT[chordBar] - 12, t, S16 * 1.6);
    if (bassOn && s === 15) v.bass(ROOT[chordBar] - 12 + 7, t, S16 * 0.8);
    if (s === 0) v.pad(PAD[chordBar], t, S16 * 16);
    leadNotes.forEach((n, i) => v.lead(n, t, i ? 0.11 : 0.17));
  }

  // Maskot lead'in her notasında, lead yokken kick'te penayı vurur.
  if (leadNotes.length || (!leadOn && kick)) {
    window.setTimeout(() => projector.strum('riff'), delayMs);
  }
}

/** Döngüyü başlatır, durdurmak için dönen fonksiyonu çağır. */
export function startTechno(): () => void {
  // Yankı ses ilk açıldığında kurulur; ses sonradan açılırsa da hazır olsun.
  return startClock(S16, play, () => v.init(S16));
}
