import type { CSSProperties } from 'react';
import { Band, Tape } from '../components/Bits';
import { Shot } from '../components/Film';
import { Mascot } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { PACE } from '../timeline';
import { links, me } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const BAND = me.manifesto.map((w) => w.replace('.', ''));
const TILT = ['-2.5deg', '2deg', '-1.5deg', '3deg'];

/**
 * Çekim 5, çıkış. Projeler duvarı sayfa gibi çevrilir, altından bu çıkar:
 * her link kocaman bir konser bileti. Bilete bas, kapıdan gir.
 */
export function BackCover() {
  return (
    <Shot id="linkler" len={2.3} pace={PACE.cikis}>
      <div className="back__pin">
        <Band words={BAND} />

        <div className="back__left">
          <Ransom as="h2" text="LİNKLER" seed={23} drop className="back__h" />
          <ul className="tickets">
            {links.map((link, i) => (
              <Step
                as="li"
                key={link.href}
                className="paste"
                on={i % 2 ? 2 : 3}
                style={{ '--from': 0.36 + i * 0.1, '--span': 0.07, '--r': TILT[i % TILT.length] } as Vars}
              >
                <a
                  className={`ticket ticket--${i % 2} live${i % 2 ? 4 : 6}`}
                  href={link.href}
                  style={{ clipPath: torn(120 + i, { top: 5, right: 7, bottom: 6, left: 7, n: 30 }) }}
                >
                  <span className="ticket__stub" aria-hidden="true">
                    giriş
                    <br />
                    serbest
                  </span>
                  <span className="ticket__main">
                    <b>{link.label}</b>
                    <span>{link.handle}</span>
                  </span>
                  <span className="ticket__go" aria-hidden="true">
                    aç
                  </span>
                </a>
                <Tape className="ticket__tape live4" />
              </Step>
            ))}
          </ul>
        </div>

        <Step className="back__mascot" on={3}>
          <Mascot act="wave" flip wave waveLen={0.7} />
        </Step>

        <Step className="back__floor live6" on={6} aria-hidden="true" style={{ clipPath: torn(47, { top: 16, n: 60 }) }} />

        <Step as="p" className="colophon" on={3}>
          © {me.year} {me.name}. Elle kesildi, React ile yapıştırıldı, 24 karede oynatıldı.
        </Step>
      </div>
    </Shot>
  );
}
