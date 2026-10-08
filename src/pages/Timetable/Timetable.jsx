import { useMemo, useState } from 'react';
import { CalendarClock, BookOpen, Clock, MapPin } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Field';
import TimetableGrid from '../../components/Timetable/TimetableGrid';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useScope } from '../../hooks/useScope';
import { timetableEntries } from '../../utils/selectors';
import { startOfWeek, todayISO, addDays, formatDate } from '../../utils/date';
import { classLabel } from '../../utils/format';

export default function Timetable() {
  const { role, profile } = useAuth();
  const data = useData();
  const { timetable, classes, findSession, classesById } = data;
  const scope = useScope();
  const [classId, setClassId] = useState(role === 'student' ? profile?.classId : classes[0]?.id);
  const weekStart = startOfWeek(todayISO());

  const entries = useMemo(() => {
    let rows;
    if (role === 'faculty') rows = timetable.filter((t) => scope.subjectIds.has(t.subjectId));
    else rows = timetable.filter((t) => t.classId === classId);
    return timetableEntries(rows, data).map((e) => {
      // Was this week's lecture marked? (staff view only)
      if (role === 'student') return e;
      const date = addDays(weekStart, e.day - 1);
      return date <= todayISO() ? { ...e, marked: !!findSession(e.classId, date, e.slot) } : e;
    });
  }, [role, timetable, scope.subjectIds, classId, data, weekStart, findSession]);

  const subjectsThisWeek = new Set(entries.map((e) => e.subjectId)).size;
  const rooms = [...new Set(entries.map((e) => e.room))];
  const cls = classesById[classId];

  return (
    <div className="space-y-5">
      <PageHeader
        title={role === 'faculty' ? 'My Teaching Timetable' : 'Weekly Timetable'}
        description={`Week of ${formatDate(weekStart)} · Monday to Saturday`}
        actions={
          role === 'admin' && (
            <div className="w-72">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabel(c)}
                  </option>
                ))}
              </Select>
            </div>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Clock, l: 'Lectures per week', v: entries.length },
          { icon: BookOpen, l: 'Subjects', v: subjectsThisWeek },
          { icon: MapPin, l: role === 'faculty' ? 'Classes' : 'Home room', v: role === 'faculty' ? new Set(entries.map((e) => e.classId)).size : cls?.room || rooms[0] || '—' },
        ].map((s) => (
          <div key={s.l} className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-extrabold text-ink">{s.v}</p>
              <p className="text-xs text-ink-3">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      <Card title={role === 'faculty' ? profile?.name : classLabel(cls)} subtitle="Lecture 1 starts 09:00 · Short break 11:00–11:15 · Lunch 13:15–14:00" icon={CalendarClock}>
        {entries.length === 0 ? <EmptyState icon={CalendarClock} title="No lectures scheduled" message="The timetable for this selection is empty." /> : <TimetableGrid entries={entries} showClass={role !== 'student'} />}
      </Card>
    </div>
  );
}
