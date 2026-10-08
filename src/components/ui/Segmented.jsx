/** Compact segmented control used for tabs and range pickers. */
export default function Segmented({ options, value, onChange, size = 'md', className = '' }) {
  return (
    <div className={`inline-flex max-w-full overflow-x-auto rounded-lg border border-line bg-surface-2 p-0.5 ${className}`} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-semibold transition-all ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'} ${
              active ? 'bg-surface text-brand-600 shadow-card ring-1 ring-line dark:text-blue-300' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {o.label}
            {o.count != null && <span className={`rounded px-1 text-[10px] ${active ? 'bg-brand-soft' : 'bg-muted'}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
