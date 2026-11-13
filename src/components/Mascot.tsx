import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { FPS, projector, type ProjectorState } from '../engine/projector';
import { prompts } from '../content';

/**
 * Maskot: monitör kafalı, gözlüklü, klavye-gitar çalan bir punk.
 *
 * Her parça ayrı kağıttan kesilmiş gibi çizilir ve kendi kare hızında
 * poz değiştirir. Aynı hareketi farklı anlarda örnekledikleri için parçalar
 * bir an birbirinden ayrılır, sonra yerine "pop" eder:
 *
 *   gövde     on 3s          saniyede 8 poz
 *   yelek     on 3s, +2 kare gövdeyi geç yakalar
 *   kafa      on 3s, +1 kare
 *   klavye    on 4s          saniyede 6 poz
 *   pena kolu on 2s          saniyede 12 poz
 *   bacaklar  on 3s          yürürken scroll'a bağlı
 *
 * Gitarın ucundan mavi bir dalga çıkar; promptlar o dalganın üstünde
 * akar. Maskot çaldıkça dalga büyür, susunca kısalır. Altı şerit, orkestradaki
 * altı ajanın rengidir.
 */

export type Face = 'open' | 'blink' | 'shout' | 'happy' | 'wink' | 'dead' | 'code' | 'talk';
export type Act = 'play' | 'walk' | 'wave';
type Part = 'legL' | 'legR' | 'cable' | 'torso' | 'vest' | 'armL' | 'keytar' | 'armR' | 'head' | 'hawk';

export interface Drive {
  face?: Face;
  energy?: number;
}

interface Pose {
  x: number;
  y: number;
  rot: number;
}

interface Ctx {
  /** saniye */
  t: number;
  /** scroll enerjisi 0..1 */
  e: number;
  /** sahnenin yatırdığı açı -1..1 */
  L: number;
  act: Act;
  /** pena vuruşu, 1'den 0'a söner */
  k: number;
  /** yürüyüş fazı (radyan) ve şiddeti 0..1 */
  phi: number;
  w: number;
}

interface Rig {
  on: number;
  offset: number;
  cx: number;
  cy: number;
  pose: (c: Ctx) => Pose;
}

const W = Math.PI * 2;
const bob = (t: number) => Math.sin(t * W * 2);
const sway = (t: number, ph = 0) => Math.sin(t * W + ph);
/** Yürürken gövde her adımda bir kez çöker. */
const step = (c: Ctx) => -Math.abs(Math.cos(c.phi)) * 6 * c.w;

const body = (c: Ctx, k = 1): Pose => ({
  x: c.L * 4,
  y: bob(c.t) * 2.5 * (1 + c.e) + step(c) + c.k * 4,
  rot: (sway(c.t) * 1.4 * (1 + c.e) + c.L * 6 + c.w * 4) * k,
});

