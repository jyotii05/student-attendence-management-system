import { useState } from 'react';
import { MapPin, User, Coffee } from 'lucide-react';
import { WEEKDAYS } from '../../data/catalog';
import { LECTURE_SLOTS } from '../../utils/attendance';
import { minutesNow, toMinutes } from '../../utils/date';
import Segmented from '../ui/Segmented';

/** Status of a lecture relative to "now" in the current week. */
export function lectureStatus(day, slotId, marked) {
  const today = new Date().getDay();
  const slot = LECTURE_SLOTS.find((s) => s.id === slotId);
  if (today === 0 || day < today) return marked === false ? 'missed' : 'done';
  if (day > today) return 'upcoming';
  const now = minutesNow();
  if (now >= toMinutes(slot.end)) return marked === false ? 'pending' : 'done';
  if (now >= toMinutes(slot.start)) return 'live';
  return 'upcoming';
}

const STATE = {
  done: { label: 'Completed', cls: 'bg-present-soft text-present' },
  live: { label: 'Ongoing', cls: 'bg-brand-600 text-white' },
  upcoming: { label: 'Upcoming', cls: 'bg-muted text-ink-3' },
  pending: { label: 'Not marked', cls: 'bg-late-soft text-late-ink dark:text-amber-400' },
  missed: { label: 'Not marked', cls: 'bg-danger-soft text-danger' },
};

export function LectureStateBadge({ state }) {
  const s = STATE[state];
  return (
    <span className={`chip ${s.cls}`}>
      {state === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {s.label}
    </span>
  );
}

/**
 * Weekly timetable. entries: [{ id, day, slot, subject, faculty, room, classLabel?, marked? }]
 * Desktop: day × lecture grid. Mobile: one day at a time.
 */
export default function TimetableGrid({ entries, showClass = false }) {
  const todayDow = new Date().getDay();
  const [mobileDay, setMobileDay] = useState(todayDow >= 1 && todayDow <= 6 ? todayDow : 1);
  const at = (day, slot) => entries.find((e) => e.day === day && e.slot === slot);
  const usedSlots = LECTURE_SLOTS.filter((s) => entries.some((e) => e.slot === s.id));

  const Cell = ({ e, day }) => {
    if (!e)
      return (
        <div className="flex h-full min-h-[96px] items-center justify-center rounded-lg border border-dashed border-line text-[11px] text-ink-3">
          <Coffee className="mr-1.5 h-3.5 w-3.5" /> Free period
        </div>
      );
    const state = lectureStatus(day, e.slot, e.marked);
    const isToday = day === todayDow;
    return (
      <div
        className={`group flex h-full min-h-[96px] flex-col rounded-lg border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-pop ${
          state === 'live' ? 'border-brand bg-brand-soft' : isToday ? 'border-brand/30 bg-surface' : 'border-line bg-surface'
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <p className="text-[13px] leading-snug font-bold text-ink">{e.subject}</p>
        </div>
        {showClass && e.classLabel && <p className="mt-0.5 text-[11px] font-semibold text-brand">{e.classLabel}</p>}
        <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-3">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{e.faculty}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-3">
          <MapPin className="h-3 w-3 shrink-0" /> {e.room}
        </p>
        <div className="mt-auto pt-2">
          <LectureStateBadge state={state} />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="grid min-w-[980px] gap-2" style={{ gridTemplateColumns: '108px repeat(6, minmax(0, 1fr))' }}>
          <div />
          {WEEKDAYS.map((d) => (
            <div
              key={d.id}
              className={`rounded-lg px-3 py-2 text-center text-xs font-bold tracking-wide uppercase ${d.id === todayDow ? 'bg-brand-600 text-white' : 'bg-brand-softer text-ink-2'}`}
            >
              {d.name}
              {d.id === todayDow && <span className="ml-1.5 text-[10px] font-semibold normal-case opacity-80">Today</span>}
            </div>
          ))}
          {usedSlots.map((s) => (
            <div key={s.id} className="contents">
              <div className="flex flex-col justify-center rounded-lg px-2 text-right">
                <span className="text-xs font-bold text-ink">{s.start}</span>
                <span className="text-[11px] text-ink-3">{s.end}</span>
                <span className="mt-0.5 text-[10px] font-semibold text-ink-3 uppercase">{s.label}</span>
              </div>
              {WEEKDAYS.map((d) => (
                <Cell key={d.id} e={at(d.id, s.id)} day={d.id} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile / tablet list */}
      <div className="lg:hidden">
        <Segmented options={WEEKDAYS.map((d) => ({ value: d.id, label: d.short }))} value={mobileDay} onChange={setMobileDay} className="mb-4 w-full" />
        <div className="space-y-2.5">
          {usedSlots.map((s) => (
            <div key={s.id} className="grid grid-cols-[64px_1fr] gap-3">
              <div className="pt-2.5 text-right">
                <p className="text-xs font-bold text-ink">{s.start}</p>
                <p className="text-[11px] text-ink-3">{s.end}</p>
              </div>
              <Cell e={at(mobileDay, s.id)} day={mobileDay} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
