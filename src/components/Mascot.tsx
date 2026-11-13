import { useEffect, useRef, type ReactNode } from 'react';
import { FPS, projector } from '../engine/projector';

/**
 * Maskot: monitör kafalı, klavye-gitar çalan bir punk.
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
 *   çizgi     on 2s          sadece hareket varken
 */

export type Face = 'open' | 'blink' | 'shout' | 'happy' | 'wink' | 'dead' | 'code';
type Variant = 'play' | 'wave';
type Part = 'legs' | 'cable' | 'torso' | 'vest' | 'armL' | 'keytar' | 'armR' | 'head' | 'hawk';

interface Pose {
  x: number;
  y: number;
  rot: number;
}

interface Rig {
  on: number;
  offset: number;
  cx: number;
  cy: number;
  /** t: saniye, e: scroll enerjisi 0..1, L: sahnenin yatırdığı açı -1..1 */
  pose: (t: number, e: number, L: number, v: Variant) => Pose;
}

const W = Math.PI * 2;
const bob = (t: number) => Math.sin(t * W * 2);
const sway = (t: number, ph = 0) => Math.sin(t * W + ph);

const body = (t: number, e: number, L: number, k = 1): Pose => ({
  x: L * 4,
  y: bob(t) * 2.5 * (1 + e),
  rot: (sway(t) * 1.4 * (1 + e) + L * 6) * k,
});

const RIG: Record<Part, Rig> = {
  legs: { on: 6, offset: 0, cx: 210, cy: 570, pose: (_t, _e, L) => ({ x: 0, y: 0, rot: L * 1.5 }) },
  cable: { on: 6, offset: 3, cx: 280, cy: 160, pose: (t, e, L) => ({ x: L * 8, y: bob(t) * 3, rot: sway(t * 0.5) * 3 + e * 5 }) },
  torso: { on: 3, offset: 0, cx: 210, cy: 394, pose: (t, e, L) => body(t, e, L) },
  vest: { on: 3, offset: 2, cx: 210, cy: 394, pose: (t, e, L) => body(t, e, L, 1.3) },
  head: {
    on: 3,
    offset: 1,
    cx: 210,
    cy: 208,
    pose: (t, e, L) => ({ x: L * 12, y: bob(t) * 3.5 * (1 + e), rot: sway(t, 0.9) * 5 * (1 + e) + L * 11 }),
  },
  // Kafanın içinde durur, kafaya göre ayrıca sallanır.
  hawk: { on: 4, offset: 1, cx: 210, cy: 98, pose: (t, e) => ({ x: 0, y: 0, rot: sway(t, 0.2) * 5 * (1 + e * 2) }) },
  armL: { on: 3, offset: 0, cx: 164, cy: 250, pose: (t, e, L) => ({ x: L * 4, y: bob(t) * 2.5 * (1 + e), rot: sway(t, 2) * 3 + L * 4 }) },
  armR: {
    on: 2,
    offset: 0,
    cx: 258,
    cy: 250,
    pose: (t, e, L, v) =>
      v === 'wave'
        ? { x: L * 4, y: bob(t) * 2.5, rot: Math.sin(t * W * 2) * 13 - 4 }
        : { x: L * 4, y: bob(t) * 2.5 * (1 + e), rot: Math.sin(t * W * 4) * 9 * (1 + e * 0.8) + L * 4 },
  },
  keytar: { on: 4, offset: 0, cx: 205, cy: 345, pose: (t, e, L) => ({ x: L * 5, y: bob(t) * 1.5, rot: sway(t, 1.2) * 2.5 + L * 5 + e * 5 }) },
};

/** Kağıdın etrafında makasla bırakılmış beyaz pay: şekli iki kez çizer. */
function Cut({ children }: { children: ReactNode }) {
  return (
    <>
      <g className="m-halo">{children}</g>
      <g>{children}</g>
    </>
  );
}

