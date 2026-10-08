// Derived views over raw data, shared by several pages.
import { summarize, emptyCounts } from './attendance';
import { addDays, todayISO } from './date';

/** Every lecture a student has a record for, newest first. */
export function studentEntries(student, sessions, subjectsById, facultyById) {
  const out = [];
  for (const s of sessions) {
    const st = s.records[student.id];
    if (!st) continue;
    out.push({
      sessionId: s.id,
      date: s.date,
      slot: s.slot,
      status: st,
      subjectId: s.subjectId,
      subject: subjectsById[s.subjectId]?.name || 'Unknown subject',
      faculty: facultyById[s.facultyId]?.name || s.markedBy,
      edit: s.edits?.[student.id],
    });
  }
  return out.sort((a, b) => (a.date === b.date ? b.slot - a.slot : a.date < b.date ? 1 : -1));
}

/** Per-subject summary for one student (every subject of their course & semester). */
export function subjectBreakdown(student, stats, subjects, settings) {
  const mine = stats.byStudentSubject[student.id] || {};
  return subjects
    .filter((s) => s.course === student.course && s.semester === student.semester)
    .map((sub) => ({ subject: sub, ...summarize(mine[sub.id] || emptyCounts(), settings) }));
}

/** Sum counts over a date window [from, to]. */
export function windowCounts(byDate, from, to) {
  const c = emptyCounts();
  for (const d in byDate) {
    if (d < from || d > to) continue;
    const x = byDate[d];
    c.P += x.P;
    c.A += x.A;
  }
  return c;
}

/** Week-over-week change in attendance % (percentage points). */
export function weekOverWeek(byDate, settings) {
  const t = todayISO();
  const cur = summarize(windowCounts(byDate, addDays(t, -6), t), settings).pct;
  const prev = summarize(windowCounts(byDate, addDays(t, -13), addDays(t, -7)), settings).pct;
  return { cur, prev, delta: cur != null && prev != null ? cur - prev : null };
}

/** Latest date that has attendance, and the one before it. */
export function latestDates(byDate) {
  const dates = Object.keys(byDate).sort();
  return { last: dates[dates.length - 1] || null, prev: dates[dates.length - 2] || null };
}

/** Shape timetable rows for <TimetableGrid>. */
export function timetableEntries(rows, { subjectsById, facultyById, classesById }) {
  return rows.map((t) => {
    const sub = subjectsById[t.subjectId];
    const cls = classesById[t.classId];
    return {
      ...t,
      subject: sub?.name || 'Unknown subject',
      faculty: facultyById[sub?.facultyId]?.name || 'Unassigned',
      classLabel: cls ? `${cls.course} · Sem ${cls.semester} ${cls.division}` : '',
    };
  });
}
