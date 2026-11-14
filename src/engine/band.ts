import { CUES } from '../timeline';
import { projector } from './projector';
import { ARP_TAB, CHUG, parseTab, RIFF } from './riffs';
import { chug, note, sfx } from './sound';
import { startMetal } from './metal';
import { startTechno } from './techno';

const ARP = parseTab(ARP_TAB);

/** Eski riff: 3 karede bir adım, ölçü ölçü power chord. */
function playChug(step: number): boolean {
  const bar = Math.floor(step / CHUG.bar.length) % CHUG.roots.length;
  if (CHUG.bar[step % CHUG.bar.length]) chug(CHUG.roots[bar]);
  return CHUG.bar[step % CHUG.bar.length] === 1;
}

/** Tab: her kare bir sütun, sütundaki notalar birlikte çalar. */
function playArp(step: number): boolean {
  const col = ARP[step % ARP.length];
  for (const semi of col) note(semi);
  return col.length > 0;
}

/**
 * Grup. Müzik scroll'a bağlı değildir: film başladıktan sonra maskot riff'i
 * kendi temposunda, durmadan çalar; sen kaydırsan da dursan da aynı devam eder.
 * Her notada penayı vurur ve gitarın ucundaki dalga canlı kalır.
 *
 * Ses efektleri ise sahneye bağlıdır: amfi düşünce, kağıt yapışınca, çekim
 * değişince çalar.
 */
export function startBand(): () => void {
  let step = 0;
  let shot = -1;
  let p = 0;
  let stopLoop: (() => void) | null = null;

  const offTick = projector.onTick((f, st) => {
    if (st.reduced) return;

    if (st.shot !== shot) {
      if (shot >= 0) sfx('whoosh');
      shot = st.shot;
      p = st.shotP;
    }
    for (const cue of CUES[shot] ?? []) {
      if (p < cue.at !== st.shotP < cue.at) sfx(cue.sfx);
    }
    p = st.shotP;

    st.jam = st.rolling;
    if (!st.rolling) return;
    if (RIFF === 'techno' || RIFF === 'metal') {
      // Bunlar kendi saatiyle çalar (clock.ts); burada sadece bir kere başlatılır.
      stopLoop ??= RIFF === 'metal' ? startMetal() : startTechno();
      return;
    }
    if (RIFF === 'chug') {
      if (f % 3) return;
      if (playChug(step)) projector.strum('riff');
    } else if (playArp(step)) {
      projector.strum('riff');
    }
    step++;
  });

  return () => {
    offTick();
    stopLoop?.();
  };
}
