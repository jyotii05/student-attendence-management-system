import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PencilLine, Mail, Phone, Hash, IdCard, BookOpen, Building2, Layers, School, CalendarDays, History, Download, User, MapPin, Cake, ListChecks, TriangleAlert, PencilLine as Edited } from 'lucide-react';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import ProgressRing from '../../components/ui/ProgressRing';
import ProgressBar from '../../components/ui/ProgressBar';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import { StandingBadge, StatusBadge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import AttendanceCalendar from '../../components/AttendanceCalendar/AttendanceCalendar';
import StudentForm from '../Students/StudentForm';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { summarize, standing, classesNeeded, canSkip, STATUS, STATUS_KEYS, slotLabel, emptyCounts } from '../../utils/attendance';
import { formatDate, formatDateTime } from '../../utils/date';
import { fmtPct } from '../../utils/format';
import { studentEntries, subjectBreakdown } from '../../utils/selectors';
import { toCSV, downloadCSV } from '../../utils/csv';

function Info({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-hover">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-ink-3">{label}</p>
        <p className={`truncate text-sm font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

export default function StudentProfileView({ student, self = false, canEdit = false }) {
  const { stats, settings, subjects, sessions, subjectsById, facultyById, classesById } = useData();
  const toast = useToast();
  const [tab, setTab] = useState('calendar');
  const [editOpen, setEditOpen] = useState(false);
  const [subFilter, setSubFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [limit, setLimit] = useState(20);
  const t = settings.threshold;

  const sum = summarize(stats.byStudent[student.id] || emptyCounts(), settings);
  const st = standing(sum.pct, t);
  const bySubject = useMemo(() => subjectBreakdown(student, stats, subjects, settings), [student, stats, subjects, settings]);
  const entries = useMemo(() => studentEntries(student, sessions, subjectsById, facultyById), [student, sessions, subjectsById, facultyById]);
  const cls = classesById[student.classId];
  const need = classesNeeded(sum.attended, sum.total, t);

  const timeline = entries.filter((e) => (!subFilter || e.subjectId === subFilter) && (!statusFilter || e.status === statusFilter));
  const grouped = useMemo(() => {
    const g = [];
    for (const e of timeline.slice(0, limit)) {
      const last = g[g.length - 1];
      if (last && last.date === e.date) last.items.push(e);
      else g.push({ date: e.date, items: [e] });
    }
    return g;
  }, [timeline, limit]);

  const exportHistory = () => {
    downloadCSV(
      `${student.id}-attendance.csv`,
      toCSV(entries, [
        { label: 'Date', key: 'date' },
        { label: 'Lecture', key: 'slot' },
        { label: 'Time', value: (e) => slotLabel(e.slot) },
        { label: 'Subject', key: 'subject' },
        { label: 'Faculty', key: 'faculty' },
        { label: 'Status', value: (e) => STATUS[e.status].label },
      ]),
    );
    toast.success('Attendance history exported', `${entries.length} records downloaded.`);
  };

  return (
    <div className="space-y-6">
      {!self && (
        <Link to="/students" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>
      )}

      {/* Hero */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 border-b border-line bg-brand-softer">
          <div className="bg-grid absolute inset-0 opacity-70" />
        </div>
        <div className="relative flex flex-col gap-5 px-5 pt-10 pb-5 sm:flex-row sm:items-end sm:px-6">
          <Avatar name={student.name} size="xl" className="ring-4" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-ink">{student.name}</h1>
              <StandingBadge standing={st} />
            </div>
            <p className="mt-1 text-sm text-ink-2">
              <span className="font-mono">{student.id}</span> · Roll No {student.rollNo} · {student.course} · Semester {student.semester} · Division {student.division}
            </p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={exportHistory} disabled={!entries.length}>
              <Download className="h-4 w-4" /> Export history
            </button>
            {canEdit && (
              <button className="btn btn-primary" onClick={() => setEditOpen(true)}>
                <PencilLine className="h-4 w-4" /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {st === 'low' && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <p className="text-ink-2">
            <b className="text-danger">Low Attendance:</b> overall attendance is {fmtPct(sum.pct)}, below the required {t}%. {self ? 'You need' : 'The student needs'} to attend the next <b className="text-ink">{need}</b> lectures without absence to reach {t}%.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-5">
        <Card title="Personal Information" className="xl:col-span-3" bodyClassName="grid gap-1 p-3 sm:grid-cols-2">
          <Info icon={User} label="Full name" value={student.name} />
          <Info icon={IdCard} label="Student ID" value={student.id} mono />
          <Info icon={Hash} label="Roll number" value={student.rollNo} mono />
          <Info icon={Mail} label="Email" value={student.email} />
          <Info icon={Phone} label="Phone" value={student.phone ? `+91 ${student.phone.slice(0, 5)} ${student.phone.slice(5)}` : ''} />
          <Info icon={Cake} label="Date of birth" value={formatDate(student.dob)} />
          <Info icon={BookOpen} label="Course" value={student.course} />
          <Info icon={Building2} label="Department" value={student.department} />
          <Info icon={Layers} label="Semester" value={`Semester ${student.semester}`} />
          <Info icon={School} label="Division" value={`Division ${student.division}${cls ? ` · Room ${cls.room}` : ''}`} />
          <Info icon={CalendarDays} label="Admission year" value={student.admissionYear} />
          <Info icon={MapPin} label="Address" value={student.address} />
        </Card>

        <Card title="Attendance Summary" className="xl:col-span-2">
          <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
            <ProgressRing value={sum.pct} threshold={t} size={156} stroke={13} label="Overall" />
            <div className="w-full flex-1 space-y-2">
              <p className="text-sm font-bold text-ink">
                Overall Attendance: <span className={st === 'low' ? 'text-danger' : 'text-brand'}>{fmtPct(sum.pct)}</span>
              </p>
              <p className="text-xs text-ink-3">
                {sum.attended} attended of {sum.total} lectures
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {STATUS_KEYS.map((k) => (
                  <div key={k} className={`rounded-lg px-3 py-2 ${STATUS[k].bg}`}>
                    <p className={`text-[11px] font-semibold ${STATUS[k].text}`}>{STATUS[k].label}</p>
                    <p className="text-lg font-extrabold text-ink tabular-nums">{sum[k]}</p>
                  </div>
                ))}
              </div>
              <p className="pt-1 text-[11px] text-ink-3">
                {sum.total === 0 ? 'No lectures recorded yet.' : need > 0 ? `Needs ${need} consecutive lectures to reach ${t}%.` : `Can miss ${canSkip(sum.attended, sum.total, t)} lectures and stay above ${t}%.`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Subject Attendance" subtitle={`Minimum required: ${t}% per subject`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table-base min-w-[760px]">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Faculty</th>
                <th className="text-right">Attended</th>
                <th className="text-right">Total</th>
                <th className="w-52">Percentage</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {bySubject.map((s) => {
                const sst = standing(s.pct, t);
                const n = classesNeeded(s.attended, s.total, t);
                return (
                  <tr key={s.subject.id}>
                    <td>
                      <p className="font-semibold text-ink">{s.subject.name}</p>
                      <p className="font-mono text-[11px] text-ink-3">{s.subject.code}</p>
                    </td>
                    <td className="text-ink-2">{facultyById[s.subject.facultyId]?.name || 'Unassigned'}</td>
                    <td className="text-right font-semibold tabular-nums">{s.attended}</td>
                    <td className="text-right text-ink-2 tabular-nums">{s.total}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.pct} threshold={t} className="flex-1" />
                        <span className={`w-14 text-right text-xs font-bold tabular-nums ${sst === 'low' ? 'text-danger' : 'text-ink'}`}>{fmtPct(s.pct)}</span>
                      </div>
                    </td>
                    <td>
                      <StandingBadge standing={sst} />
                    </td>
                    <td className="text-xs text-ink-3">{s.total === 0 ? '—' : n > 0 ? <span className="font-semibold text-danger">Needs {n} more</span> : `Can miss ${canSkip(s.attended, s.total, t)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Attendance History"
        subtitle={`${entries.length} lectures recorded`}
        icon={History}
        actions={
          <Segmented
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'calendar', label: 'Calendar', icon: CalendarDays },
              { value: 'timeline', label: 'Timeline', icon: ListChecks },
            ]}
          />
        }
      >
        {entries.length === 0 ? (
          <EmptyState icon={History} title="No attendance records found." message="Attendance will appear here once lectures are marked." />
        ) : tab === 'calendar' ? (
          <AttendanceCalendar entries={entries} workingDays={settings.workingDays} />
        ) : (
          <div>
            <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:w-[480px]">
              <Select value={subFilter} onChange={(e) => setSubFilter(e.target.value)} aria-label="Filter subject">
                <option value="">All subjects</option>
                {bySubject.map((s) => (
                  <option key={s.subject.id} value={s.subject.id}>
                    {s.subject.name}
                  </option>
                ))}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status">
                <option value="">All statuses</option>
                {STATUS_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {STATUS[k].label}
                  </option>
                ))}
              </Select>
            </div>
            {grouped.length === 0 ? (
              <EmptyState compact title="No attendance records found." message="No lectures match the selected filters." />
            ) : (
              <ol className="relative space-y-5 border-l border-line pl-6">
                {grouped.map((g) => (
                  <li key={g.date}>
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand" />
                    <p className="text-xs font-bold text-ink">{formatDate(g.date, { weekday: 'short' })}</p>
                    <div className="mt-2 space-y-1.5">
                      {g.items.map((e) => (
                        <div key={e.sessionId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">{e.subject}</p>
                            <p className="text-[11px] text-ink-3">
                              Lecture {e.slot} · {slotLabel(e.slot)} · {e.faculty}
                            </p>
                            {e.edit && (
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-brand">
                                <Edited className="h-3 w-3" /> Changed from {STATUS[e.edit.from]?.label} by {e.edit.by} · {formatDateTime(e.edit.at)}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={e.status} />
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {timeline.length > limit && (
              <div className="mt-5 text-center">
                <button className="btn btn-outline" onClick={() => setLimit((l) => l + 30)}>
                  Show more ({timeline.length - limit} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {canEdit && <StudentForm open={editOpen} student={student} onClose={() => setEditOpen(false)} onSaved={(rec) => toast.success('Student updated', `${rec.name}'s details were saved.`)} />}
    </div>
  );
}
