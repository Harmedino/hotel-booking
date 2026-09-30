import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { money, shortDate } from '../../lib/format';

// Lightweight SVG area chart with a hover/touch tooltip.
export default function RevenueChart({ series }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 800;
  const H = 240;
  const PAD = 8;

  const { points, path, area, max } = useMemo(() => {
    const max = Math.max(1, ...series.map((s) => s.revenue));
    const step = series.length > 1 ? (W - PAD * 2) / (series.length - 1) : 0;
    const points = series.map((s, i) => ({ x: PAD + i * step, y: H - PAD - (s.revenue / max) * (H - PAD * 2 - 20), ...s }));
    // Smooth curve through points.
    const path = points.reduce((d, p, i, arr) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${d} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');
    const area = points.length ? `${path} L ${points.at(-1).x} ${H} L ${points[0].x} ${H} Z` : '';
    return { points, path, area, max };
  }, [series]);

  const onMove = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    points.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(points[nearest].x - x)) nearest = i; });
    setHover(nearest);
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-56 w-full touch-pan-y sm:h-64"
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--border)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
        ))}
        <motion.path d={area} fill="url(#rev-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {hp && <line x1={hp.x} x2={hp.x} y1="0" y2={H} stroke="var(--muted)" strokeOpacity="0.4" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hp && (
        <>
          <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand" style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%` }} />
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card"
            style={{ left: `${Math.min(88, Math.max(12, (hp.x / W) * 100))}%` }}
          >
            <p className="font-semibold text-ink">{money(hp.revenue)}</p>
            <p className="text-muted">{shortDate(hp.day)} · {hp.bookings} booking{hp.bookings === 1 ? '' : 's'}</p>
          </div>
        </>
      )}
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>{shortDate(series[0]?.day)}</span>
        <span>Peak {money(max)}</span>
        <span>{shortDate(series.at(-1)?.day)}</span>
      </div>
    </div>
  );
}
