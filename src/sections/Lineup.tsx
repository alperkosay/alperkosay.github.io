import type { CSSProperties } from 'react';
import { Burst, Tape } from '../components/Bits';
import { Shot } from '../components/Film';
import { Mascot, MascotHead, BLUES, type Drive } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { KADRO as K, PACE } from '../timeline';
import { agents, stack } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const PLATE_FACE = ["'Anton'", "'Abril Fatface'", "'Bungee'", "'Alfa Slab One'", "'Shrikhand'", "'Archivo Black'", "'DM Serif Display'", "'Bangers'", "'Rubik Mono One'"];
const PLATE_TONE = ['var(--yellow)', '#fff', 'var(--cyan)', 'var(--pink)', '#fff', 'var(--yellow)', 'var(--mint)', 'var(--pink)', '#fff'];
const AMP_TILT = [-1.5, 1, -0.5, 1.5, -1, 0.5, -2, 1.5, -1];
const AGENT_ON = [2, 3, 4, 6, 3, 2];

/** Maskot sahnedekilere tepki verir: Claude'da coşar, Ultra'da devrilir. */
const react = (p: number): Drive => {
  if (p < K.claude) return {};
  if (p < K.ultra) return { face: 'happy', energy: 0.9 };
  return { face: 'dead', energy: 1 };
};

/** Bir amfi: üstte isim plakası ve düğmeler, altta hoparlörler. */
function Amp({ name, face, tone, cones = 2 }: { name: string; face: string; tone: string; cones?: number }) {
  return (
    <div
      className="amp__box"
      style={{ '--tone': tone, '--len': name.length, clipPath: torn(name.length * 7 + cones, { top: 4, right: 4, bottom: 4, left: 4, n: 16 }) } as Vars}
    >
      <div className="amp__top">
        <span className="amp__plate" style={{ fontFamily: face }}>
          {name}
        </span>
        <span className="amp__knobs" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="amp__grille" aria-hidden="true">
        {Array.from({ length: cones }, (_, i) => (
          <i key={i} className="cone" style={{ '--ph': `${-(i * 0.17 + name.length * 0.05).toFixed(2)}s` } as Vars} />
        ))}
      </div>
    </div>
  );
}

/**
 * Çekim 3, kadro: bir konser sahnesi. Teknoloji yığını gerçekten yığılır:
 * her teknoloji gökten düşen bir amfidir ve duvar gibi üst üste dizilir.
 * Sonra sahneye Claude iner (dev bir amfi), yetmez, Ultra gelir (ekranı
 * dolduran bir hoparlör) ve maskotu uçurur. En sonda orkestra kurulur:
 * altı ajan, her biri gitardaki mavi dalganın bir şeridi.
 */
