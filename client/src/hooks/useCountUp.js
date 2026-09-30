import { useEffect, useRef, useState } from 'react';

// Animates 0 -> target once the element scrolls into view.
export function useCountUp(target, duration = 1200) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (!target || !ref.current || reduce) return;
    let raf;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        setValue(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    obs.observe(ref.current);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration, reduce]);
  return [ref, reduce ? target || 0 : value];
}
