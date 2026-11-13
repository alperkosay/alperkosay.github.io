/**
 * Çekimlerin zaman çizelgesi. Sayılar çekimin içindeki ilerlemedir (0..1).
 * Bileşenler, CSS'e giden değişkenler ve ses efektleri aynı sayıları kullanır;
 * bir anı kaydırmak istersen sadece burayı değiştir.
 */
import type { Sfx } from './engine/sound';

/** Kadro: amfiler dizilir, Claude iner, Ultra patlar, orkestra kurulur. */
export const KADRO = {
  amps: 0.1,
  ampStep: 0.02,
  cap1: [0.3, 0.375],
  claude: 0.335,
  cap2: [0.47, 0.555],
  ultra: 0.505,
  cap3: [0.655, 0.74],
  orch: 0.69,
  agents: 0.755,
  agentStep: 0.022,
  line: 0.9,
} as const;

/**
 * Hakkımda: kameranın her panelde durduğu aralık, sonra sayfanın tamamına
 * açıldığı an (`wide`), orada beklediği son an (`hold`) ve dördüncü panelin
 * ekranı tamamen doldurduğu an (`dive`). Oradan sonra kadroya dalar.
 */
export const BEN = {
  panels: [
    { from: 0.19, to: 0.37 },
    { from: 0.43, to: 0.6 },
    { from: 0.66, to: 0.82 },
  ],
  wide: 0.86,
  hold: 0.905,
  dive: 0.975,
} as const;

/** Kapak: manifesto kelimelerinin yapıştığı anlar. */
export const KAPAK = { words: [0.36, 0.49, 0.62] } as const;

interface Cue {
  at: number;
  sfx: Sfx;
}

/** Çekim sırasına göre ses efektleri. İlerleme `at` değerini geçince çalar. */
export const CUES: Cue[][] = [
  KAPAK.words.map((at) => ({ at, sfx: 'slap' as Sfx })),
  [...BEN.panels.map((p) => ({ at: p.from, sfx: 'slap' as Sfx })), { at: BEN.wide, sfx: 'whoosh' }, { at: BEN.hold, sfx: 'whoosh' }],
  [
    ...Array.from({ length: 9 }, (_, i) => ({ at: KADRO.amps + i * KADRO.ampStep + 0.02, sfx: 'thump' as Sfx })),
    { at: KADRO.claude + 0.045, sfx: 'boom' },
    { at: KADRO.ultra, sfx: 'zap' },
    { at: KADRO.ultra + 0.045, sfx: 'boom' },
    { at: KADRO.orch + 0.04, sfx: 'slap' },
  ],
  [],
  [{ at: 0.4, sfx: 'slap' }],
];

/** Otomatik oynatmanın hızı, saniyede ekran yüksekliği. Okunacak yazı olan çekim yavaş akar. */
export const PACE = { kapak: 0.42, ben: 0.19, kadro: 0.36, isler: 0.42, cikis: 0.3 } as const;