export function Lineup() {
  return (
    <Shot id="kadro" len={6} pace={PACE.kadro}>
      <div className="gig">
        <div className="beam beam--a live4" aria-hidden="true" />
        <div className="beam beam--b live6" aria-hidden="true" />
        <div className="gig__floor" aria-hidden="true" />

        <p className="gig__tag" aria-hidden="true">
          gürültü
        </p>

        <div className="gig__head">
          <Ransom as="h2" text="KADRO" seed={8} className="gig__h" />
          <p className="hand gig__sub live4">önce amfiler diziliyor</p>
        </div>

        <ul className="amps">
          {stack.map((name, i) => (
            <Step
              as="li"
              key={name}
              className="amp drop"
              on={[3, 2, 4][i % 3]}
              offset={i % 3}
              style={
                {
                  '--from': K.amps + i * K.ampStep,
                  '--col': (i % 3) + 1,
                  '--row': 3 - Math.floor(i / 3),
                  '--r': `${AMP_TILT[i % AMP_TILT.length]}deg`,
                  '--spin': `${i % 2 ? -14 : 14}deg`,
                } as Vars
              }
            >
              <Amp name={name} face={PLATE_FACE[i % PLATE_FACE.length]} tone={PLATE_TONE[i % PLATE_TONE.length]} />
              {i % 2 === 0 && <Tape className="amp__tape" />}
              {i % 3 === 1 && (
                <span className="amp__sticker" aria-hidden="true">
                  <Burst points={10} />
                </span>
              )}
            </Step>
          ))}
        </ul>

        <Step className="gig__mascot" on={2}>
          <Mascot drive={react} wave waveLen={0.6} flip />
        </Step>

        <Step as="p" className="cap hand live3" on={2} style={{ '--from': K.cap1[0], '--to': K.cap1[1] } as Vars}>
          sonra büyük babalar geldi
        </Step>

        <Step className="bigamp drop" on={3} style={{ '--from': K.claude, '--span': 0.05, '--r': '-1.5deg', '--spin': '8deg' } as Vars}>
          <Amp name="CLAUDE" face="'Anton'" tone="var(--cyan)" cones={4} />
          <p className="hand bigamp__kicker live4">ana sahne</p>
          <p className="bigamp__sub live6">
            <span className="strip-paper">kodu okur, yazar, test eder</span>
          </p>
        </Step>

        <Step as="p" className="cap cap--2 hand live3" on={2} style={{ '--from': K.cap2[0], '--to': K.cap2[1] } as Vars}>
          yetmedi
        </Step>

        <Step className="ultra paste" on={2} style={{ '--from': K.ultra, '--span': 0.05, '--zoom': 1.8 } as Vars}>
          <div className="ultra__cone" aria-hidden="true" />
          <div className="ultra__ring" aria-hidden="true" />
          <div className="ultra__ring ultra__ring--2" aria-hidden="true" />
          <p className="ultra__small">CLAUDE</p>
          <p className="ultra__word misreg live6">ULTRA</p>
          <p className="ultra__stamp">
            <Burst points={18} />
            <span>
              ses
              <br />
              11’de
            </span>
          </p>
          <p className="ultra__sub live4">
            <span className="strip-paper">aynı grup, ses sonuna kadar açık</span>
          </p>
        </Step>

        <Step as="p" className="cap cap--3 hand live3" on={2} style={{ '--from': K.cap3[0], '--to': K.cap3[1] } as Vars}>
          o da yetmedi
        </Step>

        <Step className="orchestra paste" on={4} style={{ '--from': K.orch, '--span': 0.05, '--spin': '-9deg' } as Vars}>
          <Ransom as="h3" text="CLAUDE ORKESTRASI" seed={17} className="orch__h" />

          <div className="orch">
            <div className="orch__chief live4">
              <MascotHead face="happy" />
              <span className="dymo">şef: ben</span>
            </div>
            <div className="orch__bow" aria-hidden="true" />
            <ul className="orch__agents">
              {agents.map((role, i) => (
                <li
                  key={role}
                  className="agent"
                  style={
                    {
                      '--i': i,
                      '--tone': BLUES[i % BLUES.length],
                      '--c1': BLUES[i % BLUES.length],
                      '--from': K.agents + i * K.agentStep,
                      '--d': `${(AGENT_ON[i % AGENT_ON.length] * 2) / 24}s`,
                    } as Vars
                  }
                >
                  <Step className="agent__hang" on={AGENT_ON[i % AGENT_ON.length]} offset={i % 2}>
                    <MascotHead face="code" glasses={false} />
                    <span className="dymo">{role}</span>
                  </Step>
                </li>
              ))}
            </ul>
          </div>

          <Step as="p" className="orch__line paste live6" on={3} style={{ '--from': K.line, '--span': 0.035, '--r': '-1deg', '--zoom': 0.5 } as Vars}>
            <span className="strip-paper">İşi parçalara bölerim, her parçayı ayrı bir Claude alır. Ben şeflik yaparım.</span>
          </Step>
        </Step>
      </div>
    </Shot>
  );
}
