import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User } from 'lucide-react';
import { MONTHS, toISODate, todayISO, formatDate } from '../../utils/date';
import { STATUS, STATUS_KEYS, slotLabel } from '../../utils/attendance';
import { StatusBadge } from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

/**
 * Month view of one student's lectures. Each day shows a dot per lecture,
 * coloured by status (with letters for colour-blind safety in the detail list).
 * entries: [{ date, slot, status, subject, faculty }]
 */
export default function AttendanceCalendar({ entries, workingDays = [1, 2, 3, 4, 5, 6], initialDate }) {
  const byDate = useMemo(() => {
    const m = {};
    for (const e of entries) (m[e.date] ||= []).push(e);
    for (const d in m) m[d].sort((a, b) => a.slot - b.slot);
    return m;
  }, [entries]);

  const start = initialDate || todayISO();
  const [cursor, setCursor] = useState(() => ({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(() => {
    const dates = Object.keys(byDate).sort();
    return byDate[start] ? start : dates[dates.length - 1] || null;
  });

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first grid
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(toISODate(new Date(cursor.y, cursor.m, d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const monthEntries = entries.filter((e) => e.date.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`));
  const monthCounts = STATUS_KEYS.map((k) => ({ k, n: monthEntries.filter((e) => e.status === k).length }));
  const shift = (n) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const today = todayISO();
  const dayEntries = selected ? byDate[selected] || [] : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button className="btn-icon" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="min-w-[150px] text-center text-sm font-bold text-ink">
              {MONTHS[cursor.m]} {cursor.y}
            </h3>
            <button className="btn-icon" onClick={() => shift(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {monthCounts.map(({ k, n }) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS[k].solid}`} />
                {STATUS[k].label} <b className="text-ink">{n}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="pb-1 text-[11px] font-bold tracking-wide text-ink-3 uppercase">
              {d}
            </div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e${i}`} />;
            const list = byDate[iso] || [];
            const wd = new Date(iso + 'T00:00:00').getDay();
            const off = !workingDays.includes(wd);
            const isSel = iso === selected;
            const isToday = iso === today;
            const absent = list.some((e) => e.status === 'A');
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={`group relative flex aspect-square min-h-[44px] flex-col items-center justify-between rounded-lg border p-1 text-xs transition-all sm:aspect-auto sm:h-[68px] sm:items-start sm:p-2 ${
                  isSel
                    ? 'border-brand bg-brand-soft ring-2 ring-brand/20'
                    : off
                      ? 'border-transparent bg-surface-2 text-ink-3'
                      : 'border-line bg-surface hover:border-brand/40 hover:bg-hover'
                }`}
                aria-label={`${formatDate(iso)}: ${list.length} lectures`}
              >
                <span
                  className={`font-semibold ${isToday ? 'flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white' : isSel ? 'text-brand-600 dark:text-blue-300' : 'text-ink'}`}
                >
                  {Number(iso.slice(8))}
                </span>
                {list.length > 0 && (
                  <span className="flex flex-wrap justify-center gap-0.5 sm:justify-start">
                    {list.map((e) => (
                      <span key={e.slot} className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${STATUS[e.status].solid}`} />
                    ))}
                  </span>
                )}
                {absent && <span className="absolute top-1.5 right-1.5 hidden h-1.5 w-1.5 rounded-full bg-danger sm:block" />}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="rounded-xl border border-line bg-surface-2 p-4">
        <p className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">Selected day</p>
        <h4 className="mt-0.5 text-sm font-bold text-ink">{selected ? formatDate(selected, { weekday: 'long' }) : 'Pick a date'}</h4>
        <div className="mt-4 space-y-2.5">
          {dayEntries.length === 0 ? (
            <EmptyState compact icon={CalendarDays} title="No lectures recorded" message="There is no attendance on this date. Select a highlighted day." />
          ) : (
            dayEntries.map((e) => (
              <div key={e.slot} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{e.subject}</p>
                  <StatusBadge status={e.status} size="sm" />
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-3">
                  <User className="h-3.5 w-3.5" /> {e.faculty}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-3">
                  <Clock className="h-3.5 w-3.5" /> Lecture {e.slot} · {slotLabel(e.slot)}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
