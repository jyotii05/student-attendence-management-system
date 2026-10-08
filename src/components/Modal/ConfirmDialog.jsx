import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert, CircleHelp } from 'lucide-react';

/** Small, focused confirmation dialog. tone="danger" for destructive actions. */
export default function ConfirmDialog({ open, onCancel, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary', children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onCancel?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  const danger = tone === 'danger';
  const Icon = danger ? TriangleAlert : CircleHelp;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/60" onClick={onCancel} />
      <div className="animate-pop relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${danger ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand'}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
        {message && <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{message}</p>}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
