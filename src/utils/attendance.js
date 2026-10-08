// Attendance calculation engine.
// Status codes are stored compactly: P = Present, A = Absent.

import { formatShortDate, startOfWeek, MONTHS_SHORT, parseISODate } from './date';

export const STATUS = {
  P: { key: 'P', label: 'Present', color: '#16A34A', text: 'text-present', bg: 'bg-present-soft', ring: 'ring-present/30', solid: 'bg-present', emoji: '🟢' },
  A: { key: 'A', label: 'Absent', color: '#DC2626', text: 'text-danger', bg: 'bg-danger-soft', ring: 'ring-danger/30', solid: 'bg-danger', emoji: '🔴' },
};
export const STATUS_KEYS = ['P', 'A'];

export const LECTURE_SLOTS = [
  { id: 1, start: '09:00', end: '10:00', label: 'Lecture 1' },
  { id: 2, start: '10:00', end: '11:00', label: 'Lecture 2' },
  { id: 3, start: '11:15', end: '12:15', label: 'Lecture 3' },
  { id: 4, start: '12:15', end: '13:15', label: 'Lecture 4' },
  { id: 5, start: '14:00', end: '15:00', label: 'Lecture 5' },
];
export const slotById = (id) => LECTURE_SLOTS.find((s) => s.id === Number(id));
export const slotLabel = (id) => {
  const s = slotById(id);
  return s ? `${s.start} – ${s.end}` : '—';
};

export const emptyCounts = () => ({ P: 0, A: 0 });

/**
 * Attendance % = attended / total × 100
 *   attended = Present
 *   total    = Present + Absent
 * e.g. Present 28, Absent 2 → 28 / 30 = 93.33%
 */
export function summarize(c, settings = {}) {
  const attended = c.P;
  const total = c.P + c.A;
  const marked = total;
  const pct = total > 0 ? (attended / total) * 100 : null;
  return { ...c, marked, attended, total, missed: total - attended, pct };
}

export const percent = (c, settings) => summarize(c, settings).pct;

/** Lectures that must be attended consecutively to reach the threshold. */
export function classesNeeded(attended, total, threshold) {
  const t = threshold / 100;
  if (total === 0 || attended / total >= t) return 0;
  if (t >= 1) return Infinity;
  return Math.ceil((t * total - attended) / (1 - t));
}

/** Lectures a student can still miss while staying above the threshold. */
export function canSkip(attended, total, threshold) {
  const t = threshold / 100;
  if (total === 0 || t === 0) return 0;
  return Math.max(0, Math.floor(attended / t - total));
}

export function standing(pct, threshold) {
  if (pct == null) return 'none';
  if (pct < threshold) return 'low';
  if (pct < threshold + 10) return 'warning';
  return 'good';
}

export const STANDING = {
  good: { label: 'Good', cls: 'bg-present-soft text-present' },
  warning: { label: 'Warning', cls: 'bg-late-soft text-late-ink dark:text-amber-400' },
  low: { label: 'Low Attendance', cls: 'bg-danger-soft text-danger dark:text-red-400' },
  none: { label: 'No records', cls: 'bg-muted text-ink-3' },
};

const bump = (map, key, st) => {
  let c = map[key];
  if (!c) c = map[key] = emptyCounts();
  c[st]++;
};

/**
 * Single pass over sessions producing every aggregate the UI needs.
 * options.studentIds (Set) limits counting to specific students.
 */
export function tally(sessions, { classesById = {}, studentIds = null } = {}) {
  const overall = emptyCounts();
  const byDate = {};
  const bySubject = {};
  const byClass = {};
  const byDept = {};
  const byStudent = {};
  const byStudentSubject = {};
  const conductedBySubject = {};
  let sessionCount = 0;

  for (const s of sessions) {
    const dept = classesById[s.classId]?.department;
    let counted = false;
    for (const sid in s.records) {
      if (studentIds && !studentIds.has(sid)) continue;
      const st = s.records[sid];
      if (!st) continue;
      counted = true;
      overall[st]++;
      bump(byDate, s.date, st);
      bump(bySubject, s.subjectId, st);
      bump(byClass, s.classId, st);
      if (dept) bump(byDept, dept, st);
      bump(byStudent, sid, st);
      let ss = byStudentSubject[sid];
      if (!ss) ss = byStudentSubject[sid] = {};
      bump(ss, s.subjectId, st);
    }
    if (counted) {
      sessionCount++;
      conductedBySubject[s.subjectId] = (conductedBySubject[s.subjectId] || 0) + 1;
    }
  }
  return { overall, byDate, bySubject, byClass, byDept, byStudent, byStudentSubject, conductedBySubject, sessionCount };
}

/** Daily % series for line charts. */
export function dailySeries(byDate, settings, { from, to } = {}) {
  return Object.keys(byDate)
    .filter((d) => (!from || d >= from) && (!to || d <= to))
    .sort()
    .map((date) => {
      const c = byDate[date];
      const n = c.P + c.A || 1;
      return {
        date,
        label: formatShortDate(date),
        Present: +((c.P / n) * 100).toFixed(1),
        Absent: +((c.A / n) * 100).toFixed(1),
        Attendance: +(summarize(c, settings).pct ?? 0).toFixed(1),
        counts: c,
      };
    });
}

function groupSeries(byDate, settings, keyFn, labelFn) {
  const groups = {};
  for (const d in byDate) {
    const k = keyFn(d);
    const g = (groups[k] ||= emptyCounts());
    const c = byDate[d];
    g.P += c.P;
    g.A += c.A;
  }
  return Object.keys(groups)
    .sort()
    .map((k) => {
      const s = summarize(groups[k], settings);
      return { key: k, label: labelFn(k), Attendance: +(s.pct ?? 0).toFixed(1), Present: s.P, Absent: s.A, total: s.total };
    });
}

export const weeklySeries = (byDate, settings) =>
  groupSeries(byDate, settings, startOfWeek, (k) => `Wk ${formatShortDate(k)}`);

export const monthlySeries = (byDate, settings) =>
  groupSeries(
    byDate,
    settings,
    (d) => d.slice(0, 7),
    (k) => MONTHS_SHORT[Number(k.slice(5, 7)) - 1] + ' ' + k.slice(2, 4),
  );

export function weekdaySeries(byDate, settings) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rows = groupSeries(byDate, settings, (d) => String(parseISODate(d).getDay()), (k) => names[Number(k)]);
  return rows.filter((r) => r.key !== '0').sort((a, b) => Number(a.key) - Number(b.key));
}

export function distribution(c) {
  const total = c.P + c.A;
  return STATUS_KEYS.map((k) => ({
    key: k,
    name: STATUS[k].label,
    value: c[k],
    color: STATUS[k].color,
    pct: total ? (c[k] / total) * 100 : 0,
  }));
}