const RIG: Record<Part, Rig> = {
  legL: { on: 3, offset: 0, cx: 192, cy: 384, pose: (c) => ({ x: 0, y: 0, rot: Math.sin(c.phi) * 24 * c.w + c.L * 1.5 }) },
  legR: { on: 3, offset: 1, cx: 229, cy: 384, pose: (c) => ({ x: 0, y: 0, rot: -Math.sin(c.phi) * 24 * c.w + c.L * 1.5 }) },
  cable: {
    on: 6,
    offset: 3,
    cx: 280,
    cy: 160,
    pose: (c) => ({ x: c.L * 8, y: bob(c.t) * 3 + step(c), rot: sway(c.t * 0.5) * 3 + c.e * 5 + c.w * 6 }),
  },
  torso: { on: 3, offset: 0, cx: 210, cy: 394, pose: (c) => body(c) },
  vest: { on: 3, offset: 2, cx: 210, cy: 394, pose: (c) => body(c, 1.3) },
  head: {
    on: 3,
    offset: 1,
    cx: 210,
    cy: 208,
    pose: (c) => ({
      x: c.L * 12,
      y: bob(c.t) * 3.5 * (1 + c.e) + step(c) * 1.2 + c.k * 9,
      rot: sway(c.t, 0.9) * 5 * (1 + c.e) + c.L * 11 + c.w * 5 - c.k * 9,
    }),
  },
  // Kafanın içinde durur, kafaya göre ayrıca sallanır.
  hawk: { on: 4, offset: 1, cx: 210, cy: 98, pose: (c) => ({ x: 0, y: 0, rot: sway(c.t, 0.2) * 5 * (1 + c.e * 2) + c.k * 14 - c.w * 8 }) },
  armL: {
    on: 3,
    offset: 0,
    cx: 164,
    cy: 250,
    pose: (c) => ({ x: c.L * 4, y: bob(c.t) * 2.5 * (1 + c.e) + step(c), rot: sway(c.t, 2) * 3 + c.L * 4 }),
  },
  armR: {
    on: 2,
    offset: 0,
    cx: 258,
    cy: 250,
    pose: (c) =>
      c.act === 'wave'
        ? { x: c.L * 4, y: bob(c.t) * 2.5, rot: Math.sin(c.t * W * 2) * 13 - 4 + c.k * 10 }
        : {
            x: c.L * 4,
            y: bob(c.t) * 2.5 * (1 + c.e) + step(c),
            rot: Math.sin(c.t * W * 4) * 9 * (1 + c.e * 0.8) + c.L * 4 + Math.sin(c.k * 9) * 24 * c.k,
          },
  },
  keytar: {
    on: 4,
    offset: 0,
    cx: 205,
    cy: 345,
    pose: (c) => ({ x: c.L * 5, y: bob(c.t) * 1.5 + step(c), rot: sway(c.t, 1.2) * 2.5 + c.L * 5 + c.e * 5 - c.k * 8 }),
  },
};

const PARTS = Object.keys(RIG) as Part[];
/** Açılışta parçaların yapıştırılma sırası. */
const ORDER: Record<Part, number> = { legL: 0, legR: 1, torso: 2, vest: 3, armL: 4, keytar: 5, armR: 6, head: 7, hawk: 8, cable: 9 };

/** Kağıdın etrafında makasla bırakılmış beyaz pay: şekli iki kez çizer. */
function Cut({ children }: { children: ReactNode }) {
  return (
    <>
      <g className="m-halo">{children}</g>
      <g>{children}</g>
    </>
  );
}

const FACES: Record<Face, ReactNode> = {
  open: (
    <>
      <rect x="178" y="127" width="16" height="26" />
      <rect x="226" y="127" width="16" height="26" />
      <rect x="198" y="170" width="24" height="4" />
    </>
  ),
  blink: (
    <>
      <rect x="174" y="140" width="24" height="5" />
      <rect x="222" y="140" width="24" height="5" />
      <rect x="198" y="170" width="24" height="4" />
    </>
  ),
  talk: (
    <>
      <rect x="178" y="127" width="16" height="26" />
      <rect x="226" y="127" width="16" height="26" />
      <rect x="199" y="167" width="22" height="12" />
    </>
  ),
  shout: (
    <>
      <polyline className="m-scr-l" points="176,126 196,140 176,154" />
      <polyline className="m-scr-l" points="244,126 224,140 244,154" />
      <rect x="197" y="166" width="26" height="14" />
    </>
  ),
  happy: (
    <>
      <polyline className="m-scr-l" points="174,150 186,130 198,150" />
      <polyline className="m-scr-l" points="222,150 234,130 246,150" />
      <path className="m-scr-l" d="M196 168 q14 12 28 0" />
    </>
  ),
  wink: (
    <>
      <rect x="178" y="127" width="16" height="26" />
      <polyline className="m-scr-l" points="246,128 226,140 246,152" />
      <path className="m-scr-l" d="M197 169 q13 9 26 -2" />
    </>
  ),
  dead: (
    <>
      <path className="m-scr-l" d="M176 128 l20 24 M196 128 l-20 24" />
      <path className="m-scr-l" d="M224 128 l20 24 M244 128 l-20 24" />
      <path className="m-scr-l" d="M192 176 l9 -6 9 6 9 -6 9 6" />
    </>
  ),
  code: (
    <>
      <g className="m-code-a">
        <rect x="166" y="120" width="52" height="6" />
        <rect x="178" y="134" width="70" height="6" />
        <rect x="178" y="148" width="34" height="6" />
        <rect x="166" y="162" width="20" height="6" />
      </g>
      <g className="m-code-b">
        <rect x="166" y="120" width="30" height="6" />
        <rect x="178" y="134" width="46" height="6" />
        <rect x="178" y="148" width="74" height="6" />
        <rect x="166" y="162" width="44" height="6" />
        <rect x="216" y="160" width="8" height="10" />
      </g>
    </>
  ),
};

