import type { CSSProperties, ReactNode } from 'react';
import { Arrow, Tape, Tear } from '../components/Bits';
import { MascotHead, type Face } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { Step } from '../engine/Step';
import { about, aboutNote } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const BOOTH: Face[] = ['open', 'happy', 'wink', 'dead'];

/** *yıldız arası* kısımları fosforlu kalemle işaretler. */
function marked(text: string): ReactNode[] {
  return text.split('*').map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

export function About() {
  return (
    <section id="hakkimda" className="page about" data-scene="through">
      <Tear seed={11} />
      <div className="about__grid">
        <Step className="about__booth" self="enter" on={4}>
          <Tape className="tape--top" />
          <div className="booth">
            {BOOTH.map((face, i) => (
              <div className={`booth__frame booth__frame--${i}`} key={face}>
                <MascotHead face={face} />
              </div>
            ))}
          </div>
          <p className="hand about__boothnote">vesikalık, temsili</p>
        </Step>

        <div className="about__text">
          <Ransom as="h2" text="HAKKIMDA" seed={5} className="about__h" drop />
          {about.map((p, i) => (
            <Step
              as="p"
              key={i}
              className="about__p"
              self="enter"
              on={i === 1 ? 4 : 3}
              offset={i}
              style={{ '--tilt': `${[-1.2, 0.9, -0.6][i % 3]}deg`, '--sx': i % 2 ? '9vw' : '-9vw' } as Vars}
            >
              {i === 0 && <Tape className="tape--corner" />}
              {marked(p)}
            </Step>
          ))}
          <Step className="about__note hand" self="enter" on={2}>
            {aboutNote}
            <Arrow />
          </Step>
        </div>
      </div>
    </section>
  );
}
