import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Search, Download, FilterX, PencilLine, SearchX, ClipboardCheck, History } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/DataTable/DataTable';
import Avatar from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { Field, Input, Select } from '../../components/ui/Field';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EditAttendanceModal from './EditAttendanceModal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useScope } from '../../hooks/useScope';
import { useLoading } from '../../hooks/useLoading';
import { STATUS, STATUS_KEYS, slotLabel, summarize, emptyCounts } from '../../utils/attendance';
import { todayISO, addDays, formatDate, formatDateTime } from '../../utils/date';
import { fmtPct, fmtNumber } from '../../utils/format';
import { toCSV, downloadCSV } from '../../utils/csv';
import { SEMESTERS, DIVISIONS } from '../../data/catalog';

const DEFAULT = { from: '', to: '', department: '', course: '', semester: '', division: '', subjectId: '', facultyId: '', status: '' };

export default function AttendanceRecords() {
  const { studentsById, subjectsById, facultyById, classesById, departments, faculty, settings } = useData();
  const scope = useScope();
  const toast = useToast();
  const loading = useLoading(400);
  const [f, setF] = useState({ ...DEFAULT, from: addDays(todayISO(), -6), to: todayISO() });
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v, ...(k === 'department' ? { course: departments.find((d) => d.name === v)?.course || '' } : {}) }));

  // Newest lectures first, flattened to one row per student record
  const allRows = useMemo(() => {
    const ordered = [...scope.sessions].sort((a, b) => (a.date === b.date ? b.slot - a.slot : a.date < b.date ? 1 : -1));
    const out = [];
    for (const s of ordered) {
      for (const sid in s.records) {
        if (!studentsById[sid]) continue;
        out.push({ key: `${s.id}|${sid}`, session: s, studentId: sid, status: s.records[sid], date: s.date, slot: s.slot });
      }
    }
    return out;
  }, [scope.sessions, studentsById]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allRows.filter((r) => {
      const s = r.session;
      if (f.from && r.date < f.from) return false;
      if (f.to && r.date > f.to) return false;
      if (f.status && r.status !== f.status) return false;
      if (f.subjectId && s.subjectId !== f.subjectId) return false;
      if (f.facultyId && s.facultyId !== f.facultyId) return false;
      const c = classesById[s.classId];
      if (f.department && c?.department !== f.department) return false;
      if (f.course && c?.course !== f.course) return false;
      if (f.semester && c?.semester !== Number(f.semester)) return false;
      if (f.division && c?.division !== f.division) return false;
      if (term) {
        const st = studentsById[r.studentId];
        if (![st.name, st.rollNo, st.id].some((v) => v.toLowerCase().includes(term))) return false;
      }
      return true;
    });
  }, [allRows, f, q, classesById, studentsById]);

  const sum = useMemo(() => {
    const c = emptyCounts();
    rows.forEach((r) => c[r.status]++);
    return summarize(c, settings);
  }, [rows, settings]);

  const filtered = q || Object.keys(DEFAULT).some((k) => f[k] !== DEFAULT[k]);
  const subjectOptions = scope.subjects.filter((s) => (!f.course || s.course === f.course) && (!f.semester || s.semester === Number(f.semester)));
  const facultyOptions = scope.isAll ? faculty.filter((x) => !f.department || x.department === f.department) : faculty.filter((x) => scope.subjects.some((s) => s.facultyId === x.id));

  const exportCSV = () => {
    downloadCSV(
      `attendance-records-${todayISO()}.csv`,
      toCSV(rows, [
        { label: 'Date', key: 'date' },
        { label: 'Lecture', key: 'slot' },
        { label: 'Time', value: (r) => slotLabel(r.slot) },
        { label: 'Student ID', key: 'studentId' },
        { label: 'Student', value: (r) => studentsById[r.studentId]?.name },
        { label: 'Roll No', value: (r) => studentsById[r.studentId]?.rollNo },
        { label: 'Class', value: (r) => { const c = classesById[r.session.classId]; return c ? `${c.course} Sem ${c.semester} ${c.division}` : ''; } },
        { label: 'Subject', value: (r) => subjectsById[r.session.subjectId]?.name },
        { label: 'Faculty', value: (r) => facultyById[r.session.facultyId]?.name },
        { label: 'Status', value: (r) => STATUS[r.status].label },
        { label: 'Last updated by', value: (r) => r.session.edits?.[r.studentId]?.by || '' },
      ]),
    );
    toast.success('Export ready', `${fmtNumber(rows.length)} records exported.`);
  };

  const columns = [
    { key: 'date', header: 'Date', sort: (r) => r.date + r.slot, render: (r) => <span className="whitespace-nowrap text-ink-2">{formatDate(r.date)}</span> },
    {
      key: 'student',
      header: 'Student',
      sort: (r) => studentsById[r.studentId]?.name,
      render: (r) => {
        const st = studentsById[r.studentId];
        return (
          <Link to={`/students/${st.id}`} className="group flex items-center gap-2.5">
            <Avatar name={st.name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-ink group-hover:text-brand">{st.name}</span>
              <span className="block text-[11px] text-ink-3">
                {st.rollNo} · {st.id}
              </span>
            </span>
          </Link>
        );
      },
    },
    {
      key: 'subject',
      header: 'Subject',
      sort: (r) => subjectsById[r.session.subjectId]?.name,
      render: (r) => {
        const c = classesById[r.session.classId];
        return (
          <div>
            <p className="font-medium text-ink">{subjectsById[r.session.subjectId]?.name}</p>
            <p className="text-[11px] text-ink-3">
              {c?.course} · Sem {c?.semester} {c?.division}
            </p>
          </div>
        );
      },
    },
    { key: 'faculty', header: 'Faculty', render: (r) => <span className="text-ink-2">{facultyById[r.session.facultyId]?.name || r.session.markedBy}</span> },
    {
      key: 'status',
      header: 'Status',
      sort: (r) => r.status,
      render: (r) => {
        const e = r.session.edits?.[r.studentId];
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={r.status} />
            {e && (
              <span className="flex items-center gap-1 text-[10.5px] text-brand" title={`Updated by ${e.by} · ${formatDateTime(e.at)}`}>
                <History className="h-3 w-3" /> was {STATUS[e.from]?.label}
              </span>
            )}
          </div>
        );
      },
    },
    { key: 'time', header: 'Time', render: (r) => <span className="text-xs whitespace-nowrap text-ink-3">L{r.slot} · {slotLabel(r.slot)}</span> },
    {
      key: 'updated',
      header: 'Last updated',
      render: (r) => {
        const e = r.session.edits?.[r.studentId];
        return (
          <span className="text-[11px] text-ink-3">
            {e ? e.by : r.session.markedBy}
            <br />
            {formatDateTime(e ? e.at : r.session.markedAt)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <button className="btn btn-ghost btn-sm hover:text-brand" onClick={() => setEditing(r)} aria-label="Edit attendance">
          <PencilLine className="h-3.5 w-3.5" /> Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance Records"
        description="Every marked lecture, per student. Edit a record to correct mistakes — changes are tracked."
        actions={
          <>
            <button className="btn btn-secondary" onClick={exportCSV} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <Link to="/attendance/mark" className="btn btn-primary">
              <ClipboardCheck className="h-4 w-4" /> Mark Attendance
            </Link>
          </>
        }
      />

      <div className="card mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Search" className="sm:col-span-2 lg:col-span-1">
            <Input icon={Search} placeholder="Name, roll no or ID" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
          <Field label="From">
            <Input type="date" value={f.from} max={f.to || todayISO()} onChange={(e) => set('from', e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={f.to} min={f.from} max={todayISO()} onChange={(e) => set('to', e.target.value)} />
          </Field>
          <Field label="Department">
            <Select value={f.department} onChange={(e) => set('department', e.target.value)}>
              <option value="">All departments</option>
              {departments
                .filter((d) => scope.isAll || scope.subjects.some((s) => s.department === d.name))
                .map((d) => (
                  <option key={d.id}>{d.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Course">
            <Select value={f.course} onChange={(e) => set('course', e.target.value)}>
              <option value="">All courses</option>
              {departments
                .filter((d) => (!f.department || d.name === f.department) && (scope.isAll || scope.subjects.some((s) => s.course === d.course)))
                .map((d) => (
                  <option key={d.id}>{d.course}</option>
                ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Select value={f.semester} onChange={(e) => set('semester', e.target.value)}>
              <option value="">All</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Division">
            <Select value={f.division} onChange={(e) => set('division', e.target.value)}>
              <option value="">All</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  Division {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={f.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
              <option value="">All subjects</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.course} {s.semester})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Faculty">
            <Select value={f.facultyId} onChange={(e) => set('facultyId', e.target.value)}>
              <option value="">All faculty</option>
              {facultyOptions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="">All statuses</option>
              {STATUS_KEYS.map((k) => (
                <option key={k} value={k}>
                  {STATUS[k].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="chip bg-muted text-ink-2">{fmtNumber(rows.length)} records</span>
            {STATUS_KEYS.map((k) => (
              <span key={k} className={`chip ${STATUS[k].bg} ${STATUS[k].text}`}>
                {STATUS[k].label} {fmtNumber(sum[k])}
              </span>
            ))}
            <span className="chip bg-brand-soft text-brand-600 dark:text-blue-300">Attendance {fmtPct(sum.pct)}</span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            disabled={!filtered}
            onClick={() => {
              setF(DEFAULT);
              setQ('');
            }}
          >
            <FilterX className="h-3.5 w-3.5" /> Clear filters (show all dates)
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="key"
          pageSize={15}
          minWidth={1100}
          dense
          empty={
            filtered
              ? { icon: SearchX, title: 'No attendance records found.', message: 'No records match these filters. Try widening the date range.' }
              : { icon: ClipboardList, title: 'No attendance records found.', message: 'Marked lectures will appear here.', action: <Link to="/attendance/mark" className="btn btn-primary">Mark attendance</Link> }
          }
        />
      )}

      <EditAttendanceModal row={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