const ALL_FACES = Object.keys(FACES) as Face[];

/** Ekrandaki yüz. Üstteki `data-face` hangisinin görüneceğini seçer. */
export function FaceSet({ faces = ALL_FACES }: { faces?: Face[] }) {
  return (
    <g className="m-scr">
      {faces.map((f) => (
        <g key={f} className={`f-${f}`}>
          {FACES[f]}
        </g>
      ))}
    </g>
  );
}

/** Kahverengi çerçeveli gözlük. Camlar hafif renkli, gözler arkasından görünür. */
export function Glasses() {
  const frame = (
    <>
      <rect x="165" y="117" width="43" height="46" rx="11" />
      <rect x="212" y="117" width="43" height="46" rx="11" />
      <path d="M208 134 q2 -6 4 0" />
      <path d="M165 132 L136 125 M255 132 L284 125" />
    </>
  );
  return (
    <g className="m-glasses">
      <g className="m-glasses-h">{frame}</g>
      <rect className="m-lens" x="165" y="117" width="43" height="46" rx="11" />
      <rect className="m-lens" x="212" y="117" width="43" height="46" rx="11" />
      <g className="m-frame">{frame}</g>
      <path className="m-glint" d="M173 128 l9 -5 M220 128 l9 -5" />
    </g>
  );
}

const HAWK = '164,100 154,56 181,90 187,34 205,86 214,20 227,86 243,36 243,92 270,58 257,100';

/** Monitör kafa, mohawk ve gözlük. Tek başına da (orkestra) kullanılır. */
function HeadArt({
  faces,
  hawk,
  look,
  glasses = true,
}: {
  faces?: Face[];
  hawk?: (el: SVGGElement | null) => void;
  look?: (el: SVGGElement | null) => void;
  glasses?: boolean;
}) {
  return (
    <>
      <g ref={hawk}>
        <Cut>
          <polygon className="m-c1 m-o" points={HAWK} />
        </Cut>
        <polygon className="m-tex" fill="url(#p-dots)" points={HAWK} />
      </g>
      <Cut>
        <rect className="m-paper m-o" x="138" y="94" width="144" height="116" rx="12" />
      </Cut>
      <rect className="m-tex" fill="url(#p-news)" x="142" y="98" width="136" height="108" rx="9" opacity=".3" />
      <rect className="m-ink m-screen" x="152" y="106" width="116" height="80" rx="7" />
      <rect className="m-ink" x="152" y="194" width="34" height="5" />
      <circle className="m-c1 m-o-thin m-led" cx="263" cy="197" r="4.5" />
      <g ref={look}>
        <FaceSet faces={faces} />
      </g>
      {glasses && <Glasses />}
    </>
  );
}

interface HeadProps {
  face?: Face;
  /** Yüz sonradan değişecekse, kullanılacak bütün yüzler. */
  faces?: Face[];
  className?: string;
  glasses?: boolean;
}

export function MascotHead({ face = 'open', faces, className = '', glasses = true }: HeadProps) {
  return (
    <svg className={`mascot-head ${className}`} viewBox="124 8 172 212" data-face={face} aria-hidden="true">
      <HeadArt faces={faces ?? [face]} glasses={glasses} />
    </svg>
  );
}

