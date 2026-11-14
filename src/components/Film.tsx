import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type Ref } from 'react';
import { projector } from '../engine/projector';
import { isSoundOn, pluck, setSound } from '../engine/sound';
import { rng } from '../engine/rand';
import { hits, sections } from '../content';
import { Burst } from './Bits';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

interface ShotProps {
  id: string;
  /** Çekimin uzunluğu, ekran yüksekliği cinsinden. */
  len?: number;
  /** Otomatik oynatmada bu çekimin hızı, saniyede ekran yüksekliği. */
  pace?: number;
  first?: boolean;
  className?: string;
  sectionRef?: Ref<HTMLElement>;
  children: ReactNode;
}

/**
 * Bir çekim. Ekrana sabitlenir, scroll içinde ilerletir, bitince bir
 * sonrakine kesilir. Sayfa aşağı akmaz, film oynar.
 */
export function Shot({ id, len = 2.5, pace, first, className = '', sectionRef, children }: ShotProps) {
  const own = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (own.current) projector.addShot(own.current);
  }, []);

  const setRef = (el: HTMLElement | null) => {
    own.current = el;
    if (typeof sectionRef === 'function') sectionRef(el);
    else if (sectionRef) sectionRef.current = el;
  };

  return (
    <section
      ref={setRef}
      id={id}
      className={`shot shot--${id} page ${className}`}
      data-scene="film"
      data-pace={pace}
      data-on={first ? '' : undefined}
      style={{ '--len': len } as Vars}
    >
      <div className="shot__stage">{children}</div>
    </section>
  );
}

/**
 * Açılış: film başlığı gibi bir "Oynat" ekranı. Tarayıcılar ilk dokunuştan
 * önce ses çalmaya izin vermediği için ses ve otomatik oynatma buradan açılır.
 */
export function Gate() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Hareket istemeyen kullanıcıya kapı yok, düz sayfa hemen gelir.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      projector.roll();
      setOpen(false);
      return;
    }
    document.documentElement.classList.add('is-gated');
    return () => document.documentElement.classList.remove('is-gated');
  }, []);

  const start = (auto: boolean) => {
    document.documentElement.classList.remove('is-gated');
    setSound(true);
    projector.roll();
    projector.setAuto(auto);
    pluck('e');
    projector.strum('hit');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-label="Filmi başlat">
      <div className="gate__leader" aria-hidden="true">
        <span>3</span>
      </div>
      <p className="gate__title">
        <span className="hand">bir</span> Alper Koşay <span className="hand">filmi</span>
      </p>
      <button type="button" className="gate__play" onClick={() => start(true)} autoFocus>
        Oynat
      </button>
      <button type="button" className="gate__skip" onClick={() => start(false)}>
        Kendim kaydıracağım
      </button>
      <p className="gate__note">Ses açık başlar. Alttaki şeritten kapatabilirsin.</p>
    </div>
  );
}

/**
 * Film şeridi: sitenin menüsü. Solda oynat/durdur, ortada çekimler (pembe
 * çizgi oynatma kafası), sağda kare sayacı ve ses düğmesi.
 */
export function FilmStrip() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(false);
  const [sound, setSoundOn] = useState(false);
  const head = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let shown = 0;
    let wasAuto = false;
    let wasSound = false;
    return projector.onTick((f, st) => {
      if (f % 2) return;
      if (st.shot !== shown) setActive((shown = st.shot));
      if (st.auto !== wasAuto) setAuto((wasAuto = st.auto));
      if (isSoundOn() !== wasSound) setSoundOn((wasSound = isSoundOn()));
      if (head.current) head.current.style.left = `${(((st.shot + st.shotP) / sections.length) * 100).toFixed(2)}%`;
      if (count.current) count.current.textContent = String(Math.round((st.scrollY / st.vh) * 24)).padStart(4, '0');
    });
  }, []);

  const go = (e: MouseEvent, id: string) => {
    e.preventDefault();
    projector.jumpTo(id);
  };

  const toggleSound = () => {
    const next = !isSoundOn();
    setSound(next);
    setSoundOn(next);
    if (next) pluck('e');
  };

  return (
    <>
      <p className="nudge hand" aria-hidden="true">
        film durdu: kaydır ya da oynat’a bas
      </p>
      <nav className="strip" aria-label="Sahneler">
        <button type="button" className="strip__btn strip__play" aria-pressed={auto} onClick={() => projector.setAuto(!projector.state.auto)}>
          {auto ? 'durdur' : 'oynat'}
        </button>
        <ol className="strip__frames">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={(e) => go(e, s.id)} aria-current={active === i ? 'true' : undefined}>
                {s.label}
              </a>
            </li>
          ))}
          <span ref={head} className="strip__head" aria-hidden="true" />
        </ol>
        <span className="strip__count" aria-hidden="true">
          kare <span ref={count}>0000</span>
        </span>
        <button type="button" className="strip__btn strip__amp" aria-pressed={sound} onClick={toggleSound}>
          ses {sound ? 'açık' : 'kapalı'}
        </button>
      </nav>
    </>
  );
}

