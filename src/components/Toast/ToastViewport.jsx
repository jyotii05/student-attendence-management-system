import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from 'lucide-react';

const VARIANTS = {
  success: { icon: CircleCheck, cls: 'text-present', bar: 'bg-present' },
  error: { icon: CircleAlert, cls: 'text-danger', bar: 'bg-danger' },
  warning: { icon: TriangleAlert, cls: 'text-late', bar: 'bg-late' },
  info: { icon: Info, cls: 'text-brand', bar: 'bg-brand' },
};

export default function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="no-print pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5" aria-live="polite">
      {toasts.map((t) => {
        const v = VARIANTS[t.variant];
        const Icon = v.icon;
        return (
          <div key={t.id} role="status" className="animate-toast pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-line bg-surface py-3 pr-3 pl-4 shadow-pop sm:w-96">
            <span className={`absolute inset-y-0 left-0 w-1 ${v.bar}`} />
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${v.cls}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{t.message}</p>}
            </div>
            <button onClick={() => onDismiss(t.id)} className="rounded-md p-1 text-ink-3 hover:bg-hover hover:text-ink" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