const KEYS: ReactNode[] = [];
for (let row = 0; row < 2; row++) {
  for (let k = 0; k < 10; k++) {
    const tone = (row * 10 + k) % 7 === 3 ? 'm-c1' : (row * 10 + k) % 9 === 5 ? 'm-c2' : 'm-paper';
    KEYS.push(<rect key={`${row}-${k}`} className={`m-key ${tone}`} x={139 + k * 16 + row * 3} y={321 + row * 17} width="12" height="12" rx="2" />);
  }
}

interface MascotProps {
  act?: Act;
  className?: string;
  /** Sayfa açılırken parçalar tek tek yapıştırılır. */
  assemble?: boolean;
  /** Sola bakar. */
  flip?: boolean;
  /** Gitarın ucundan mavi dalga çıkar, promptlar üstünde akar. */
  wave?: boolean;
  /** Dalganın boyu, maskotun boyuna oranla. */
  waveLen?: number;
  /** Sahne ilerlemesine göre yüzü ve enerjiyi zorlar. */
  drive?: (p: number) => Drive;
}

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Dalganın şeritleri. Sıra, orkestradaki ajanların sırasıyla aynı. */
export const BLUES = ['#1d4dff', '#008cff', '#00b7eb', '#3fd0ff', '#8fe6ff', '#d7f6ff'];
const WAVE_POINTS = 26;

