import { Check } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { STATUS, STATUS_KEYS } from '../../utils/attendance';
import { fmtPct } from '../../utils/format';

const ACTIVE = {
  P: 'bg-present text-white border-present shadow-sm',
  A: 'bg-danger text-white border-danger shadow-sm',
};
const IDLE = {
  P: 'hover:border-present/60 hover:bg-present-soft hover:text-present',
  A: 'hover:border-danger/60 hover:bg-danger-soft hover:text-danger',
};

export function StatusToggle({ value, onChange, disabled, compact }) {
  return (
    <div className={`flex gap-1.5 ${compact ? 'w-full' : ''}`} role="radiogroup">
      {STATUS_KEYS.map((k) => {
        const on = value === k;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(k)}
            className={`inline-flex items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${
              compact ? 'h-9 flex-1 px-1' : 'h-8 min-w-[78px] px-2.5'
            } ${on ? ACTIVE[k] : `border-line bg-surface text-ink-3 ${IDLE[k]}`}`}
            title={STATUS[k].label}
          >
            {on && <Check className="h-3.5 w-3.5" />}
            {STATUS[k].label}
          </button>
        );
      })}
    </div>
  );
}

/** Roll-call table used on the Mark Attendance page. */
export default function AttendanceTable({ students, values, onChange, summaries = {}, threshold = 75, editedIds = new Set() }) {
  return (
    <>
      {/* Phones: one card per student with a compact toggle */}
      <ul className="divide-y divide-line md:hidden">
        {students.map((s) => {
          const pct = summaries[s.id]?.pct;
          return (
            <li key={s.id} className={`flex flex-col gap-2.5 px-4 py-3 ${values[s.id] ? '' : 'bg-late-soft/30'}`}>
              <div className="flex items-center gap-3">
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
                  <p className="text-[11px] text-ink-3">
                    {s.rollNo} · <span className={pct != null && pct < threshold ? 'font-semibold text-danger' : ''}>{fmtPct(pct)}</span>
                    {editedIds.has(s.id) && <span className="ml-1 font-semibold text-brand">· edited</span>}
                  </p>
                </div>
              </div>
              <StatusToggle compact value={values[s.id]} onChange={(k) => onChange(s.id, k)} />
            </li>
          );
        })}
      </ul>
    <div className="hidden overflow-x-auto md:block">
      <table className="table-base min-w-[680px]">
        <thead>
          <tr>
            <th className="w-24">Roll No</th>
            <th>Student</th>
            <th className="w-28">Overall</th>
            {STATUS_KEYS.map((k) => (
              <th key={k} className="w-[110px] text-center">
                <span className={`inline-flex items-center gap-1.5 ${STATUS[k].text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS[k].solid}`} />
                  {STATUS[k].label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const v = values[s.id];
            const pct = summaries[s.id]?.pct;
            return (
              <tr key={s.id} className={v ? '' : 'bg-late-soft/30'}>
                <td className="font-mono text-xs font-semibold text-ink-2">{s.rollNo}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{s.name}</p>
                      <p className="text-[11px] text-ink-3">
                        {s.id}
                        {editedIds.has(s.id) && <span className="ml-2 font-semibold text-brand">· edited</span>}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`text-xs font-bold tabular-nums ${pct != null && pct < threshold ? 'text-danger' : 'text-ink-2'}`}>{fmtPct(pct)}</span>
                </td>
                {STATUS_KEYS.map((k) => {
                  const on = v === k;
                  return (
                    <td key={k} className="text-center">
                      <button
                        type="button"
                        onClick={() => onChange(s.id, k)}
                        aria-label={`Mark ${s.name} ${STATUS[k].label}`}
                        aria-pressed={on}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90 ${
                          on ? ACTIVE[k] : `border-line-strong bg-surface text-transparent ${IDLE[k]}`
                        }`}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
