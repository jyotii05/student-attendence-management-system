import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, Award, CalendarDays, BookOpen, School, ClipboardList, CalendarClock, PencilLine, UserX, GraduationCap, Briefcase } from 'lucide-react';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import TimetableGrid from '../../components/Timetable/TimetableGrid';
import FacultyForm from './FacultyForm';
import { FAC_STATUS } from './Faculty';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { summarize, slotLabel, emptyCounts } from '../../utils/attendance';
import { formatDate } from '../../utils/date';
import { fmtPct } from '../../utils/format';
import { timetableEntries } from '../../utils/selectors';

export default function FacultyProfile() {
  const { id } = useParams();
  const { role } = useAuth();
  const toast = useToast();
  const data = useData();
  const { facultyById, subjects, classes, sessions, timetable, stats, settings, classesById, subjectsById, students } = data;
  const [editOpen, setEditOpen] = useState(false);
  const f = facultyById[id];

  const info = useMemo(() => {
    if (!f) return null;
    const subs = subjects.filter((s) => s.facultyId === f.id);
    const subIds = new Set(subs.map((s) => s.id));
    const cls = classes.filter((c) => subs.some((s) => s.course === c.course && s.semester === c.semester));
    const mySessions = sessions.filter((s) => subIds.has(s.subjectId)).sort((a, b) => (a.date === b.date ? b.slot - a.slot : a.date < b.date ? 1 : -1));
    const schedule = timetableEntries(
      timetable.filter((t) => subIds.has(t.subjectId)),
      data,
    );
    const studentCount = students.filter((s) => cls.some((c) => c.id === s.classId)).length;
    return { subs, cls, mySessions, schedule, studentCount };
  }, [f, subjects, classes, sessions, timetable, data, students]);

  if (!f)
    return (
      <div className="card">
        <EmptyState icon={UserX} title="Faculty member not found" message="This profile may have been removed." action={<Link to="/faculty" className="btn btn-primary">Back to Faculty</Link>} />
      </div>
    );

  const { subs, cls, mySessions, schedule, studentCount } = info;

  return (
    <div className="space-y-6">
      <Link to={role === 'admin' ? '/faculty' : '/dashboard'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> {role === 'admin' ? 'Back to Faculty' : 'Back to Dashboard'}
      </Link>

      <div className="card relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 border-b border-line bg-brand-softer">
          <div className="bg-grid absolute inset-0 opacity-70" />
        </div>
        <div className="relative flex flex-col gap-5 px-5 pt-10 pb-5 sm:flex-row sm:items-end sm:px-6">
          <Avatar name={f.name} size="xl" className="ring-4" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-ink">{f.name}</h1>
              <Badge className={FAC_STATUS[f.status] || FAC_STATUS.Active} dot>
                {f.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-2">
              {f.designation} · {f.department} · <span className="font-mono">{f.id}</span>
            </p>
          </div>
          {role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setEditOpen(true)}>
              <PencilLine className="h-4 w-4" /> Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
          {[
            { l: 'Subjects', v: subs.length, icon: BookOpen },
            { l: 'Classes', v: cls.length, icon: School },
            { l: 'Students taught', v: studentCount, icon: GraduationCap },
            { l: 'Lectures marked', v: mySessions.length, icon: ClipboardList },
          ].map((s, i) => (
            <div key={s.l} className={`flex items-center gap-3 px-5 py-4 ${i ? 'sm:border-l' : ''} ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} border-line`}>
              <s.icon className="h-5 w-5 text-brand" />
              <div>
                <p className="text-lg font-extrabold text-ink">{s.v}</p>
                <p className="text-[11px] font-medium text-ink-3">{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Contact & Profile" bodyClassName="space-y-3 p-5">
          {[
            [Mail, 'Email', f.email],
            [Phone, 'Phone', `+91 ${f.phone}`],
            [Building2, 'Department', f.department],
            [Award, 'Qualification', f.qualification],
            [Briefcase, 'Experience', `${f.experience} years`],
            [CalendarDays, 'Joined', formatDate(f.joined)],
          ].map(([Icon, l, v]) => (
            <div key={l} className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-ink-3">{l}</p>
                <p className="truncate text-sm font-semibold text-ink">{v || '—'}</p>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Assigned Subjects" subtitle="Average attendance in each subject" className="xl:col-span-2" bodyClassName="p-4">
          {subs.length === 0 ? (
            <EmptyState compact icon={BookOpen} title="No subjects assigned" message="Assign subjects from the Edit dialog or the Subjects page." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {subs.map((s) => {
                const sum = summarize(stats.bySubject[s.id] || emptyCounts(), settings);
                return (
                  <div key={s.id} className="rounded-xl border border-line p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink">{s.name}</p>
                        <p className="text-[11px] text-ink-3">
                          {s.code} · {s.course} Sem {s.semester} · {s.weeklyLectures}/week
                        </p>
                      </div>
                      <span className={`text-sm font-extrabold tabular-nums ${sum.pct != null && sum.pct < settings.threshold ? 'text-danger' : 'text-brand'}`}>{fmtPct(sum.pct)}</span>
                    </div>
                    <ProgressBar value={sum.pct} threshold={settings.threshold} className="mt-3" />
                    <p className="mt-2 text-[11px] text-ink-3">{stats.conductedBySubject[s.id] || 0} lectures conducted</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Assigned Classes" bodyClassName="p-3">
          {cls.length === 0 ? (
            <EmptyState compact icon={School} title="No classes" />
          ) : (
            <ul className="space-y-1">
              {cls.map((c) => {
                const sum = summarize(stats.byClass[c.id] || emptyCounts(), settings);
                return (
                  <li key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-hover">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {c.course} · Sem {c.semester} · Div {c.division}
                      </p>
                      <p className="text-[11px] text-ink-3">
                        Room {c.room}
                        {c.classTeacherId === f.id ? ' · Class teacher' : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-ink-2 tabular-nums">{fmtPct(sum.pct)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Attendance Records" subtitle="Most recent lectures marked" className="xl:col-span-2" bodyClassName="p-0">
          {mySessions.length === 0 ? (
            <EmptyState compact icon={ClipboardList} title="No attendance records found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base min-w-[620px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Time</th>
                    <th className="text-right">Present</th>
                  </tr>
                </thead>
                <tbody>
                  {mySessions.slice(0, 8).map((s) => {
                    const v = Object.values(s.records);
                    const p = v.filter((x) => x === 'P').length;
                    const c = classesById[s.classId];
                    return (
                      <tr key={s.id}>
                        <td className="whitespace-nowrap text-ink-2">{formatDate(s.date)}</td>
                        <td className="font-semibold">{subjectsById[s.subjectId]?.name}</td>
                        <td className="text-ink-2">
                          {c?.course} {c?.semester}
                          {c?.division}
                        </td>
                        <td className="text-xs text-ink-3">{slotLabel(s.slot)}</td>
                        <td className="text-right">
                          <span className={`chip ${p / v.length < settings.threshold / 100 ? 'bg-danger-soft text-danger' : 'bg-present-soft text-present'}`}>
                            {p}/{v.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card title="Weekly Schedule" subtitle={`${schedule.length} lectures per week`} icon={CalendarClock}>
        {schedule.length === 0 ? <EmptyState compact icon={CalendarClock} title="No scheduled lectures" /> : <TimetableGrid entries={schedule} showClass />}
      </Card>

      {role === 'admin' && <FacultyForm open={editOpen} member={f} onClose={() => setEditOpen(false)} onSaved={(rec) => toast.success('Faculty updated', `${rec.name}'s profile was saved.`)} />}
    </div>
  );
}
