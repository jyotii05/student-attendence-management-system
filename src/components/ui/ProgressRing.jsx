import { useEffect, useState } from 'react';

/** Animated circular progress. Colour follows standing unless overridden. */
export default function ProgressRing({ value, size = 140, stroke = 12, threshold = 75, label = 'Overall', color }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value ?? 0));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, shown));
  const tone = color || (value == null ? '#94a3b8' : value < threshold ? '#dc2626' : '#2563eb');

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold tracking-tight text-ink" style={{ fontSize: Math.max(14, size / 6.2) }}>
          {value == null ? '—' : `${value.toFixed(1)}%`}
        </span>
        {label && <span className="text-[11px] font-medium text-ink-3">{label}</span>}
      </div>
    </div>
  );
}
