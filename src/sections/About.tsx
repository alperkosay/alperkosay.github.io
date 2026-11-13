import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Arrow, Burst, Tape } from '../components/Bits';
import { Shot } from '../components/Film';
import { Mascot, MascotHead, BLUES, type Drive, type Face } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { projector } from '../engine/projector';
import { rng, torn } from '../engine/rand';
import { Step } from '../engine/Step';
import { BEN, PACE } from '../timeline';
import { about, aboutAsk, made } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Balondaki yazı, kameranın panelde durduğu sürenin bu kadarında söylenir. */
const SAY = 0.6;
const MOODS: Face[] = ['open', 'happy', 'wink'];

const sayingAt = (i: number, p: number) => {
  const { from, to } = BEN.panels[i];
  return p > from && p < from + (to - from) * SAY;
};
/** Maskot kendi panelinde yazı çıkarken konuşur. */
const speak =
  (i: number) =>
  (p: number): Drive =>
    sayingAt(i, p) ? { face: 'talk' } : { face: MOODS[i] };

const SHOUT_FACE = ["'Anton'", "'Alfa Slab One'", "'Bungee'", "'Archivo Black'", "'Shrikhand'"];
const SHOUT_SKIN = ['c1', 'y', 'c2'];

/**
 * Konuşma balonu, fidye mektubu gibi: yırtık siyah bir kağıt, üstünde her
 * kelime ayrı kesilip yapıştırılmış bir şerit. *Yıldız arası* kelimeler başka
 * dergiden kesilmiş gibi büyük ve renkli. Kelimeler scroll ile tek tek yapışır.
 */
function Balloon({ i, className = '' }: { i: number; className?: string }) {
  const { from, to } = BEN.panels[i];
  const r = rng(77 + i * 13);
  let w = 0;
  const words: ReactNode[] = [];
  about[i].split('*').forEach((part, pi) => {
    const loud = pi % 2 === 1;
    part
      .split(' ')
      .filter(Boolean)
      .forEach((word) => {
        const skin = loud ? `tw--shout tw--${SHOUT_SKIN[w % SHOUT_SKIN.length]}` : r() < 0.16 ? 'tw--news' : '';
        const style = {
          '--w': w,
          '--r': `${((r() - 0.5) * (loud ? 8 : 4.5)).toFixed(1)}deg`,
          fontFamily: loud ? SHOUT_FACE[w % SHOUT_FACE.length] : undefined,
        } as Vars;
        words.push(
          <span key={w++} className={`tw ${skin}`} style={style}>
            {word}
          </span>,
          ' ',
        );
      });
  });
  return (
    <Step className={`balloon ${className}`} on={2} style={{ '--from': from, '--span': (to - from) * SAY, '--n': w } as Vars}>
      <span className="balloon__back" aria-hidden="true" style={{ clipPath: torn(90 + i, { top: 9, right: 9, bottom: 9, left: 9, n: 18 }) }} />
      <span className="balloon__tail" aria-hidden="true" />
      <p className="balloon__sheet" style={{ clipPath: torn(80 + i, { top: 8, right: 8, bottom: 10, left: 8, n: 20 }) }}>
        {words}
      </p>
      <Tape className="balloon__tape live4" />
    </Step>
  );
}

/** Panellerin kenarı makasla kesilmiş gibi. */
const PANEL_CUT = [0, 1, 2, 3].map((i) => torn(60 + i, { top: 5, right: 5, bottom: 5, left: 5, n: 34 }));

/** Kameranın durakları: üç panel, sayfanın tamamı, sonra dördüncü panel. x ve y panel sırasıdır. */
const STOPS = [
  { p: 0, x: 0, y: 0, s: 1 },
  { p: BEN.panels[0].to, x: 0, y: 0, s: 1 },
  { p: BEN.panels[1].from, x: 1, y: 0, s: 1 },
  { p: BEN.panels[1].to, x: 1, y: 0, s: 1 },
  { p: BEN.panels[2].from, x: 0, y: 1, s: 1 },
  { p: BEN.panels[2].to, x: 0, y: 1, s: 1 },
  { p: BEN.wide, x: 0, y: 0, s: 0.5 },
  { p: BEN.hold, x: 0, y: 0, s: 0.5 },
  { p: BEN.dive, x: 1, y: 1, s: 1 },
  { p: 1, x: 1, y: 1, s: 1 },
];
/** Kadroya dalarken kamera dördüncü panelin ortasına bu kadar daha yaklaşır. */
const DIVE_ZOOM = 7;

/**
 * Çekim 2, hakkımda: hareketli bir çizgi roman sayfası. Dört panel ekranın
 * iki katı büyüklükte bir sayfaya dizilidir; kamera panelden panele atlar,
 * maskot her panelde bir şey anlatır, sonra kamera açılır ve sayfanın tamamı
 * görünür. En sonda kamera dördüncü panele ("sıradaki sayfa: kadro") yaklaşır,
 * panel ekranı doldurur ve kamera içinden geçip kadroya çıkar. Çekimin kendisi
 * de kapaktaki maskotun ekranından açılır.
 */
