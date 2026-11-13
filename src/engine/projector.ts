/**
 * Projektör: sitenin tek saati.
 *
 * Film 24 karede akar ama her katman her karede çizilmez. Bir katman "on 3s"
 * ise scroll konumunu 3 karede bir örnekler ve arada pozunu tutar (saniyede 8
 * poz). Katmanlar farklı ritimlerde örneklediği için aynı harekete farklı
 * anlarda "pop" ederler. Sitedeki bütün kesik kesik hareket buradan çıkar.
 *
 * Katman sadece `--p` (0..1) alır. Koreografinin kendisi CSS'te yazılır.
 */

export type SelfMode = 'enter' | 'through';
type Mode = 'pin' | 'through' | 'enter';
type El = HTMLElement | SVGElement;

interface Src {
  el: HTMLElement;
  mode: Mode;
  top: number;
  h: number;
  p: number;
}

interface Layer {
  el: El;
  /** Kaç karede bir örneklenir. 0 = her ekran karesinde (akıcı, "kamera"). */
  on: number;
  offset: number;
  src: Src;
  last: number;
}

export interface ProjectorState {
  scrollY: number;
  vh: number;
  /** Yumuşatılmış scroll hızı, piksel/kare. */
  vel: number;
  /** 0..1, scroll ne kadar sert. */
  energy: number;
  moving: boolean;
  reduced: boolean;
}

export type Tick = (frame: number, st: ProjectorState) => void;

export const FPS = 24;
const FRAME_MS = 1000 / FPS;

function docTop(el: HTMLElement): number {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

class Projector {
  readonly state: ProjectorState = {
    scrollY: 0,
    vh: 1,
    vel: 0,
    energy: 0,
    moving: false,
    reduced: false,
  };

  private scenes = new Map<HTMLElement, Src>();
  private layers = new Set<Layer>();
  private ticks = new Set<Tick>();
  private frame = -1;
  private raf = 0;
  private dirty = true;
  private fresh = true;
  private lastMove = -1e9;
  private started = false;
  private boilSeed = 1;
  private turb: Element | null = null;

  private start() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      this.state.reduced = mq.matches;
      cancelAnimationFrame(this.raf);
      if (mq.matches) {
        // Hareket istemeyen kullanıcıda saat durur, CSS düz yerleşimi gösterir.
        for (const l of this.layers) {
          l.el.style.removeProperty('--p');
          l.last = -1;
        }
        for (const t of this.ticks) t(0, this.state);
      } else {
        this.fresh = true;
        this.raf = requestAnimationFrame(this.loop);
      }
    };
    mq.addEventListener('change', apply);

    const remeasure = () => {
      this.dirty = true;
    };
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    document.fonts?.ready.then(remeasure);
    new ResizeObserver(remeasure).observe(document.body);

    apply();
  }

  private scene(el: El): Src {
    const host = el.closest<HTMLElement>('[data-scene]') ?? document.documentElement;
    let src = this.scenes.get(host);
    if (!src) {
      const mode = host.dataset.scene === 'through' ? 'through' : 'pin';
      src = { el: host, mode, top: 0, h: 1, p: 0 };
      this.scenes.set(host, src);
    }
    return src;
  }

  /** Bir elementin bağlı olduğu sahnenin o anki (akıcı) ilerlemesi. */
  progressOf(el: El): number {
    return this.scene(el).p;
  }

  addLayer(el: El, opts: { on?: number; offset?: number; self?: SelfMode }): () => void {
    const src: Src = opts.self
      ? { el: el as HTMLElement, mode: opts.self, top: 0, h: 1, p: 0 }
      : this.scene(el);
    const layer: Layer = { el, on: opts.on ?? 3, offset: opts.offset ?? 0, src, last: -1 };
    this.layers.add(layer);
    this.dirty = true;
    this.fresh = true;
    this.start();
    return () => {
      this.layers.delete(layer);
    };
  }

  onTick(fn: Tick): () => void {
    this.ticks.add(fn);
    this.start();
    return () => {
      this.ticks.delete(fn);
    };
  }

  private measure() {
    this.dirty = false;
    this.state.vh = window.innerHeight;
    for (const [host, src] of this.scenes) {
      if (!host.isConnected) {
        this.scenes.delete(host);
        continue;
      }
      src.top = host === document.documentElement ? 0 : docTop(host);
      src.h = host === document.documentElement ? host.scrollHeight : host.offsetHeight;
    }
    for (const l of this.layers) {
      if (l.src.mode === 'pin' || this.scenes.get(l.src.el) === l.src) continue;
      l.src.top = docTop(l.src.el);
      l.src.h = l.src.el.offsetHeight;
    }
    this.fresh = true;
  }

  private progress(src: Src) {
    const { scrollY: y, vh } = this.state;
    let p: number;
    if (src.mode === 'pin') p = (y - src.top) / Math.max(1, src.h - vh);
    else if (src.mode === 'through') p = (y + vh - src.top) / (src.h + vh);
    else p = (y + vh - src.top) / (vh * 0.6);
    src.p = clamp01(p);
  }

  private write(l: Layer) {
    const v = l.src.p;
    if (v === l.last) return;
    l.last = v;
    l.el.style.setProperty('--p', v.toFixed(4));
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const st = this.state;
    if (this.dirty) this.measure();

    const y = window.scrollY;
    const dy = y - st.scrollY;
    st.scrollY = y;
    if (dy !== 0) this.lastMove = now;
    const moving = now - this.lastMove < 170;
    if (moving !== st.moving) {
      st.moving = moving;
      document.documentElement.classList.toggle('is-moving', moving);
    }
    st.vel += (dy - st.vel) * 0.25;
    st.energy = Math.min(1, Math.abs(st.vel) / 45);

    for (const src of this.scenes.values()) this.progress(src);
    for (const l of this.layers) {
      if (this.scenes.get(l.src.el) !== l.src) this.progress(l.src);
    }

    const f = Math.floor(now / FRAME_MS);
    const newFrame = f !== this.frame;
    this.frame = f;

    for (const l of this.layers) {
      if (this.fresh || l.on === 0 || (newFrame && (f + l.offset) % l.on === 0)) this.write(l);
    }
    this.fresh = false;

    if (!newFrame) return;

    // Dış çizgi "on 2s" kaynar, ama sadece bir şey hareket ederken.
    // Sayfa durunca çizgi de durur.
    if (moving && f % 2 === 0) {
      this.turb ??= document.querySelector('#boil feTurbulence');
      this.boilSeed = (this.boilSeed % 11) + 1;
      this.turb?.setAttribute('seed', String(this.boilSeed));
    }

    for (const t of this.ticks) t(f, st);
  };
}

export const projector = new Projector();