function FaceArt({ face }: { face: Face }) {
  switch (face) {
    case 'blink':
      return (
        <>
          <rect x="174" y="140" width="24" height="5" />
          <rect x="222" y="140" width="24" height="5" />
          <rect x="198" y="164" width="24" height="4" />
        </>
      );
    case 'shout':
      return (
        <>
          <polyline className="m-scr-l" points="176,126 196,140 176,154" />
          <polyline className="m-scr-l" points="244,126 224,140 244,154" />
          <rect x="197" y="159" width="26" height="15" />
        </>
      );
    case 'happy':
      return (
        <>
          <polyline className="m-scr-l" points="174,150 186,130 198,150" />
          <polyline className="m-scr-l" points="222,150 234,130 246,150" />
          <path className="m-scr-l" d="M194 160 q16 16 32 0" />
        </>
      );
    case 'wink':
      return (
        <>
          <rect x="178" y="127" width="16" height="26" />
          <polyline className="m-scr-l" points="246,128 226,140 246,152" />
          <path className="m-scr-l" d="M196 162 q14 10 28 -2" />
        </>
      );
    case 'dead':
      return (
        <>
          <path className="m-scr-l" d="M176 128 l20 24 M196 128 l-20 24" />
          <path className="m-scr-l" d="M224 128 l20 24 M244 128 l-20 24" />
          <path className="m-scr-l" d="M192 168 l9 -7 9 7 9 -7 9 7" />
        </>
      );
    case 'code':
      return (
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
      );
    default:
      return (
        <>
          <rect x="178" y="127" width="16" height="26" />
          <rect x="226" y="127" width="16" height="26" />
          <rect x="198" y="164" width="24" height="4" />
        </>
      );
  }
}

const HAWK = '164,100 154,56 181,90 187,34 205,86 214,20 227,86 243,36 243,92 270,58 257,100';

/** Monitör kafa ve mohawk. Tek başına da (vesikalık, orkestra) kullanılır. */
function HeadArt({
  faces,
  hawkRef,
  faceRefs,
}: {
  faces: Face[];
  hawkRef?: (el: SVGGElement | null) => void;
  faceRefs?: (face: Face, el: SVGGElement | null) => void;
}) {
  return (
    <>
      <g ref={hawkRef}>
        <Cut>
          <polygon className="m-c1 m-o" points={HAWK} />
        </Cut>
        <polygon className="m-tex" fill="url(#p-dots)" points={HAWK} />
      </g>
      <Cut>
        <rect className="m-paper m-o" x="138" y="94" width="144" height="116" rx="12" />
      </Cut>
      <rect className="m-tex" fill="url(#p-news)" x="142" y="98" width="136" height="108" rx="9" opacity=".3" />
      <rect className="m-ink" x="152" y="106" width="116" height="80" rx="7" />
      <rect className="m-ink" x="152" y="194" width="34" height="5" />
      <circle className="m-c1 m-o-thin" cx="263" cy="197" r="4.5" />
      <g className="m-scr">
        {faces.map((f, i) => (
          <g key={f} ref={(el) => faceRefs?.(f, el)} style={faceRefs && i > 0 ? { display: 'none' } : undefined}>
            <FaceArt face={f} />
          </g>
        ))}
      </g>
    </>
  );
}

export function MascotHead({ face = 'open', className = '' }: { face?: Face; className?: string }) {
  return (
    <svg className={`mascot-head ${className}`} viewBox="124 8 172 212" aria-hidden="true">
      <HeadArt faces={[face]} />
    </svg>
  );
}

const KEYS: ReactNode[] = [];
for (let row = 0; row < 2; row++) {
  for (let k = 0; k < 10; k++) {
    const tone = (row * 10 + k) % 7 === 3 ? 'm-c1' : (row * 10 + k) % 9 === 5 ? 'm-c2' : 'm-paper';
    KEYS.push(<rect key={`${row}-${k}`} className={tone} x={139 + k * 16 + row * 3} y={321 + row * 17} width="12" height="12" rx="2" />);
  }
}

const LIVE_FACES: Face[] = ['open', 'blink', 'shout', 'happy'];