export function About() {
  const cam = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return projector.onTick((f, st) => {
      const el = cam.current;
      const shot = el?.closest<HTMLElement>('.shot');
      if (!el || !shot || st.reduced) return;
      if (!shot.hasAttribute('data-on') && !shot.hasAttribute('data-under')) return;
      const stage = shot.firstElementChild as HTMLElement;

      // Kesme sürerken: açıklık kapaktaki maskotun ekranından başlar.
      if (parseFloat(shot.style.getPropertyValue('--cut') || '1') < 1) {
        const screen = document.querySelector('.shot--kapak .m-screen');
        if (screen) {
          const r = screen.getBoundingClientRect();
          const box = stage.getBoundingClientRect();
          shot.style.setProperty('--it', `${Math.max(0, r.top - box.top).toFixed(0)}px`);
          shot.style.setProperty('--il', `${Math.max(0, r.left - box.left).toFixed(0)}px`);
          shot.style.setProperty('--ir', `${Math.max(0, box.right - r.right).toFixed(0)}px`);
          shot.style.setProperty('--ib', `${Math.max(0, box.bottom - r.bottom).toFixed(0)}px`);
        }
      }

      if (f % 2) return;
      const p = projector.progressOf(el);

      // Kamera: iki durak arasında doğrusal gider, 2 karede bir poz değiştirir.
      let k = 1;
      while (k < STOPS.length - 1 && STOPS[k].p < p) k++;
      const a = STOPS[k - 1];
      const b = STOPS[k];
      const u = Math.min(1, Math.max(0, (p - a.p) / Math.max(0.0001, b.p - a.p)));
      const mix = (from: number, to: number) => from + (to - from) * u;
      let s = mix(a.s, b.s);
      let x = mix(-a.x * a.s, -b.x * b.s) * stage.clientWidth;
      let y = mix(-a.y * a.s, -b.y * b.s) * stage.clientHeight;

      // Kadroya kesilirken: kamera dördüncü panelin ortasına dalmaya devam eder.
      const out = parseFloat(shot.style.getPropertyValue('--out') || '0');
      if (out > 0) {
        s = 1 + out * out * DIVE_ZOOM;
        x = stage.clientWidth * (0.5 - 1.5 * s);
        y = stage.clientHeight * (0.5 - 1.5 * s);
      }
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;

      // İlk paneldeki dev kafa: yazı çıkarken konuşur.
      const head = el.querySelector<SVGElement>('.panel--1 .mascot-head');
      if (head) {
        const face: Face = sayingAt(0, p) ? (f % 6 < 3 ? 'talk' : 'open') : f % 90 < 4 ? 'blink' : 'open';
        if (head.dataset.face !== face) head.dataset.face = face;
      }
    });
  }, []);

  return (
    <Shot id="hakkimda" len={4.6} pace={PACE.ben}>
      <div className="comic">
        <div className="comic__cam" ref={cam}>
          <section className="panel panel--1" style={{ clipPath: PANEL_CUT[0] }}>
            <div className="panel__rays" aria-hidden="true" />
            <div className="panel__hero panel__hero--head" aria-hidden="true">
              <MascotHead face="open" faces={['open', 'talk', 'blink']} />
            </div>
            <p className="hand note note--1 live3" aria-hidden="true">
              bu benim
              <Arrow />
            </p>
            <div className="panel__copy">
              <Ransom as="h2" text="HAKKIMDA" seed={5} className="panel__h" />
              <p className="capbox live4">{aboutAsk[0]}</p>
              <Balloon i={0} className="live6" />
            </div>
          </section>

          <section className="panel panel--2" style={{ clipPath: PANEL_CUT[1] }}>
            <div className="panel__dots dots-live" aria-hidden="true" />
            <div className="panel__copy">
              <p className="capbox live3">{aboutAsk[1]}</p>
              <Balloon i={1} className="balloon--right live6" />
            </div>
            <div className="panel__hero" aria-hidden="true">
              <Mascot drive={speak(1)} wave waveLen={0.75} />
            </div>
            {made.map((thing, i) => (
              <span key={thing} className={`made made--${i} live${[3, 4, 6][i % 3]}`} aria-hidden="true">
                {thing}
              </span>
            ))}
          </section>

          <section className="panel panel--3" style={{ clipPath: PANEL_CUT[2] }}>
            <div className="panel__dots dots-live" aria-hidden="true" />
            <div className="panel__hero" aria-hidden="true">
              <Mascot act="wave" drive={speak(2)} />
            </div>
            <p className="hand note note--3 live4" aria-hidden="true">
              şef modu
            </p>
            <div className="panel__copy">
              <p className="capbox live4">{aboutAsk[2]}</p>
              <Balloon i={2} className="live6" />
              <ul className="choir" aria-hidden="true">
                {BLUES.map((color, i) => (
                  <li key={color} className={`live${[3, 4, 6][i % 3]}`} style={{ '--c1': color, '--ph': `${-i * 0.09}s`, '--wr': '5deg', '--wt': '3px' } as Vars}>
                    <MascotHead face="code" glasses={false} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel panel--4" aria-hidden="true" style={{ clipPath: PANEL_CUT[3] }}>
            <div className="panel__next">
              <Burst points={20} />
              <p>
                sıradaki
                <br />
                sayfa
                <br />
                <b>KADRO</b>
              </p>
            </div>
            <p className="hand panel__turn live3">
              içine dal
              <Arrow />
            </p>
          </section>
        </div>
      </div>
    </Shot>
  );
}
