import type { CSSProperties } from 'react';
import { Burst, Tear } from '../components/Bits';
import { MascotHead } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { agents, stack } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const ACT_FACE = ["'Anton'", "'Abril Fatface'", "'Bungee'", "'Alfa Slab One'", "'Shrikhand'", "'Archivo Black'", "'DM Serif Display'", "'Bangers'", "'Rubik Mono One'"];
const ACT_SKIN = ['white', 'ink', 'c2', 'white', 'c1', 'ink', 'c2', 'white', 'ink'];
const ACT_TILT = [-3, 2, -1, 3, -2, 1, -3, 2, -1];
const AGENT_ON = [2, 3, 4, 6, 3, 2];

/**
 * Kadro. Sayfa sabit durur, scroll afişleri üst üste yapıştırır:
 * önce ön gruplar, sonra Claude, sonra Ultra, en sonda orkestra.
 * Her afiş bir öncekinden büyüktür ve paleti keserek değiştirir.
 */
export function Lineup() {
  return (
    <section id="kadro" className="page lineup" data-scene="pin">
      <Tear seed={21} />
      <div className="lineup__pin">
        <div className="stage stage--acts">
          <Ransom as="h2" text="KADRO" seed={8} className="lineup__h" />
          <p className="hand lineup__sub">önce ön gruplar çıkıyor</p>
          <ul className="acts">
            {stack.map((name, i) => (
              <Step
                as="li"
                key={name}
                className={`act act--${ACT_SKIN[i % ACT_SKIN.length]} paste`}
                on={[3, 2, 4][i % 3]}
                offset={i % 3}
                style={
                  {
                    '--from': 0.025 + i * 0.02,
                    '--span': 0.03,
                    '--r': `${ACT_TILT[i % ACT_TILT.length]}deg`,
                    fontFamily: ACT_FACE[i % ACT_FACE.length],
                  } as Vars
                }
              >
                {name}
              </Step>
            ))}
          </ul>
        </div>

        <Step as="p" className="cap hand" on={2} style={{ '--from': 0.215, '--to': 0.33 } as Vars}>
          sonra büyük babalar geldi
        </Step>

        <Step className="poster poster--claude paste" on={3} style={{ '--from': 0.26, '--span': 0.07, '--r': '-3deg' } as Vars}>
          <div className="poster__paper" style={{ clipPath: torn(23, { top: 12, right: 14, bottom: 16, left: 10, n: 34 }) }}>
            <p className="hand poster__kicker">ana sahne</p>
            <p className="poster__big">CLAUDE</p>
            <p className="poster__sub">
              <span className="strip">kodu okur, yazar, test eder</span>
            </p>
          </div>
        </Step>

        <Step as="p" className="cap cap--2 hand" on={2} style={{ '--from': 0.435, '--to': 0.545 } as Vars}>
          yetmedi
        </Step>

        <Step className="poster poster--ultra paste" on={2} style={{ '--from': 0.475, '--span': 0.07, '--r': '2deg', '--zoom': 1.8 } as Vars}>
          <div className="poster__paper" style={{ clipPath: torn(27, { top: 14, right: 12, bottom: 14, left: 12, n: 34 }) }}>
            <p className="poster__small">CLAUDE</p>
            <p className="poster__big">ULTRA</p>
            <p className="poster__stamp">
              <Burst points={18} />
              <span>
                ses
                <br />
                11’de
              </span>
            </p>
            <p className="poster__sub">
              <span className="strip">aynı grup, ses sonuna kadar açık</span>
            </p>
          </div>
        </Step>

        <Step as="p" className="cap cap--3 hand" on={2} style={{ '--from': 0.64, '--to': 0.74 } as Vars}>
          o da yetmedi
        </Step>

        <Step className="poster poster--orch paste" on={4} style={{ '--from': 0.68, '--span': 0.06, '--r': '0deg', '--spin': '-9deg' } as Vars}>
          <div className="poster__paper" style={{ clipPath: torn(29, { top: 16, bottom: 16, n: 60 }) }}>
            <Ransom as="h3" text="CLAUDE ORKESTRASI" seed={17} className="orch__h" />

            <div className="orch">
              <div className="orch__chief">
                <MascotHead face="happy" />
                <span className="dymo">şef: ben</span>
              </div>
              <ul className="orch__agents">
                {agents.map((role, i) => (
                  <li
                    key={role}
                    className="agent"
                    style={{ '--i': i, '--from': 0.755 + i * 0.024, '--d': `${(AGENT_ON[i % AGENT_ON.length] * 2) / 24}s` } as Vars}
                  >
                    <Step className="agent__hang" on={AGENT_ON[i % AGENT_ON.length]} offset={i % 2}>
                      <MascotHead face="code" />
                      <span className="dymo">{role}</span>
                    </Step>
                  </li>
                ))}
              </ul>
            </div>

            <Step as="p" className="orch__line paste" on={3} style={{ '--from': 0.915, '--span': 0.04, '--r': '-1deg', '--zoom': 0.5 } as Vars}>
              <span className="strip">İşi parçalara bölerim, her parçayı ayrı bir Claude alır. Ben şeflik yaparım.</span>
            </Step>
          </div>
        </Step>
      </div>
    </section>
  );
}
