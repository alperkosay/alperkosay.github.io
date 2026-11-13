import type { CSSProperties } from 'react';
import { Arrow, Burst } from '../components/Bits';
import { Shot } from '../components/Film';
import { Mascot } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { PACE } from '../timeline';
import { me } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const WORD_TILT = ['-4deg', '3deg', '-2deg'];

/**
 * Çekim 1, kapak. Açılışta harfler ve maskot parça parça yapıştırılır.
 * Scroll harfleri dağıtır, manifestoyu yapıştırır, sonda kamera maskotun
 * ekranına doğru iter ve bir sonraki çekim o ekranın içinden açılır.
 */
export function Cover() {
  return (
    <Shot id="kapak" len={2.9} pace={PACE.kapak} first>
      <div className="cover__pin">
        <Step className="cover__slab live6" on={4} aria-hidden="true" style={{ clipPath: torn(2, { left: 34, n: 40 }) }} />
        <Step className="cover__dots dots-live" on={6} offset={2} aria-hidden="true" />
        <Step className="cover__floor live6" on={6} aria-hidden="true" style={{ clipPath: torn(9, { top: 16, n: 60 }) }} />

        <div className="cover__title">
          <Ransom as="h1" text="ALPER KOŞAY" seed={3} scatter intro className="cover__name" />
          <Step as="p" className="cover__role live4" on={3} offset={1}>
            <span className="dymo">{me.role}</span>
          </Step>
          <Step as="p" className="cover__lede live6" on={4}>
            <span className="strip-paper">{me.lede}</span>
          </Step>
        </div>

        <p className="cover__manifesto">
          {me.manifesto.map((word, i) => (
            <Step
              as="span"
              key={word}
              className={`cover__word cover__word--${i} paste live${[3, 4, 6][i]}`}
              on={i === 1 ? 2 : 3}
              offset={i}
              style={{ '--from': 0.36 + i * 0.13, '--span': 0.08, '--r': WORD_TILT[i] } as Vars}
            >
              {word}
            </Step>
          ))}
        </p>

        <Step className="cover__mascot" on={2}>
          <Mascot assemble wave waveLen={0.5} />
        </Step>

        <Step className="cover__issue live4" on={2} aria-hidden="true">
          <Burst />
          <span>
            bedava
            <br />
            zine
          </span>
        </Step>

        <Step className="cover__hint hand live3" on={2} aria-hidden="true">
          <span className="only-keys">klavyene bas, o çalsın</span>
          <span className="only-touch">ekrana vur, o çalsın</span>
          <Arrow />
        </Step>

        <Step className="cover__cue hand live4" on={2} aria-hidden="true">
          aşağı kaydır
          <Arrow />
        </Step>
      </div>
    </Shot>
  );
}
