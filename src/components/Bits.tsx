import { useEffect, useRef, type CSSProperties } from 'react';
import { projector } from '../engine/projector';
import { Step } from '../engine/Step';
import { rng, torn } from '../engine/rand';

/** Sayfanın her yerinden kullanılan SVG filtreleri ve fotokopi desenleri. */
export function SvgDefs() {
  return (
    <svg className="defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        {/* Elle çizilmiş çizginin titremesi. Tohumu projektör değiştirir. */}
        <filter id="boil" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="1" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="boil-m" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="1" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Makasla kesilmiş kenar. Sabit. */}
        <filter id="rough" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <pattern id="p-dots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <circle cx="3.5" cy="3.5" r="1.7" />
        </pattern>
        <pattern id="p-stripes" width="12" height="24" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" />
        </pattern>
        <pattern id="p-news" width="64" height="7" patternUnits="userSpaceOnUse">
          <rect x="2" y="2" width="26" height="1.6" />
          <rect x="32" y="2" width="12" height="1.6" />
          <rect x="48" y="2" width="14" height="1.6" />
        </pattern>
      </defs>
    </svg>
  );
}

/** Fotokopi greni. Küçük bir gürültü karosu üretir ve "on 3s" yerini değiştirir. */
export function Grain() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const size = 240;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const r = rng(7);
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const dark = r() < 0.6;
      const v = dark ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = r() ** 3 * (dark ? 78 : 46);
    }
    ctx.putImageData(img, 0, 0);
    // Toner lekeleri ve tamburdan kalan çizikler.
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    for (let i = 0; i < 22; i++) ctx.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2);
    ctx.fillStyle = 'rgba(0,0,0,.07)';
    for (let i = 0; i < 3; i++) ctx.fillRect(r() * size, 0, 1, size);

    el.style.backgroundImage = `url(${c.toDataURL()})`;

    return projector.onTick((f, st) => {
      if (st.reduced || f % 3) return;
      el.style.transform = `translate3d(${-Math.floor(r() * size)}px,${-Math.floor(r() * size)}px,0)`;
    });
  }, []);

  return <div ref={ref} className="grain" aria-hidden="true" />;
}

/** Bir sayfanın üst kenarındaki yırtık. Altta kağıdın beyaz lifi görünür. */
export function Tear({ seed }: { seed: number }) {
  return (
    <div className="tear" aria-hidden="true">
      <div className="tear__fibre" style={{ clipPath: torn(seed + 1, { top: 22, n: 70 }) }} />
      <div className="tear__body" style={{ clipPath: torn(seed, { top: 20, n: 54 }) }} />
    </div>
  );
}

export function Tape({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span className={`tape ${className}`} style={style} aria-hidden="true" />;
}

/** Keçeli kalemle çizilmiş ok. */
export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={`scribble ${className}`} viewBox="0 0 80 120" aria-hidden="true">
      <g filter="url(#boil)">
        <path d="M34 6 C 58 30, 14 52, 40 104" pathLength={1} />
        <path d="M18 84 L 41 108 L 58 80" pathLength={1} />
      </g>
    </svg>
  );
}

/** Keçeli kalemle çizilmiş yıldız patlaması. */
export function Burst({ className = '', points = 14 }: { className?: string; points?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const rad = i % 2 ? 34 : 49;
    pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)},${(50 + Math.sin(a) * rad).toFixed(1)}`);
  }
  return (
    <svg className={`burst ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <polygon points={pts.join(' ')} filter="url(#rough)" />
    </svg>
  );
}

/** İki sayfanın arasına gerilmiş şerit. Yazı scroll ile kayar, iki şerit ayrı kare hızında. */
export function Band({ words }: { words: string[] }) {
  const line = Array.from({ length: 10 }, () => words.join(' / ')).join(' / ');
  return (
    <div className="band" aria-hidden="true">
      <Step className="band__strip band__strip--a" on={2}>
        <span>{line}</span>
      </Step>
      <Step className="band__strip band__strip--b" on={4} offset={1}>
        <span>{line}</span>
      </Step>
    </div>
  );
}
