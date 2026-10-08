import { useState } from 'react';
import { CheckCheck, BellOff, Trash2, Check } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import { NOTIF_META } from '../../components/Header/notificationMeta';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo, formatDateTime } from '../../utils/date';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'alert', label: 'Alerts' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'system', label: 'System' },
];

export default function Notifications() {
  const { role } = useAuth();
  const { notifications, markRead, markAllRead, removeNotification } = useData();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const mine = notifications.filter((n) => n.audience.includes(role));
  const unread = mine.filter((n) => !n.read).length;

  const list = mine.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'attendance') return n.type === 'attendance' || n.type === 'update';
    if (filter === 'system') return n.type === 'system' || n.type === 'report';
    return n.type === filter;
  });

  const groups = [
    { label: 'Today', items: list.filter((n) => Date.now() - n.time < 86400000) },
    { label: 'Earlier', items: list.filter((n) => Date.now() - n.time >= 86400000) },
  ].filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Notifications"
        description={unread ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}.` : 'You’re all caught up.'}
        actions={
          <button
            className="btn btn-secondary"
            disabled={!unread}
            onClick={() => {
              markAllRead(role);
              toast.success('All notifications marked as read');
            }}
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        }
      />
      <Segmented className="mb-5" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ ...f, count: f.value === 'unread' ? unread : undefined }))} />

      {groups.length === 0 ? (
        <div className="card">
          <EmptyState icon={BellOff} title={filter === 'unread' ? 'No unread notifications' : 'No notifications'} message="New attendance updates, warnings and announcements will appear here." />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label}>
              <p className="mb-2 px-1 text-[11px] font-bold tracking-wider text-ink-3 uppercase">{g.label}</p>
              <div className="card divide-y divide-line overflow-hidden">
                {g.items.map((n) => {
                  const m = NOTIF_META[n.type] || NOTIF_META.system;
                  const Icon = m.icon;
                  return (
                    <div key={n.id} className={`group flex gap-4 px-4 py-4 transition-colors sm:px-5 ${n.read ? 'hover:bg-hover' : 'bg-brand-softer hover:bg-hover'}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.cls}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink">{n.title}</p>
                          {!n.read && <span className="chip bg-brand px-1.5 py-0 text-[10px] text-white">New</span>}
                          <span className="chip bg-muted px-1.5 py-0 text-[10px] text-ink-3">{m.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink-2">{n.message}</p>
                        <p className="mt-1.5 text-[11px] text-ink-3" title={formatDateTime(n.time)}>
                          {timeAgo(n.time)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                        {!n.read && (
                          <button className="btn-icon h-8 w-8 hover:text-brand" onClick={() => markRead(n.id)} title="Mark as read" aria-label="Mark as read">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="btn-icon h-8 w-8 hover:bg-danger-soft hover:text-danger"
                          onClick={() => {
                            removeNotification(n.id);
                            toast.info('Notification removed');
                          }}
                          title="Delete"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
