import { Tape, Tear } from '../components/Bits';
import { Mascot } from '../components/Mascot';
import { Ransom } from '../components/Ransom';
import { Step } from '../engine/Step';
import { torn } from '../engine/rand';
import { links, me } from '../content';

const SLOTS = 7;
/** Bu sıradaki fiş çoktan koparılmış. */
const GONE = 3;

/** Arka kapak: altından fiş koparılan ilan. Her fiş bir link. */
export function BackCover() {
  const seen = new Set<string>();
  let n = 0;
  const stubs = Array.from({ length: SLOTS }, (_, i) => {
    if (i === GONE) return null;
    const link = links[n++ % links.length];
    // İlanlarda aynı numara her fişte tekrar eder. Klavye ve ekran okuyucu
    // her linki bir kez görsün diye tekrarlar gizlenir.
    const first = !seen.has(link.href);
    seen.add(link.href);
    return { link, first };
  });

  return (
    <footer id="linkler" className="page back" data-scene="through">
      <Tear seed={41} />
      <div className="back__grid">
        <div className="back__left">
          <Ransom as="h2" text="LİNKLER" seed={23} className="back__h" drop />
          <Step className="notice" self="enter" on={3}>
            <Tape className="tape--top" />
            <div className="notice__paper" style={{ clipPath: torn(43, { top: 7, n: 40 }) }}>
              <p className="notice__h">Devamı burada</p>
              <p className="notice__text">Kodun tamamı ve yeni işler bu adreslerde. Alttan bir fiş kopar.</p>
              <ul className="notice__stubs">
                {stubs.map((s, i) =>
                  s ? (
                    <li key={i}>
                      <a className="stub" href={s.link.href} aria-hidden={s.first ? undefined : true} tabIndex={s.first ? undefined : -1}>
                        <b>{s.link.label}</b>
                        <span>{s.link.handle}</span>
                      </a>
                    </li>
                  ) : (
                    <li key={i} className="stub--gone" aria-hidden="true" />
                  ),
                )}
              </ul>
            </div>
          </Step>
        </div>

        <Step className="back__mascot" self="enter" on={3}>
          <Mascot variant="wave" />
        </Step>
      </div>

      <div className="back__floor" aria-hidden="true" style={{ clipPath: torn(47, { top: 16, n: 60 }) }} />

      <p className="colophon">
        © {me.year} {me.name}. Elle kesildi, React ile yapıştırıldı, 24 karede oynatıldı. Gövde 3 karede bir, yelek 2 kare
        geriden, klavye 4 karede bir poz değiştirir. Çizgi sadece bir şey hareket ederken titrer.
      </p>
    </footer>
  );
}
