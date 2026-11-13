import { useEffect, useState } from 'react';
import { sections } from '../content';

/** Etiket makinesinden çıkmış içindekiler şeridi. */
export function Nav() {
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <nav className="nav" aria-label="Sayfalar">
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="dymo" aria-current={active === s.id ? 'true' : undefined}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