const FACES = ["'Anton'", "'Abril Fatface'", "'Alfa Slab One'", "'Bungee'", "'Archivo Black'", "'Shrikhand'", "'Bangers'", "'Special Elite'"];
const SKINS = ['ink', 'paper', 'c1', 'c2', 'white', 'news'];
/** Çıkartma bu kadar kalır. film.css'teki `.scrap` soyulma gecikmesiyle birlikte değiştir. */
const LIFE_MS = 1800;
const MAX = 18;

interface Scrap {
  id: number;
  kind: 'letter' | 'hit';
  text: string;
  style: Vars;
  face: string;
  skin: string;
}

/**
 * Klavyeden basılan her harf ekrana kesilmiş kağıt olarak yapışır,
 * her tıklama bir patlama çıkartması bırakır. İkisi de maskota penayı
 * sertçe vurdurur ve açık bir nota çalar.
 */
export function PasteLayer() {
  const [scraps, setScraps] = useState<Scrap[]>([]);

  useEffect(() => {
    const rand = rng(Date.now() & 0xffff);
    let next = 1;

    const add = (kind: Scrap['kind'], text: string, x: number, y: number) => {
      const id = next++;
      const scrap: Scrap = {
        id,
        kind,
        text,
        face: FACES[Math.floor(rand() * FACES.length)],
        skin: SKINS[Math.floor(rand() * SKINS.length)],
        style: { left: `${x.toFixed(1)}%`, top: `${y.toFixed(1)}%`, '--r': `${((rand() - 0.5) * 34).toFixed(0)}deg` },
      };
      setScraps((list) => [...list.slice(-(MAX - 1)), scrap]);
      window.setTimeout(() => setScraps((list) => list.filter((s) => s.id !== id)), LIFE_MS);
    };

    const ready = () => projector.state.rolling && !projector.state.reduced;

    const onKey = (e: KeyboardEvent) => {
      if (!ready() || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.key.length !== 1 || !/[\p{L}\p{N}]/u.test(e.key)) return;
      add('letter', e.key.toLocaleUpperCase('tr'), 8 + rand() * 78, 12 + rand() * 62);
      pluck(e.key);
      projector.strum('hit');
    };

    const onDown = (e: PointerEvent) => {
      if (!ready()) return;
      if (e.target instanceof Element && e.target.closest('a, button, .strip')) return;
      add('hit', hits[Math.floor(rand() * hits.length)], (e.clientX / window.innerWidth) * 100, (e.clientY / window.innerHeight) * 100);
      pluck();
      projector.strum('hit');
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <div className="scraps" aria-hidden="true">
      {scraps.map((s) =>
        s.kind === 'letter' ? (
          <span key={s.id} className="scrap scrap--letter" style={s.style}>
            <span className={`rl__in rl--${s.skin}`} style={{ fontFamily: s.face, '--s': 1 } as Vars}>
              {s.text}
            </span>
          </span>
        ) : (
          <span key={s.id} className="scrap scrap--hit" style={s.style}>
            <Burst points={12} />
            <b>{s.text}</b>
          </span>
        ),
      )}
    </div>
  );
}
