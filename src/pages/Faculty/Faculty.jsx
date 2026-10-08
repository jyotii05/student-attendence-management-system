import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Eye, PencilLine, Trash2, UsersRound, SearchX, Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/DataTable/DataTable';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';
import { Input, Select } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import FacultyForm from './FacultyForm';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../hooks/useLoading';
import { toCSV, downloadCSV } from '../../utils/csv';

export const FAC_STATUS = {
  Active: 'bg-present-soft text-present',
  'On Leave': 'bg-late-soft text-late-ink dark:text-amber-400',
  Inactive: 'bg-muted text-ink-3',
};

export default function Faculty() {
  const { role } = useAuth();
  const { faculty, subjects, classes, departments, faculty$ } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useLoading(350);
  const isAdmin = role === 'admin';
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return faculty
      .map((f) => {
        const subs = subjects.filter((s) => s.facultyId === f.id);
        const cls = classes.filter((c) => subs.some((s) => s.course === c.course && s.semester === c.semester));
        return { ...f, subs, cls };
      })
      .filter((f) => (!term || [f.name, f.id, f.email, f.department].some((v) => v.toLowerCase().includes(term))) && (!dept || f.department === dept));
  }, [faculty, subjects, classes, q, dept]);

  const columns = [
    { key: 'id', header: 'Faculty ID', sort: (r) => r.id, render: (r) => <span className="font-mono text-xs font-semibold text-ink-2">{r.id}</span> },
    {
      key: 'name',
      header: 'Faculty',
      sort: (r) => r.name.replace(/^(Dr|Prof)\.\s*/, ''),
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[11px] text-ink-3">{r.designation}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', header: 'Department', sort: (r) => r.department, render: (r) => <span className="text-ink-2">{r.department}</span> },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (r) =>
        r.subs.length ? (
          <div className="flex max-w-[260px] flex-wrap gap-1">
            {r.subs.slice(0, 2).map((s) => (
              <Badge key={s.id} className="bg-brand-softer text-ink-2">
                {s.name}
              </Badge>
            ))}
            {r.subs.length > 2 && <Badge className="bg-muted text-ink-3">+{r.subs.length - 2}</Badge>}
          </div>
        ) : (
          <span className="text-xs text-ink-3">Not assigned</span>
        ),
    },
    { key: 'email', header: 'Email', render: (r) => <span className="text-xs text-ink-2">{r.email}</span> },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-xs text-ink-2 tabular-nums">{r.phone}</span> },
    { key: 'classes', header: 'Classes', sort: (r) => r.cls.length, align: 'center', render: (r) => <span className="font-semibold">{r.cls.length}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge className={FAC_STATUS[r.status] || FAC_STATUS.Active} dot>{r.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon h-8 w-8 hover:text-brand" title="View profile" aria-label={`View ${r.name}`} onClick={() => navigate(`/faculty/${r.id}`)}>
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

  const exportCSV = () => {
    downloadCSV(
      'faculty.csv',
      toCSV(rows, [
        { label: 'Faculty ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Designation', key: 'designation' },
        { label: 'Department', key: 'department' },
        { label: 'Subjects', value: (r) => r.subs.map((s) => s.name).join('; ') },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Classes', value: (r) => r.cls.length },
        { label: 'Status', key: 'status' },
      ]),
    );
    toast.success('Export ready', `${rows.length} faculty members exported.`);
  };

  return (
    <div>
      <PageHeader
        title="Faculty"
        description="Teaching staff, their subjects and class assignments."
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
                <UserPlus className="h-4 w-4" /> Add Faculty
              </button>
            )}
          </>
        }
      />

      <div className="card mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_240px]">
        <Input icon={Search} placeholder="Search by name, ID, email or department" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id}>{d.name}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          minWidth={1100}
          onRowClick={(r) => navigate(`/faculty/${r.id}`)}
          initialSort={{ key: 'department', dir: 'asc' }}
          empty={q || dept ? { icon: SearchX, title: 'No faculty match your search', message: 'Try a different name or department.' } : { icon: UsersRound, title: 'No faculty members yet', message: 'Add faculty to assign subjects and classes.' }}
        />
      )}

      <FacultyForm open={formOpen} member={editing} onClose={() => setFormOpen(false)} onSaved={(rec, wasEdit) => toast.success(wasEdit ? 'Faculty updated' : 'Faculty added', `${rec.name} ${wasEdit ? 'was updated' : 'has been added'}.`)} />
      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        title="Delete faculty member?"
        message={deleting ? `${deleting.name} will be removed. Their ${deleting.subs.length} subject(s) will become unassigned.` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          faculty$.remove(deleting.id);
          toast.success('Faculty deleted', `${deleting.name} has been removed.`);
          setDeleting(null);
        }}
      />
    </div>
  );
}
