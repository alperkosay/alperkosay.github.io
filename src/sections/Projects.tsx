import { useEffect, useRef, type CSSProperties } from 'react';
import { Arrow, Burst, Tear } from '../components/Bits';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { links, projects } from '../content';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const TILT = [-3, 2.5, -1.5, 3, -2.5, 1.5, -2];
const DROP = ['-8vh', '7vh', '-3vh', '9vh', '-9vh', '5vh', '-5vh'];
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

/**
 * Projeler: afiş yapıştırılmış bir duvar. Geniş ekranda sayfa sabitlenir ve
 * scroll duvar boyunca yana yürütür. Yürüyüş akıcıdır (kamera), afişler,
 * bantlar ve çıkartmalar ise kendi kare hızlarında sallanır.
 */
export function Projects() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = wrap.current;
    const row = track.current;
    if (!section || !row) return;

    const mq = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    const fit = () => {
      // Yana kayılacak mesafe kadar dikey scroll: 1 piksel aşağı, 1 piksel yana.
      section.style.height = mq.matches ? `${row.scrollWidth - window.innerWidth + window.innerHeight}px` : '';
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    window.addEventListener('resize', fit);
    mq.addEventListener('change', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
      mq.removeEventListener('change', fit);
    };
  }, []);

  return (
    <section id="projeler" className="page wall" data-scene="pin" ref={wrap}>
      <Tear seed={31} />
      <div className="wall__pin">
        <Step className="wall__mover" on={0}>
          <Step className="wall__dress" on={4} aria-hidden="true" />
          <div className="wall__track" ref={track}>
            <div className="wall__title">
              <h2 className="wall__h">Projeler</h2>
              <p className="hand wall__sub">
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
                    '--r': `${TILT[i % TILT.length]}deg`,
                    '--oy': DROP[i % DROP.length],
                  } as Vars
                }
              >
                <Step className="flyer__body" on={3} offset={i % 3}>
                  <div
                    className="flyer__paper jit"
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
                <Step className="flyer__spot" on={2} aria-hidden="true">
                  <Burst points={10 + (i % 3) * 3} />
                </Step>
              </article>
            ))}

            <div className="wall__end">
              <p className="hand">gerisi GitHub’da</p>
              <a className="dymo jit" href={links[0].href}>
                github.com/{links[0].handle}
              </a>
            </div>
          </div>
        </Step>
      </div>
    </section>
  );
}
