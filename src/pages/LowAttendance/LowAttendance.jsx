import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TriangleAlert, Search, Download, Send, Eye, Settings, ShieldAlert, Target, UsersRound, CircleCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/DataTable/DataTable';
import StatCard from '../../components/StatCard/StatCard';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { Input, Select } from '../../components/ui/Field';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLowAttendance, useLowStudents } from '../../hooks/useLowAttendance';
import { useLoading } from '../../hooks/useLoading';
import { fmtPct } from '../../utils/format';
import { toCSV, downloadCSV } from '../../utils/csv';

export default function LowAttendance() {
  const { role, user } = useAuth();
  const { settings, departments, notify } = useData();
  const rows = useLowAttendance();
  const lowStudents = useLowStudents();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useLoading(400);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [severity, setSeverity] = useState('');
  const [notified, setNotified] = useState(() => new Set());
  const t = settings.threshold;

  const subjects = useMemo(() => [...new Map(rows.map((r) => [r.subject?.id, r.subject])).values()].filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)), [rows]);
  const visible = rows.filter(
    (r) =>
      (!q || [r.student.name, r.student.rollNo, r.student.id].some((v) => v.toLowerCase().includes(q.toLowerCase()))) &&
      (!course || r.student.course === course) &&
      (!subject || r.subject?.id === subject) &&
      (!severity || r.severity === severity),
  );
  const critical = rows.filter((r) => r.severity === 'critical').length;
  const avgNeeded = rows.length ? Math.round(rows.reduce((a, r) => a + r.needed, 0) / rows.length) : 0;

  const sendWarning = (r) => {
    notify({
      type: 'alert',
      title: `Low attendance warning: ${r.subject?.name}`,
      message: `${r.student.name}, your attendance in ${r.subject?.name} is ${fmtPct(r.pct)}. Attend the next ${r.needed} lectures to reach ${t}%.`,
      audience: r.student.email === 'student@attendease.com' ? ['student'] : ['admin'],
    });
    setNotified((s) => new Set(s).add(r.id));
    toast.success('Warning sent', `${r.student.name} was notified about ${r.subject?.name}.`);
  };

  const exportCSV = () => {
    downloadCSV(
      'low-attendance.csv',
      toCSV(visible, [
        { label: 'Student ID', value: (r) => r.student.id },
        { label: 'Student', value: (r) => r.student.name },
        { label: 'Roll No', value: (r) => r.student.rollNo },
        { label: 'Course', value: (r) => `${r.student.course} Sem ${r.student.semester} ${r.student.division}` },
        { label: 'Subject', value: (r) => r.subject?.name },
        { label: 'Attended', key: 'attended' },
        { label: 'Total', key: 'total' },
        { label: 'Attendance %', value: (r) => r.pct.toFixed(2) },
        { label: `Classes needed to reach ${t}%`, key: 'needed' },
        { label: 'Severity', key: 'severity' },
      ]),
    );
    toast.success('Export ready', `${visible.length} alerts exported.`);
  };

  const columns = [
    {
      key: 'student',
      header: 'Student',
      sort: (r) => r.student.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.student.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.student.name}</p>
            <p className="text-[11px] text-ink-3">
              {r.student.rollNo} · {r.student.id}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'course', header: 'Course', sort: (r) => r.student.course, render: (r) => <span className="text-ink-2">{r.student.course} · Sem {r.student.semester} {r.student.division}</span> },
    {
      key: 'subject',
      header: 'Subject',
      sort: (r) => r.subject?.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.subject?.name}</p>
          <p className="font-mono text-[11px] text-ink-3">{r.subject?.code}</p>
        </div>
      ),
    },
    { key: 'att', header: 'Attended', align: 'right', render: (r) => <span className="tabular-nums">{r.attended}/{r.total}</span> },
    {
      key: 'pct',
      header: 'Attendance %',
      sort: (r) => r.pct,
      render: (r) => (
        <div className="flex w-36 items-center gap-2">
          <ProgressBar value={r.pct} threshold={t} className="flex-1" />
          <span className="w-12 text-right text-xs font-bold text-danger tabular-nums">{fmtPct(r.pct, 0)}</span>
        </div>
      ),
    },
    {
      key: 'needed',
      header: `To reach ${t}%`,
      sort: (r) => r.needed,
      render: (r) => (
        <span className="text-sm">
          Needs <b className="text-ink">{r.needed}</b> more class{r.needed === 1 ? '' : 'es'}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Status',
      sort: (r) => r.pct,
      render: (r) =>
        r.severity === 'critical' ? (
          <span className="chip bg-danger text-white">
            <ShieldAlert className="h-3 w-3" /> Critical
          </span>
        ) : (
          <span className="chip bg-danger-soft text-danger">
            <TriangleAlert className="h-3 w-3" /> Low Attendance
          </span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {notified.has(r.id) ? (
            <span className="chip bg-present-soft text-present">
              <CircleCheck className="h-3 w-3" /> Notified
            </span>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => sendWarning(r)}>
              <Send className="h-3.5 w-3.5" /> Notify
            </button>
          )}
          <button className="btn-icon h-8 w-8 hover:text-brand" aria-label="View student" onClick={() => navigate(`/students/${r.student.id}`)}>
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Low Attendance Alerts"
        description={`Students below the minimum attendance of ${t}% in one or more subjects.`}
        actions={
          <>
            {role === 'admin' && (
              <Link to="/settings?tab=attendance" className="btn btn-secondary">
                <Settings className="h-4 w-4" /> Threshold: {t}%
              </Link>
            )}
            <button
              className="btn btn-danger"
              disabled={!visible.length}
              onClick={() => {
                visible.forEach((r) => !notified.has(r.id) && setNotified((s) => new Set(s).add(r.id)));
                notify({ type: 'alert', title: 'Bulk attendance warnings sent', message: `${user.name} notified ${visible.length} low-attendance cases.`, audience: ['admin', 'faculty'] });
                toast.success('Warnings sent', `${visible.length} students were notified.`);
              }}
            >
              <Send className="h-4 w-4" /> Notify all
            </button>
            <button className="btn btn-secondary" onClick={exportCSV} disabled={!visible.length}>
              <Download className="h-4 w-4" /> Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} tone="danger" label="Students below threshold" value={lowStudents.length} trend={{ text: 'Overall %' }} hint={`Overall attendance under ${t}%`} />
        <StatCard icon={TriangleAlert} tone="danger" label="Subject-level alerts" value={rows.length} trend={{ text: 'Per subject' }} hint={`${new Set(rows.map((r) => r.student.id)).size} students affected`} />
        <StatCard icon={ShieldAlert} tone="danger" label="Critical cases" value={critical} trend={{ text: `< ${t - 15}%` }} hint="Needs immediate intervention" />
        <StatCard icon={Target} label="Avg. classes needed" value={avgNeeded} trend={{ text: `to ${t}%` }} hint="Consecutive lectures to recover" />
      </div>

      <div className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_220px_170px]">
        <Input icon={Search} placeholder="Search student, roll number or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course">
          <option value="">All courses</option>
          {departments.map((d) => (
            <option key={d.id}>{d.course}</option>
          ))}
        </Select>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.course} {s.semester})
            </option>
          ))}
        </Select>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity">
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Low attendance</option>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          pageSize={12}
          minWidth={1150}
          empty={{ icon: CircleCheck, title: rows.length ? 'No alerts match your filters' : 'No low attendance alerts', message: rows.length ? 'Try clearing a filter.' : `Every student is at or above ${t}% in every subject.` }}
        />
      )}
    </div>
  );
}
