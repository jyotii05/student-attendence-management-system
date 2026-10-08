import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useScope } from './useScope';
import { summarize, classesNeeded } from '../utils/attendance';

/** Every (student, subject) pair below the configured minimum attendance. */
export function useLowAttendance() {
  const { stats, settings, subjectsById, classesById } = useData();
  const scope = useScope();

  return useMemo(() => {
    const rows = [];
    for (const st of scope.students) {
      const bySub = stats.byStudentSubject[st.id] || {};
      for (const subId in bySub) {
        if (!scope.isAll && !scope.subjectIds.has(subId)) continue;
        const s = summarize(bySub[subId], settings);
        if (s.pct == null || s.pct >= settings.threshold) continue;
        rows.push({
          id: `${st.id}-${subId}`,
          student: st,
          subject: subjectsById[subId],
          cls: classesById[st.classId],
          ...s,
          needed: classesNeeded(s.attended, s.total, settings.threshold),
          severity: s.pct < settings.threshold - 15 ? 'critical' : 'warning',
        });
      }
    }
    return rows.sort((a, b) => a.pct - b.pct);
  }, [scope, stats, settings, subjectsById, classesById]);
}

/** Students whose overall attendance is below the threshold. */
export function useLowStudents() {
  const { stats, settings } = useData();
  const scope = useScope();
  return useMemo(
    () =>
      scope.students
        .map((st) => ({ student: st, ...summarize(stats.byStudent[st.id] || { P: 0, A: 0 }, settings) }))
        .filter((r) => r.pct != null && r.pct < settings.threshold)
        .sort((a, b) => a.pct - b.pct),
    [scope, stats, settings],
  );
}
