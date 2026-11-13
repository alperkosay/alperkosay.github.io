import { CUES } from '../timeline';
import { projector } from './projector';
import { chug, sfx } from './sound';

/** Bir ölçünün ritmi: 1 vuruş, 0 sus. 3 karede bir adım, saniyede 8 nota. */
const BAR = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1];
/** Ölçülerin kök notası, yarım ses adımı olarak (Mi, Sol, La, Sol). Kendi kendine döner. */
const ROOTS = [0, 0, 3, 3, 5, 5, 3, 3];

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

  return projector.onTick((f, st) => {
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
    if (!st.rolling || f % 3) return;
    const bar = Math.floor(step / BAR.length) % ROOTS.length;
    if (BAR[step % BAR.length]) {
      chug(ROOTS[bar]);
      projector.strum('riff');
    }
    step++;
  });
}
