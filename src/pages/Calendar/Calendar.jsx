import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Field';
import { StandingBadge } from '../../components/ui/Badge';
import AttendanceCalendar from '../../components/AttendanceCalendar/AttendanceCalendar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useScope } from '../../hooks/useScope';
import { studentEntries } from '../../utils/selectors';
import { STATUS, STATUS_KEYS, standing } from '../../utils/attendance';
import { fmtPct, classLabel } from '../../utils/format';

export default function Calendar() {
  const { role, profile } = useAuth();
  const { sessions, subjectsById, facultyById, studentSummary, settings, studentsById } = useData();
  const scope = useScope();
  const isStudent = role === 'student';
  const [classId, setClassId] = useState(isStudent ? profile?.classId : scope.classes[0]?.id || '');
  const roster = scope.students.filter((s) => s.classId === classId).sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
  const [studentId, setStudentId] = useState(isStudent ? profile?.id : roster[0]?.id || '');
  const student = studentsById[studentId];

  const entries = useMemo(() => (student ? studentEntries(student, sessions, subjectsById, facultyById) : []), [student, sessions, subjectsById, facultyById]);
  const sum = student ? studentSummary(student.id) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance Calendar"
        description="Each dot is one lecture. Click a date to see subject, faculty, status and lecture time."
        actions={
          !isStudent && (
            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
              <Select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  const first = scope.students.filter((s) => s.classId === e.target.value).sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }))[0];
                  setStudentId(first?.id || '');
                }}
                aria-label="Class"
                className="sm:w-60"
              >
                {scope.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabel(c)}
                  </option>
                ))}
              </Select>
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} aria-label="Student" className="sm:w-60">
                {roster.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rollNo} · {s.name}
                  </option>
                ))}
              </Select>
            </div>
          )
        }
      />

      {!student ? (
        <div className="card">
          <EmptyState icon={CalendarDays} title="Select a student" message="Choose a class and student to view their attendance calendar." />
        </div>
      ) : (
        <>
          <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              <Avatar name={student.name} size="lg" />
              <div>
                <p className="font-bold text-ink">{student.name}</p>
                <p className="text-xs text-ink-3">
                  {student.rollNo} · {student.course} Sem {student.semester} {student.division}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_KEYS.map((k) => (
                <span key={k} className={`chip ${STATUS[k].bg} ${STATUS[k].text} px-2.5 py-1`}>
                  {STATUS[k].emoji} {STATUS[k].label} <b>{sum[k]}</b>
                </span>
              ))}
              <span className="chip bg-brand-soft px-2.5 py-1 text-brand-600 dark:text-blue-300">Overall {fmtPct(sum.pct)}</span>
              <StandingBadge standing={standing(sum.pct, settings.threshold)} />
            </div>
          </div>
          <Card title="Monthly view" icon={CalendarDays}>
            {entries.length === 0 ? <EmptyState title="No attendance records found." /> : <AttendanceCalendar key={student.id} entries={entries} workingDays={settings.workingDays} />}
          </Card>
        </>
      )}
    </div>
  );
}
