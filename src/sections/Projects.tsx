import { useEffect, useRef, type CSSProperties } from 'react';
import { Arrow, Burst } from '../components/Bits';
import { Shot } from '../components/Film';
import { Mascot } from '../components/Mascot';
import { CUT, projector } from '../engine/projector';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { PACE } from '../timeline';
import { links, projects } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const TILT = [-3, 2.5, -1.5, 3, -2.5, 1.5, -2];
const DROP = ['0vh', '7vh', '2vh', '9vh', '1vh', '7vh', '3vh'];
/** Yazı tipinin ortalama harf genişliği (em). Afiş adı tek satıra sığsın diye. */
const FACE_WIDTH: Record<string, number> = {
  "'Anton'": 0.5,
  "'Abril Fatface'": 0.6,
  "'Bungee'": 0.8,
  "'Alfa Slab One'": 0.7,
  "'Bangers'": 0.52,
  "'Shrikhand'": 0.64,
  "'Archivo Black'": 0.7,
};
/** Duvar durduktan sonra çekimin ekranda kaldığı süre, ekran yüksekliği cinsinden. */
const HOLD = 0.4;

/**
 * Çekim 4, projeler. Bir yan yürüyüş: scroll maskotu afiş yapıştırılmış
 * duvar boyunca yürütür. Yürüyüş akıcıdır (kamera), bacaklar 3 karede bir
 * adım atar. Maskotun önüne gelen afiş renklenir, gerisi fotokopi kalır.
 */
export function Projects() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = wrap.current;
    const row = track.current;
    if (!section || !row) return;

    const mq = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const fit = () => {
      if (!mq.matches) {
        section.style.height = '';
        return;
      }
      // Çekimin boyu: kesme + duvarın yana kayacağı mesafe + sonda kısa bir bekleme.
      const vh = window.innerHeight;
      const lead = vh * CUT;
      const travel = Math.max(0, row.scrollWidth - window.innerWidth);
      const total = lead + travel + vh * HOLD;
      section.style.height = `${total}px`;
      section.style.setProperty('--c0', (lead / total).toFixed(4));
      section.style.setProperty('--c1x', ((lead + travel) / total).toFixed(4));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    window.addEventListener('resize', fit);
    mq.addEventListener('change', fit);

    // Maskotun önündeki afişi bul ve canlandır.
    const flyers = [...row.querySelectorAll<HTMLElement>('.flyer')];
    let live: HTMLElement | null = null;
    const offTick = projector.onTick((f, st) => {
      if (st.reduced || f % 3 || !section.hasAttribute('data-on')) return;
      const aim = st.vw * (st.vw < 820 ? 0.5 : 0.56);
      let best: HTMLElement | null = null;
      let dist = Infinity;
      for (const el of flyers) {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - aim);
        if (d < dist) {
          dist = d;
          best = el;
        }
      }
      if (best && dist > st.vw * 0.42) best = null;
      if (best !== live) {
        live?.classList.remove('is-live');
        best?.classList.add('is-live');
        live = best;
      }
    });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
      mq.removeEventListener('change', fit);
      offTick();
    };
  }, []);

  return (
    <Shot id="projeler" pace={PACE.isler} sectionRef={wrap}>
      <div className="wall__pin">
        <Step className="wall__mover" on={0}>
          <Step className="wall__dress" on={4} aria-hidden="true" />
          <div className="wall__track" ref={track}>
            <div className="wall__title">
              <h2 className="wall__h live6">Projeler</h2>
              <p className="hand wall__sub live3">
                duvara yapıştırdıklarım
                <Arrow />
              </p>
            </div>

            {projects.map((p, i) => (
              <article
                key={p.name}
                className="flyer"
                style={
                  {
                    '--paper': p.paper,
                    '--ink': p.ink,
                    '--spot': p.spot,
                    '--spot-ink': p.spotInk ?? '#000',
                    '--len': Math.max(...p.name.split(' ').map((w) => w.length)),
                    '--fw': FACE_WIDTH[p.face] ?? 0.65,
                    '--i': i,
                    '--tilt': `${TILT[i % TILT.length]}deg`,
                    '--oy': DROP[i % DROP.length],
                  } as Vars
                }
              >
                <Step className="flyer__body" on={3} offset={i % 3}>
                  <div
                    className="flyer__paper"
                    style={{ clipPath: torn(40 + i, { top: i % 2 ? 9 : 0, right: i % 3 ? 0 : 8, left: i % 3 === 1 ? 8 : 0, n: 30 }) }}
                  >
                    <p className="flyer__kind">{p.kind}</p>
                    <h3 className="flyer__name" style={{ fontFamily: p.face }}>
                      {p.name}
                    </h3>
                    <p className="flyer__text">{p.text}</p>
                    <ul className="flyer__stack">
                      {p.stack.map((s) => (
                        <li key={s} className="dymo">
                          {s}
                        </li>
                      ))}
                    </ul>
                    <div className="flyer__tabs">
                      <a href={p.repo} aria-label={`${p.name}: kodu gör`}>
                        Kodu gör
                      </a>
                      {p.live && (
                        <a href={p.live} aria-label={`${p.name}: canlıda aç`}>
                          Canlıda aç
                        </a>
                      )}
                    </div>
                  </div>
                </Step>
                <Step as="span" className="tape flyer__tape" on={4} offset={1} aria-hidden="true" />
                <div className="flyer__spot" aria-hidden="true">
                  <Burst points={10 + (i % 3) * 3} />
                </div>
              </article>
            ))}

            <div className="wall__end">
              <p className="hand live4">gerisi GitHub’da</p>
              <a className="dymo live3" href={links[0].href}>
                github.com/{links[0].handle}
              </a>
            </div>
          </div>
        </Step>

        <Step className="wall__floor" on={2} aria-hidden="true" style={{ clipPath: torn(51, { top: 10, n: 70 }) }} />
        <div className="wall__walker">
          <Mascot act="walk" wave />
        </div>
      </div>
    </Shot>
  );
}
