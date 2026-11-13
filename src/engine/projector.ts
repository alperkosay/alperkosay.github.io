/**
 * Projektör: sitenin tek saati.
 *
 * Film 24 karede akar ama her katman her karede çizilmez. Bir katman "on 3s"
 * ise scroll konumunu 3 karede bir örnekler ve arada pozunu tutar (saniyede 8
 * poz). Katmanlar farklı ritimlerde örneklediği için aynı harekete farklı
 * anlarda "pop" ederler. Sitedeki bütün kesik kesik hareket buradan çıkar.
 *
 * Site bir sayfa değil, bir film: her bölüm ekrana sabitlenmiş bir "çekim".
 * Scroll çekimin içinde ilerletir, çekim bitince bir sonrakine KESER.
 * Projektör hangi çekimin ekranda olduğunu ve kesmenin neresinde olduğumuzu
 * (`--cut`, `--out`) da buradan yönetir.
 *
 * Katman sadece `--p` (0..1) alır. Koreografinin kendisi CSS'te yazılır.
 */

export type SelfMode = 'enter' | 'through';
type Mode = 'pin' | 'through' | 'enter' | 'film';
type El = HTMLElement | SVGElement;

interface FilmState {
  last: boolean;
  on: boolean;
  under: boolean;
  /** Yazılmış son değerler. */
  wCut: number;
  wOut: number;
}

interface Src {
  el: HTMLElement;
  mode: Mode;
  top: number;
  h: number;
  p: number;
  film?: FilmState;
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
  vw: number;
  /** Yumuşatılmış scroll hızı, piksel/kare. */
  vel: number;
  /** 0..1, scroll ne kadar sert. */
  energy: number;
  moving: boolean;
  reduced: boolean;
  /** İmlecin ekrandaki yeri, -1..1. */
  px: number;
  py: number;
  /** Ekrandaki çekimin sırası ve o çekimin içindeki ilerleme. */
  shot: number;
  shotP: number;
  /** Film kendi kendine akıyor. */
  auto: boolean;
  /** Kullanıcı "Oynat"a bastı, film başladı. */
  rolling: boolean;
  /** Grup çalıyor. Müzik scroll'dan bağımsızdır. */
  jam: boolean;
}

/** 'hit': kullanıcı vurdu (sert). 'riff': maskot kendi çalıyor (yumuşak). */
export type StrumKind = 'hit' | 'riff';

export type Tick = (frame: number, st: ProjectorState) => void;