export function Mascot({ variant = 'play', className = '' }: { variant?: Variant; className?: string }) {
  const root = useRef<SVGSVGElement>(null);
  const parts = useRef<Partial<Record<Part, SVGGElement>>>({});
  const faces = useRef<Partial<Record<Face, SVGGElement>>>({});

  const part = (name: Part) => (el: SVGGElement | null) => {
    if (el) parts.current[name] = el;
  };

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(svg);

    const turb = document.querySelector('#boil-m feTurbulence');
    let seed = 1;
    let shown: Face | null = null;

    const apply = (name: Part, t: number, e: number, L: number) => {
      const el = parts.current[name];
      if (!el) return;
      const rig = RIG[name];
      const p = rig.pose(t, e, L, variant);
      el.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(2)} ${rig.cx} ${rig.cy})`);
    };

    const showFace = (f: Face) => {
      if (f === shown) return;
      shown = f;
      for (const key of LIVE_FACES) {
        const el = faces.current[key];
        if (el) el.style.display = key === f ? '' : 'none';
      }
    };

    const idle: Face = variant === 'wave' ? 'happy' : 'open';
    (Object.keys(RIG) as Part[]).forEach((name) => apply(name, 0, 0, 0));
    showFace(idle);

    const off = projector.onTick((f, st) => {
      if (st.reduced || !visible) return;
      const t = f / FPS;
      // Sahne ilerledikçe figür sağa sola yatar. Her parça bu yatışı
      // kendi karesinde yakaladığı için yelek ve kafa geç "pop" eder.
      const L = variant === 'play' ? Math.sin(projector.progressOf(svg) * 9) : 0;
      for (const name of Object.keys(RIG) as Part[]) {
        const rig = RIG[name];
        if ((f + rig.offset) % rig.on === 0) apply(name, t, st.energy, L);
      }
      if (f % 2 === 0) {
        seed = (seed % 9) + 1;
        turb?.setAttribute('seed', String(seed));
      }
      if (f % 3 === 0) showFace(st.energy > 0.4 ? 'shout' : f % 84 < 3 ? 'blink' : idle);
    });

    return () => {
      off();
      io.disconnect();
    };
  }, [variant]);

  const strum = variant === 'wave' ? 'M258 250 L312 226 L304 158' : 'M258 250 L304 314 L244 358';
  const hand = variant === 'wave' ? { cx: 304, cy: 156 } : { cx: 244, cy: 358 };

  return (
    <svg
      ref={root}
      className={`mascot mascot--${variant} ${className}`}
      viewBox="-50 0 520 620"
      role="img"
      aria-label="Monitör kafalı, mohawklı, klavyeyi gitar gibi çalan punk maskot"
    >
      <g filter="url(#boil-m)">
        <g ref={part('legs')}>
          <Cut>
            <polygon className="m-ink m-o" points="176,380 208,380 198,550 168,550" />
            <polygon className="m-ink m-o" points="212,380 246,380 264,550 234,550" />
            <path className="m-paper m-o" d="M160 544 h46 v30 h-68 v-10 z" />
            <path className="m-paper m-o" d="M230 544 h44 l22 20 v10 h-66 z" />
          </Cut>
          <path className="m-line" d="M168 556 h30 M168 564 h30 M240 556 h30 M242 564 h34" />
          <rect className="m-c2 m-o-thin" x="172" y="446" width="26" height="22" transform="rotate(-8 185 457)" />
          <path className="m-chain" d="M178 396 q22 52 64 6" />
        </g>

        <g ref={part('cable')} className="m-cable">
          <path className="m-wire-h" d="M280 160 C 344 172, 334 262, 318 304 S 334 474, 396 566" />
          <path className="m-wire" d="M280 160 C 344 172, 334 262, 318 304 S 334 474, 396 566" />
          <rect className="m-paper m-o-thin" x="388" y="560" width="22" height="13" rx="2" />
        </g>

        <g ref={part('torso')}>
          <Cut>
            <rect className="m-paper m-o" x="199" y="198" width="22" height="44" />
            <polygon className="m-white m-o" points="166,236 254,236 264,396 156,396" />
          </Cut>
          <polygon className="m-tex" fill="url(#p-stripes)" points="167,238 253,238 263,380 157,380" />
          <polygon className="m-ink" points="157,380 263,380 264,396 156,396" />
          {[170, 188, 206, 224, 242].map((x) => (
            <rect key={x} className="m-white" x={x} y="384" width="8" height="8" />
          ))}
        </g>

        <g ref={part('vest')}>
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
        </g>

        <g ref={part('armL')}>
          <path className="m-arm-h" d="M164 250 L130 324 L96 298" />
          <path className="m-arm-o" d="M164 250 L130 324 L96 298" />
          <path className="m-arm-f" d="M164 250 L130 324 L96 298" />
          <path className="m-band" d="M118 314 L108 306" />
          <circle className="m-paper m-o" cx="96" cy="298" r="13" />
        </g>

        <g ref={part('keytar')}>
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
            <rect className="m-paper" x="142" y="356" width="12" height="12" rx="2" />
            <rect className="m-paper" x="158" y="356" width="12" height="12" rx="2" />
            <rect className="m-c2" x="174" y="356" width="76" height="12" rx="2" />
            <rect className="m-paper" x="254" y="356" width="12" height="12" rx="2" />
            <rect className="m-c1" x="270" y="356" width="24" height="12" rx="2" />
          </g>
        </g>

        <g ref={part('armR')}>
          <path className="m-arm-h" d={strum} />
          <path className="m-arm-o" d={strum} />
          <path className="m-arm-f" d={strum} />
          <circle className="m-paper m-o" cx={hand.cx} cy={hand.cy} r="13" />
        </g>

        <g ref={part('head')}>
          <HeadArt
            faces={LIVE_FACES}
            hawkRef={part('hawk')}
            faceRefs={(f, el) => {
              if (el) faces.current[f] = el;
            }}
          />
        </g>
      </g>
    </svg>
  );
}
