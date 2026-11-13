import type { CSSProperties } from 'react';
import { Arrow, Burst } from '../components/Bits';
import { Mascot } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { me } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const WORD_TILT = ['-4deg', '3deg', '-2deg'];

/** Kapak. Aşağı kaydırınca harfler dağılır, altından manifesto çıkar. */
export function Cover() {
  return (
    <header id="kapak" className="page cover" data-scene="pin">
      <div className="cover__pin">
        <Step className="cover__slab" on={4} aria-hidden="true" style={{ clipPath: torn(2, { left: 34, n: 40 }) }} />
        <Step className="cover__dots" on={6} offset={2} aria-hidden="true" />
        <Step className="cover__floor" on={6} aria-hidden="true" style={{ clipPath: torn(9, { top: 16, n: 60 }) }} />

        <div className="cover__title">
          <Ransom as="h1" text="ALPER KOŞAY" seed={3} scatter intro className="cover__name" />
          <Step as="p" className="cover__role" on={3} offset={1}>
            <span className="dymo">{me.role}</span>
          </Step>
          <Step as="p" className="cover__lede" on={4}>
            <span className="strip">{me.lede}</span>
          </Step>
        </div>

        <p className="cover__manifesto">
          {me.manifesto.map((word, i) => (
            <Step
              as="span"
              key={word}
              className={`cover__word cover__word--${i} paste`}
              on={i === 1 ? 2 : 3}
              offset={i}
              style={{ '--from': 0.4 + i * 0.15, '--span': 0.09, '--r': WORD_TILT[i] } as Vars}
            >
              {word}
            </Step>
          ))}
        </p>

        <Step className="cover__mascot" on={3}>
          <Mascot />
        </Step>

        <Step className="cover__issue" on={2} aria-hidden="true">
          <Burst />
          <span>
            bedava
            <br />
            zine
          </span>
        </Step>

        <Step className="cover__cue hand" on={2} aria-hidden="true">
          aşağı kaydır
          <Arrow />
        </Step>
      </div>
    </header>
  );
}
