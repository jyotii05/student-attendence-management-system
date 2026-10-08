import { STATUS, STANDING } from '../../utils/attendance';

export function Badge({ children, className = 'bg-muted text-ink-2', dot }) {
  return (
    <span className={`chip ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Present / Absent */
export function StatusBadge({ status, size = 'md' }) {
  const s = STATUS[status];
  if (!s) return <Badge>—</Badge>;
  return (
    <span className={`chip ${s.bg} ${s.text} ${size === 'sm' ? 'px-1.5 text-[11px]' : ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.solid}`} />
      {s.label}
    </span>
  );
}

/** Good / Warning / Low Attendance derived from a percentage */
export function StandingBadge({ standing }) {
  const s = STANDING[standing] || STANDING.none;
  return <span className={`chip ${s.cls}`}>{s.label}</span>;
}
