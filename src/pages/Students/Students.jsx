import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Search, Eye, PencilLine, Trash2, Download, GraduationCap, FilterX, SearchX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/DataTable/DataTable';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { Input, Select } from '../../components/ui/Field';
import { StandingBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import StudentForm from './StudentForm';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useScope } from '../../hooks/useScope';
import { useLoading } from '../../hooks/useLoading';
import { standing } from '../../utils/attendance';
import { fmtPct } from '../../utils/format';
import { toCSV, downloadCSV } from '../../utils/csv';
import { SEMESTERS, DIVISIONS } from '../../data/catalog';

export default function Students() {
  const { role } = useAuth();
  const { studentSummary, settings, students$, departments } = useData();
  const scope = useScope();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useLoading(350);
  const isAdmin = role === 'admin';

  const [q, setQ] = useState('');
  const [params] = useSearchParams();
  const [course, setCourse] = useState(params.get('course') || '');
  const [sem, setSem] = useState(params.get('sem') || '');
  const [div, setDiv] = useState(params.get('div') || '');
  const [stand, setStand] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return scope.students
      .map((s) => {
        const sum = studentSummary(s.id);
        return { ...s, sum, standing: standing(sum.pct, settings.threshold) };
      })
      .filter(
        (s) =>
          (!term || [s.name, s.id, s.rollNo, s.email].some((v) => v.toLowerCase().includes(term))) &&
          (!course || s.course === course) &&
          (!sem || s.semester === Number(sem)) &&
          (!div || s.division === div) &&
          (!stand || s.standing === stand),
      );
  }, [scope.students, studentSummary, settings.threshold, q, course, sem, div, stand]);

  const counts = useMemo(() => {
    const c = { good: 0, warning: 0, low: 0, none: 0 };
    scope.students.forEach((s) => c[standing(studentSummary(s.id).pct, settings.threshold)]++);
    return c;
  }, [scope.students, studentSummary, settings.threshold]);

  const filtered = q || course || sem || div || stand;
  const clear = () => {
    setQ('');
    setCourse('');
    setSem('');
    setDiv('');
    setStand('');
  };

  const exportCSV = () => {
    const csv = toCSV(rows, [
      { label: 'Student ID', key: 'id' },
      { label: 'Name', key: 'name' },
      { label: 'Roll No', key: 'rollNo' },
      { label: 'Course', key: 'course' },
      { label: 'Semester', key: 'semester' },
      { label: 'Division', key: 'division' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Attended', value: (r) => r.sum.attended },
      { label: 'Total', value: (r) => r.sum.total },
      { label: 'Attendance %', value: (r) => (r.sum.pct == null ? '' : r.sum.pct.toFixed(2)) },
      { label: 'Status', value: (r) => r.standing },
    ]);
    downloadCSV(`students-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success('Export ready', `${rows.length} students exported to CSV.`);
  };

  const columns = [
    { key: 'id', header: 'Student ID', sort: (r) => r.id, render: (r) => <span className="font-mono text-xs font-semibold text-ink-2">{r.id}</span> },
    {
      key: 'name',
      header: 'Student',
      sort: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[11px] text-ink-3">{r.gender}</p>
          </div>
        </div>
      ),
    },
    { key: 'course', header: 'Course', sort: (r) => r.course, render: (r) => <span className="font-medium">{r.course}</span> },
    { key: 'class', header: 'Class', render: (r) => <span className="text-ink-2">Div {r.division}</span> },
    { key: 'semester', header: 'Sem', sort: (r) => r.semester, render: (r) => <span className="text-ink-2">{r.semester}</span> },
    { key: 'rollNo', header: 'Roll No', sort: (r) => r.rollNo, render: (r) => <span className="font-mono text-xs">{r.rollNo}</span> },
    { key: 'email', header: 'Email', render: (r) => <span className="text-xs text-ink-2">{r.email}</span> },
    {
      key: 'pct',
      header: 'Attendance',
      sort: (r) => r.sum.pct ?? -1,
      render: (r) => (
        <div className="flex w-32 items-center gap-2">
          <ProgressBar value={r.sum.pct} threshold={settings.threshold} className="flex-1" />
          <span className={`w-12 text-right text-xs font-bold tabular-nums ${r.standing === 'low' ? 'text-danger' : 'text-ink'}`}>{fmtPct(r.sum.pct)}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sort: (r) => r.sum.pct ?? -1, render: (r) => <StandingBadge standing={r.standing} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon h-8 w-8 hover:text-brand" title="View profile" aria-label={`View ${r.name}`} onClick={() => navigate(`/students/${r.id}`)}>
            <Eye className="h-4 w-4" />
          </button>
          {isAdmin && (
            <>
              <button
                className="btn-icon h-8 w-8 hover:text-brand"
                title="Edit"
                aria-label={`Edit ${r.name}`}
                onClick={() => {
                  setEditing(r);
                  setFormOpen(true);
                }}
              >
                <PencilLine className="h-4 w-4" />
              </button>
              <button className="btn-icon h-8 w-8 hover:bg-danger-soft hover:text-danger" title="Delete" aria-label={`Delete ${r.name}`} onClick={() => setDeleting(r)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const chips = [
    { k: '', label: 'All students', n: scope.students.length },
    { k: 'good', label: 'Good', n: counts.good },
    { k: 'warning', label: 'Warning', n: counts.warning },
    { k: 'low', label: 'Low attendance', n: counts.low },
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        description={isAdmin ? 'Manage student records and monitor attendance standing.' : 'Students enrolled in the classes you teach.'}
        actions={
          <>
            <button className="btn btn-secondary" onClick={exportCSV} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" /> Add Student
              </button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.k}
            onClick={() => setStand(c.k)}
            className={`chip border px-3 py-1.5 transition-colors ${
              stand === c.k
                ? c.k === 'low'
                  ? 'border-danger/30 bg-danger-soft text-danger'
                  : 'border-brand/30 bg-brand-soft text-brand-600 dark:text-blue-300'
                : 'border-line bg-surface text-ink-2 hover:border-line-strong'
            }`}
          >
            {c.label}
            <span className="rounded bg-surface/70 px-1.5 text-[11px] font-bold">{c.n}</span>
          </button>
        ))}
      </div>

      <div className="card mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_150px_150px_auto]">
        <Input icon={Search} placeholder="Search by name, ID, roll number or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course">
          <option value="">All courses</option>
          {departments.map((d) => (
            <option key={d.course}>{d.course}</option>
          ))}
        </Select>
        <Select value={sem} onChange={(e) => setSem(e.target.value)} aria-label="Semester">
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </Select>
        <Select value={div} onChange={(e) => setDiv(e.target.value)} aria-label="Division">
          <option value="">All divisions</option>
          {DIVISIONS.map((d) => (
            <option key={d} value={d}>
              Division {d}
            </option>
          ))}
        </Select>
        <button className="btn btn-ghost" onClick={clear} disabled={!filtered}>
          <FilterX className="h-4 w-4" /> Clear
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          pageSize={12}
          minWidth={1120}
          onRowClick={(r) => navigate(`/students/${r.id}`)}
          initialSort={{ key: 'name', dir: 'asc' }}
          empty={
            filtered
              ? { icon: SearchX, title: 'No students match your filters', message: 'Try a different search term or clear the filters.', action: <button className="btn btn-outline" onClick={clear}>Clear filters</button> }
              : { icon: GraduationCap, title: 'No students yet', message: 'Add your first student to start tracking attendance.' }
          }
        />
      )}

      <StudentForm
        open={formOpen}
        student={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(rec, wasEdit) => toast.success(wasEdit ? 'Student updated' : 'Student added', `${rec.name} (${rec.id}) ${wasEdit ? 'has been updated' : 'was added successfully'}.`)}
      />

      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        title="Delete student?"
        message={deleting ? `${deleting.name} (${deleting.id}) will be removed from the system. Their past attendance will no longer count towards reports.` : ''}
        confirmLabel="Delete student"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          students$.remove(deleting.id);
          toast.success('Student deleted', `${deleting.name} has been removed.`);
          setDeleting(null);
        }}
      />
    </div>
  );
}
