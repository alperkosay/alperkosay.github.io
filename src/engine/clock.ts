/**
 * Müzik saati: notaları ses kartının saatine göre biraz ileriden planlar.
 *
 * Film 24 karede akar ama vuruşlar kareye bağlanırsa kayar. Bu yüzden her
 * adım `LOOKAHEAD` saniye önceden planlanır. Ses kapalıyken saat
 * `performance.now()` olur: müzik duyulmaz ama maskot yine ritimde çalar.
 */
import { audioClock } from './sound';

const LOOKAHEAD = 0.12;

/**
 * `play` her adım için bir kere çağrılır:
 * - `t`: adımın çalacağı an, ses kartı saatinde
 * - `audible`: ses açık mı; kapalıysa sadece görüntü sürülür
 * - `delayMs`: o ana kaç ms var; görüntüyü sese oturtmak için
 */
export type PlayStep = (step: number, t: number, audible: boolean, delayMs: number) => void;

/** Döngüyü başlatır, durdurmak için dönen fonksiyonu çağır. */
export function startClock(stepSec: number, play: PlayStep, onAudible?: () => void): () => void {
  let step = 0;
  let next = -1;
  let wasAudible: boolean | null = null;

  const tick = () => {
    const audio = audioClock();
    const audible = audio !== null;
    const now = audio ?? performance.now() / 1000;
    // Saat değişti (ses açıldı/kapandı) ya da sekme arkada kalıp geride düştük: yeniden hizala.
    if (audible !== wasAudible || next < now - 0.25) next = now + 0.05;
    wasAudible = audible;
    if (audible) onAudible?.();
    while (next < now + LOOKAHEAD) {
      play(step, next, audible, Math.max(0, (next - now) * 1000));
      next += stepSec;
      step++;
    }
  };

  tick();
  const id = window.setInterval(tick, 25);
  return () => window.clearInterval(id);
}
