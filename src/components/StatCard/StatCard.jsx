import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * KPI tile. tone="danger" for attention metrics (e.g. low attendance).
 * trend: { value: number, label?: string, goodWhenUp?: boolean }
 */
export default function StatCard({ icon: Icon, label, value, trend, tone = 'brand', hint, onClick }) {
  const danger = tone === 'danger';
  const t = trend?.value;
  const up = t > 0;
  const flat = t == null || Math.abs(t) < 0.05;
  const good = flat ? null : trend.goodWhenUp === false ? !up : up;
  const TrendIcon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag onClick={onClick} className={`card card-hover group relative w-full overflow-hidden p-4 text-left ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${danger ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand'}`}>
          <Icon className="h-5 w-5" />
        </span>
        {trend?.text && <span className="chip bg-brand-soft text-brand-600 dark:text-blue-300">{trend.text}</span>}
        {trend && !trend.text && (
          <span
            className={`chip ${flat ? 'bg-muted text-ink-3' : good ? 'bg-present-soft text-present' : 'bg-danger-soft text-danger'}`}
            title={trend.label}
          >
            <TrendIcon className="h-3 w-3" />
            {flat ? '0.0' : `${up ? '+' : ''}${t.toFixed(1)}`}
            {trend.unit ?? '%'}
          </span>
        )}
      </div>
      <p className={`mt-4 text-[26px] leading-none font-extrabold tracking-tight ${danger ? 'text-danger' : 'text-brand-900 dark:text-blue-200'}`}>{value}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-ink-2">{label}</p>
      {(hint || trend?.label) && <p className="mt-0.5 truncate text-[11px] text-ink-3">{hint || trend.label}</p>}
    </Tag>
  );
}
