/**
 * Grubun çalabileceği riff'ler. `band.ts` hangisinin çalacağını `RIFF` ile seçer.
 *
 * Tab'lar düz metin olarak yazılır: üstte ince Mi, altta kalın Mi, standart
 * akort. Tab'daki her karakter bir karedir (saniyede 24); `|` ölçü çizgisi de
 * bir kare sayılır. Aynı sütundaki rakamlar birlikte çalar.
 */

export type RiffName = 'chug' | 'arp' | 'techno' | 'metal';

/**
 * Hangi müzik çalsın:
 * - 'chug': ilk riff, power chord'lu punk vuruşu
 * - 'arp': tab'daki motif, gitarla tek tek notalar
 * - 'techno': aynı motif 128 BPM techno parçası içinde (techno.ts)
 * - 'metal': özgün, karanlık, dur-kalk metal riff'i ve davul (metal.ts)
 */
export const RIFF = 'metal' as RiffName;

/** Eski riff: power chord'lu, avuçla susturulmuş punk vuruşu. */
export const CHUG = {
  /** Bir ölçünün ritmi: 1 vuruş, 0 sus. 3 karede bir adım, saniyede 8 nota. */
  bar: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  /** Ölçülerin kök notası, yarım ses adımı olarak (Mi, Sol, La, Sol). Kendi kendine döner. */
  roots: [0, 0, 3, 3, 5, 5, 3, 3],
};

/** Yeni riff: tek tek çalınan notalar. */
export const ARP_TAB = `
E |---------------------------------|---------------------------------|
B |---------------------------------|---------------------------------|
G |-------2-------------2-----------|-------2-------------------------|
D |----4-----------4----4-----------|----4-----------4----------------|
A |----------3--2-------------------|----------3--2----2--------------|
E |-2-----------------2-------------|-2----------------0--------------|
`;

/** Telin açık sesi, kalın Mi'den (Mi2) yarım ses adımı olarak. Üstten alta. */
const OPEN = [24, 19, 15, 10, 5, 0];

/** Tab'ı karelere çevirir: her sütun için o karede çalacak notalar. */
export function parseTab(tab: string): number[][] {
  const lines = tab
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.includes('|'))
    .map((l) => l.slice(l.indexOf('|') + 1));
  if (lines.length !== OPEN.length) throw new Error(`Tab ${OPEN.length} telli olmalı, ${lines.length} satır var.`);

  const len = Math.max(...lines.map((l) => l.length));
  const cols: number[][] = Array.from({ length: len }, () => []);
  lines.forEach((line, s) => {
    // İki haneli perdeler (10, 12...) de okunur; nota ilk hanenin karesinde çalar.
    for (const m of line.matchAll(/\d+/g)) cols[m.index].push(OPEN[s] + Number(m[0]));
  });
  return cols;
}
