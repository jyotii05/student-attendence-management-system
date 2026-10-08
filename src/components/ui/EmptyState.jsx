import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, compact }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-brand-soft opacity-60 blur-xl" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface text-brand shadow-card">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-3">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