export function Mascot({ act = 'play', className = '', assemble, flip, wave, waveLen = 1, drive }: MascotProps) {
  const root = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGSVGElement>(null);
  const waveId = `wave${useId().replace(/:/g, '')}`;
  const parts = useRef<Partial<Record<Part, SVGGElement>>>({});
  const look = useRef<SVGGElement | null>(null);
  const driveRef = useRef(drive);
  driveRef.current = drive;

  const part = (name: Part) => (el: SVGGElement | null) => {
    if (el) parts.current[name] = el;
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const shot = el.closest('.shot');
    const idle: Face = act === 'wave' ? 'happy' : 'open';
    const ctx: Ctx = { t: 0, e: 0, L: 0, act, k: 0, phi: 0, w: 0 };
    let kick = 0;
    let loud = 0;
    let said = Math.floor(Math.random() * prompts.length);
    let hit: Element | null = null;
    let hitAge = 0;

    const apply = (name: Part) => {
      const g = parts.current[name];
      if (!g) return;
      const rig = RIG[name];
      const p = rig.pose(ctx);
      g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(2)} ${rig.cx} ${rig.cy})`);
    };

    const live = () => !shot || shot.hasAttribute('data-on') || shot.hasAttribute('data-under');

    // Gitarın ucuna bağlı mavi dalga: koyudan açığa altı şerit. 2 karede bir yeniden çizilir.
    const svg = waveRef.current;
    const stripes = svg ? [...svg.querySelectorAll<SVGPathElement>('.wave__s')] : [];
    const edges = svg ? [...svg.querySelectorAll<SVGPathElement>('.wave__e')] : [];
    const rail = svg?.querySelector<SVGPathElement>('.wave__rail') ?? null;
    const words = svg ? [...svg.querySelectorAll<SVGTextElement>('.wave__t')] : [];
    const fracs = words.map(() => 0);
    let len = 0.2;
    let phase = 0;
    let flow = 0;

    const drawWave = (st: ProjectorState) => {
      const size = el.offsetHeight;
      if (!svg || !size) return;
      const dir = el.hasAttribute('data-flip') ? 1 : -1;
      // Grup çalıyorsa dalga da canlıdır, scroll olsun olmasın.
      const playing = st.jam || st.moving || st.auto;
      len += ((playing ? 0.85 : 0.28) + ctx.k * 0.25 - len) * 0.35;
      phase += playing ? 1.1 : 0.45;
      const reach = size * 0.9 * waveLen * len;
      const swing = size * 0.065 * (0.5 + len) * Math.min(1, waveLen + 0.15);
      const curl = 8.5 * Math.min(1, waveLen + 0.25);
      const thick = size * 0.017;
      // Dalga gitarın sapının doğrultusunda, yukarı doğru uzar.
      const angle = (-dir * 24 * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const line = (off: number) => {
        const pts: string[] = [];
        for (let i = 0; i <= WAVE_POINTS; i++) {
          const u = i / WAVE_POINTS;
          const x = dir * u * reach;
          // Uçta sıfır, uzaklaştıkça açılır: dalga gitara bağlı kalır.
          const y = Math.sin(u * curl - phase) * swing * Math.min(1, u * 2.4) + off * Math.min(1, u * 6);
          pts.push(`${(x * cos - y * sin).toFixed(1)} ${(x * sin + y * cos).toFixed(1)}`);
        }
        return pts;
      };

      const half = (stripes.length - 1) / 2;
      stripes.forEach((path, i) => {
        path.setAttribute('d', `M${line((i - half) * thick).join('L')}`);
        path.setAttribute('stroke-width', (thick * 1.12).toFixed(1));
      });
      edges.forEach((path, i) => path.setAttribute('d', `M${line((i ? 1 : -1) * (half + 0.56) * thick).join('L')}`));

      // Yazı soldan sağa okunsun diye ray hep artan x yönünde çizilir.
      const mid = line(-thick * 0.3);
      if (dir < 0) mid.reverse();
      rail?.setAttribute('d', `M${mid.join('L')}`);

      flow += playing ? 0.03 : 0.008;
      words.forEach((text, j) => {
        const frac = (flow + j / words.length) % 1;
        const along = text.firstElementChild;
        if (frac < fracs[j] && along) along.textContent = prompts[said++ % prompts.length];
        fracs[j] = frac;
        // Prompt uçtan çıkar, dalga boyunca dışarı akar.
        along?.setAttribute('startOffset', `${((dir < 0 ? 1 - frac : frac) * 74).toFixed(1)}%`);
        text.setAttribute('font-size', (size * 0.046).toFixed(1));
      });
      svg.classList.toggle('is-quiet', len < 0.5);
    };

    PARTS.forEach(apply);
    el.dataset.face = idle;

    const offStrum = projector.onStrum((kind) => {
      if (!live()) return;
      // Kullanıcının vuruşu sert, riff'in notası yumuşak.
      kick = kind === 'hit' ? 8 : 4;
      if (kind === 'hit') loud = 8;
      const keys = el.querySelectorAll('.m-key');
      hit?.classList.remove('is-hit');
      hit = keys[Math.floor(Math.random() * keys.length)] ?? null;
      hit?.classList.add('is-hit');
      hitAge = 3;
    });

    const offTick = projector.onTick((f, st) => {
      if (st.reduced || !live()) return;
      const p = projector.progressOf(el);
      const d = driveRef.current?.(p) ?? {};
      if (kick > 0) kick--;
      if (loud > 0) loud--;

      ctx.t = f / FPS;
      ctx.e = Math.max(st.energy, d.energy ?? 0);
      ctx.k = kick / 8;
      // Sahne ilerledikçe figür sağa sola yatar. Her parça bu yatışı
      // kendi karesinde yakaladığı için yelek ve kafa geç "pop" eder.
      ctx.L = act === 'play' ? Math.sin(p * 9) : 0;
      if (act === 'walk') {
        ctx.phi = st.scrollY / 46;
        ctx.w = st.moving ? 1 : 0;
        if (st.moving && Math.abs(st.vel) > 0.5) el.toggleAttribute('data-flip', st.vel < 0);
      }

      for (const name of PARTS) {
        const rig = RIG[name];
        // Pena vuruşunda kol ve gitar beklemez, her karede oynar.
        const now = kick > 0 && (name === 'armR' || name === 'keytar');
        if (now || (f + rig.offset) % rig.on === 0) apply(name);
      }

      if (hit && --hitAge <= 0) {
        hit.classList.remove('is-hit');
        hit = null;
      }

      if (f % 3 === 0) {
        const face =
          d.face === 'talk'
            ? f % 6 < 3
              ? 'talk'
              : 'open'
            : (d.face ?? (loud > 0 || ctx.e > 0.6 ? 'shout' : f % 84 < 3 ? 'blink' : idle));
        if (el.dataset.face !== face) el.dataset.face = face;
        // Gözler imleci izler.
        const side = el.hasAttribute('data-flip') ? -1 : 1;
        look.current?.setAttribute('transform', `translate(${(st.px * 6 * side).toFixed(1)} ${(st.py * 4).toFixed(1)})`);
      }

      if (wave && f % 2 === 0) drawWave(st);
    });

    return () => {
      offStrum();
      offTick();
    };
  }, [act, wave, waveLen]);

  const strum = act === 'wave' ? 'M258 250 L312 226 L304 158' : 'M258 250 L304 314 L244 358';
  const hand = act === 'wave' ? { cx: 304, cy: 156 } : { cx: 244, cy: 358 };

  /** Poz dışarıdaki gruba yazılır, açılış animasyonu içerideki gruba. */
  const P = (name: Part, children: ReactNode, cls = '') => (
    <g ref={part(name)} className={cls}>
      <g className="m-part" style={{ '--k': ORDER[name] } as Vars}>
        {children}
      </g>
    </g>
  );

  return (
    <div
      ref={root}
      className={`mascot mascot--${act} ${assemble ? 'mascot--assemble' : ''} ${className}`}
      data-flip={flip ? '' : undefined}
      role="img"
      aria-label="Monitör kafalı, gözlüklü, mohawklı, klavyeyi gitar gibi çalan punk maskot"
    >
      <svg className="mascot__fig" viewBox="-50 0 520 620" aria-hidden="true">
        <g filter="url(#boil-m)">
          {P(
            'legL',
            <>
              <Cut>
                <polygon className="m-ink m-o" points="176,380 208,380 198,550 168,550" />
                <path className="m-paper m-o" d="M160 544 h46 v30 h-68 v-10 z" />
              </Cut>
              <path className="m-line" d="M168 556 h30 M168 564 h30" />
              <rect className="m-c2 m-o-thin" x="172" y="446" width="26" height="22" transform="rotate(-8 185 457)" />
            </>,
          )}
          {P(
            'legR',
            <>
              <Cut>
                <polygon className="m-ink m-o" points="212,380 246,380 264,550 234,550" />
                <path className="m-paper m-o" d="M230 544 h44 l22 20 v10 h-66 z" />
              </Cut>
              <path className="m-line" d="M240 556 h30 M242 564 h34" />
            </>,
          )}

          {P(
            'cable',
            <>
              <path className="m-wire-h" d="M280 160 C 344 172, 334 262, 318 304 S 334 474, 396 566" />
              <path className="m-wire" d="M280 160 C 344 172, 334 262, 318 304 S 334 474, 396 566" />
              <rect className="m-paper m-o-thin" x="388" y="560" width="22" height="13" rx="2" />
            </>,
            'm-cable',
          )}

          {P(
            'torso',
            <>
              <Cut>
                <rect className="m-paper m-o" x="199" y="198" width="22" height="44" />
                <polygon className="m-white m-o" points="166,236 254,236 264,396 156,396" />
              </Cut>
              <polygon className="m-tex" fill="url(#p-stripes)" points="167,238 253,238 263,380 157,380" />
              <polygon className="m-ink" points="157,380 263,380 264,396 156,396" />
              {[170, 188, 206, 224, 242].map((x) => (
                <rect key={x} className="m-white" x={x} y="384" width="8" height="8" />
              ))}
              <path className="m-chain" d="M178 396 q22 52 64 6" />
            </>,
          )}

          {P(
            'vest',
            <>
              <Cut>
                <polygon className="m-c1 m-o" points="146,230 198,228 192,378 148,364" />
                <polygon className="m-c1 m-o" points="222,228 274,230 272,364 228,378" />
                <polygon className="m-white m-o" points="148,232 134,208 160,228" />
                <polygon className="m-white m-o" points="164,230 158,202 178,228" />
                <polygon className="m-white m-o" points="272,232 286,208 260,228" />
                <polygon className="m-white m-o" points="256,230 262,202 242,228" />
              </Cut>
              <polygon className="m-tex" fill="url(#p-dots)" opacity=".45" points="222,228 274,230 272,364 228,378" />
              <g transform="rotate(-7 170 302)">
                <rect className="m-c2 m-o-thin" x="152" y="288" width="36" height="27" />
                <text className="m-patch" x="170" y="307" textAnchor="middle">
                  {'</>'}
                </text>
              </g>
              {[250, 276, 302, 328, 352].map((y, i) => (
                <circle key={y} className="m-white m-o-thin" cx={194 - i * 0.6} cy={y} r="3.6" />
              ))}
              {[250, 276].map((y) => (
                <circle key={y} className="m-white m-o-thin" cx={226} cy={y} r="3.6" />
              ))}
              <path className="m-pin" d="M240 300 l22 12 m-22 -4 l22 12 m-22 -4 l22 12" />
            </>,
          )}

          {P(
            'armL',
            <>
              <path className="m-arm-h" d="M164 250 L130 324 L96 298" />
              <path className="m-arm-o" d="M164 250 L130 324 L96 298" />
              <path className="m-arm-f" d="M164 250 L130 324 L96 298" />
              <path className="m-band" d="M118 314 L108 306" />
              <circle className="m-paper m-o" cx="96" cy="298" r="13" />
            </>,
          )}

          {P(
            'keytar',
            <g transform="rotate(24 205 345)">
              <Cut>
                <polygon className="m-c2 m-o" points="-24,330 14,324 14,372 -24,366" />
                <rect className="m-paper m-o" x="10" y="337" width="126" height="22" />
                <rect className="m-ink m-o" x="130" y="312" width="174" height="68" rx="9" />
              </Cut>
              <path className="m-line" d="M26 337 v22 M42 337 v22 M58 337 v22 M74 337 v22 M90 337 v22 M106 337 v22 M122 337 v22" />
              <path className="m-string" d="M-14 344 H134 M-14 352 H134" />
              <circle className="m-ink" cx="-10" cy="336" r="3.5" />
              <circle className="m-ink" cx="2" cy="360" r="3.5" />
              {KEYS}
              <rect className="m-key m-paper" x="142" y="356" width="12" height="12" rx="2" />
              <rect className="m-key m-paper" x="158" y="356" width="12" height="12" rx="2" />
              <rect className="m-key m-c2" x="174" y="356" width="76" height="12" rx="2" />
              <rect className="m-key m-paper" x="254" y="356" width="12" height="12" rx="2" />
              <rect className="m-key m-c1" x="270" y="356" width="24" height="12" rx="2" />
            </g>,
          )}

          {P(
            'armR',
            <>
              <path className="m-arm-h" d={strum} />
              <path className="m-arm-o" d={strum} />
              <path className="m-arm-f" d={strum} />
              <circle className="m-paper m-o" cx={hand.cx} cy={hand.cy} r="13" />
            </>,
          )}

          {P(
            'head',
            <HeadArt
              hawk={part('hawk')}
              look={(g) => {
                look.current = g;
              }}
            />,
          )}
        </g>
      </svg>
      {wave && (
        <svg ref={waveRef} className="wave" aria-hidden="true">
          <path className="wave__e" />
          <path className="wave__e" />
          {BLUES.map((color) => (
            <path key={color} className="wave__s" stroke={color} />
          ))}
          <path id={waveId} className="wave__rail" />
          {[0, 1].map((j) => (
            <text key={j} className="wave__t">
              <textPath href={`#${waveId}`}>{prompts[j]}</textPath>
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