export const FPS = 24;
const FRAME_MS = 1000 / FPS;
/** Bir kesme, ekran yüksekliğinin bu kadarı boyunca sürer. */
export const CUT = 0.55;

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
    vw: 1,
    vel: 0,
    energy: 0,
    moving: false,
    reduced: false,
    px: 0,
    py: 0,
    shot: 0,
    shotP: 0,
    auto: false,
    rolling: false,
    jam: false,
  };

  private scenes = new Map<HTMLElement, Src>();
  private films: Src[] = [];
  private layers = new Set<Layer>();
  private ticks = new Set<Tick>();
  private strums = new Set<(kind: StrumKind) => void>();
  private autoY = 0;
  private lastNow = 0;
  private idle = false;
  private frame = -1;
  private raf = 0;
  private dirty = true;
  private fresh = true;
  private lastMove = -1e9;
  private started = false;
  private boilSeed = 1;
  private turbs: Element[] | null = null;

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

    // Kullanıcı kendi kaydırmaya başlarsa otomatik oynatma durur.
    const takeOver = () => {
      if (this.state.auto) this.setAuto(false);
    };
    window.addEventListener('wheel', takeOver, { passive: true });
    window.addEventListener('touchmove', takeOver, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) takeOver();
    });

    window.addEventListener(
      'pointermove',
      (e) => {
        this.state.px = (e.clientX / window.innerWidth) * 2 - 1;
        this.state.py = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );

    apply();
  }

  private scene(el: El): Src {
    const host = el.closest<HTMLElement>('[data-scene]') ?? document.documentElement;
    let src = this.scenes.get(host);
    if (!src) {
      const kind = host.dataset.scene;
      const mode: Mode = kind === 'through' ? 'through' : kind === 'film' ? 'film' : 'pin';
      src = { el: host, mode, top: 0, h: 1, p: 0 };
      if (mode === 'film') src.film = { last: false, on: false, under: false, wCut: -1, wOut: -1 };
      this.scenes.set(host, src);
      this.dirty = true;
    }
    return src;
  }

  /** Bir elementin bağlı olduğu sahnenin o anki (akıcı) ilerlemesi. */
  progressOf(el: El): number {
    return this.scene(el).p;
  }

  /** Çekimi kaydeder. Katmanı olmayan çekimler de filme girsin diye. */
  addShot(el: HTMLElement): void {
    this.scene(el);
    this.start();
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

  /** Bir nota çalındı: sahnedeki herkes penayı vurur. */
  strum(kind: StrumKind = 'hit'): void {
    for (const fn of this.strums) fn(kind);
  }

  /** Filmi başlatır: açılış animasyonları ancak bundan sonra oynar. */
  roll(): void {
    this.state.rolling = true;
    document.documentElement.classList.add('is-rolling');
    this.lastMove = performance.now();
    this.start();
  }

  /** Otomatik oynatmayı açar ya da kapatır. Sondaysa baştan başlatır. */
  setAuto(on: boolean): void {
    if (on) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= max - 4) window.scrollTo(0, 0);
      this.autoY = window.scrollY;
    }
    this.state.auto = on;
    document.documentElement.classList.toggle('is-auto', on);
  }

  onStrum(fn: (kind: StrumKind) => void): () => void {
    this.strums.add(fn);
    return () => {
      this.strums.delete(fn);
    };
  }

  /** Bir çekimin başına, kesme bittikten hemen sonrasına atlar. */
  jumpTo(id: string): void {
    this.measure();
    const i = this.films.findIndex((f) => f.el.id === id);
    if (i < 0) {
      document.getElementById(id)?.scrollIntoView();
      return;
    }
    const f = this.films[i];
    const lead = this.state.reduced || i === 0 ? 0 : this.state.vh * CUT + 2;
    window.scrollTo(0, f.top + lead);
    this.autoY = f.top + lead;
  }

  private measure() {
    this.dirty = false;
    this.state.vh = window.innerHeight;
    this.state.vw = window.innerWidth;
    for (const [host, src] of this.scenes) {
      if (!host.isConnected) {
        this.scenes.delete(host);
        continue;
      }
      src.top = host === document.documentElement ? 0 : docTop(host);
      src.h = host === document.documentElement ? host.scrollHeight : host.offsetHeight;
    }
    for (const l of this.layers) {
      if (this.scenes.get(l.src.el) === l.src) continue;
      l.src.top = docTop(l.src.el);
      l.src.h = l.src.el.offsetHeight;
    }
    this.films = [...this.scenes.values()].filter((s) => s.film).sort((a, b) => a.top - b.top);
    this.films.forEach((f, i) => {
      f.film!.last = i === this.films.length - 1;
    });
    this.fresh = true;
  }

  private progress(src: Src) {
    const { scrollY: y, vh } = this.state;
    let p: number;
    if (src.mode === 'pin') p = (y - src.top) / Math.max(1, src.h - vh);
    else if (src.mode === 'film') p = (y - src.top) / Math.max(1, src.h - (src.film!.last ? vh : 0));
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

  /** Hangi çekim ekranda, hangisi altında kalıyor, kesmenin neresindeyiz. */
  private direct(stepNow: boolean) {
    const films = this.films;
    if (!films.length) return;
    const { scrollY: y, vh } = this.state;

    let cur = 0;
    for (let i = 1; i < films.length; i++) if (y >= films[i].top) cur = i;
    const cut = cur === 0 ? 1 : clamp01((y - films[cur].top) / (vh * CUT));
    const under = cut < 1 ? cur - 1 : -1;
    this.state.shot = cur;
    this.state.shotP = films[cur].p;

    films.forEach((src, i) => {
      const f = src.film!;
      const on = i === cur;
      const below = i === under;
      let force = false;
      if (on !== f.on) {
        f.on = on;
        src.el.toggleAttribute('data-on', on);
        force = true;
      }
      if (below !== f.under) {
        f.under = below;
        src.el.toggleAttribute('data-under', below);
        force = true;
      }
      const wantCut = on ? cut : 1;
      const wantOut = below ? cut : 0;
      // Kesme "on 2s" ilerler. Çekim değiştiği an ise beklemeden yazılır.
      if (force || this.fresh || stepNow || (!on && !below)) {
        if (wantCut !== f.wCut) {
          f.wCut = wantCut;
          src.el.style.setProperty('--cut', wantCut.toFixed(4));
        }
        if (wantOut !== f.wOut) {
          f.wOut = wantOut;
          src.el.style.setProperty('--out', wantOut.toFixed(4));
        }
      }
    });
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const st = this.state;
    if (this.dirty) this.measure();

    // Otomatik oynatma: çekimin kendi hızında aşağı kaydırır.
    const dt = Math.min(100, now - this.lastNow);
    this.lastNow = now;
    if (st.auto) {
      const pace = parseFloat(this.films[st.shot]?.el.dataset.pace ?? '') || 0.4;
      const max = document.documentElement.scrollHeight - st.vh;
      this.autoY = Math.min(max, this.autoY + (st.vh * pace * dt) / 1000);
      window.scrollTo(0, this.autoY);
      if (this.autoY >= max) this.setAuto(false);
    }

    const y = window.scrollY;
    const dy = y - st.scrollY;
    st.scrollY = y;
    if (dy !== 0) this.lastMove = now;
    const moving = now - this.lastMove < 170;
    if (moving !== st.moving) {
      st.moving = moving;
      document.documentElement.classList.toggle('is-moving', moving);
    }
    // Film uzun süre durursa kullanıcıyı devam etmeye çağır.
    const atEnd = y >= document.documentElement.scrollHeight - st.vh - 4;
    const idle = st.rolling && !st.auto && !atEnd && now - this.lastMove > 4200;
    if (idle !== this.idle) {
      this.idle = idle;
      document.documentElement.classList.toggle('is-idle', idle);
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

    this.direct(newFrame && f % 2 === 0);

    for (const l of this.layers) {
      if (this.fresh || l.on === 0 || (newFrame && (f + l.offset) % l.on === 0)) this.write(l);
    }
    this.fresh = false;

    if (!newFrame) return;

    // Elle çizilmiş çizgi "on 2s" kaynar.
    if (f % 2 === 0) {
      this.turbs ??= [...document.querySelectorAll('#boil feTurbulence, #boil-m feTurbulence')];
      this.boilSeed = (this.boilSeed % 11) + 1;
      for (const t of this.turbs) t.setAttribute('seed', String(this.boilSeed));
    }

    for (const t of this.ticks) t(f, st);
  };
}

export const projector = new Projector();
