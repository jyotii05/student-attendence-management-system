import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, PencilLine, Trash2, Search, Save, SearchX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Field, Input, Select } from '../../components/ui/Field';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useScope } from '../../hooks/useScope';
import { useLoading } from '../../hooks/useLoading';
import { summarize, emptyCounts } from '../../utils/attendance';
import { fmtPct } from '../../utils/format';
import { SEMESTERS } from '../../data/catalog';

const EMPTY = { code: '', name: '', department: '', semester: '', facultyId: '', weeklyLectures: '4', credits: '3', type: 'Theory', status: 'Active' };

function SubjectForm({ open, onClose, subject }) {
  const { subjects, departments, faculty, subjects$ } = useData();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(subject ? { ...EMPTY, ...subject, semester: String(subject.semester), weeklyLectures: String(subject.weeklyLectures), credits: String(subject.credits ?? 3), facultyId: subject.facultyId || '' } : EMPTY);
      setErrors({});
    }
  }, [open, subject]);
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'department' ? { facultyId: '' } : {}) }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (ev) => {
    ev?.preventDefault();
    const e = {};
    if (!form.code.trim()) e.code = 'Subject code is required.';
    else if (subjects.some((s) => s.id !== subject?.id && s.code.toLowerCase() === form.code.trim().toLowerCase())) e.code = 'This subject code already exists.';
    if (!form.name.trim()) e.name = 'Subject name is required.';
    if (!form.department) e.department = 'Please select a department.';
    if (!form.semester) e.semester = 'Please select a semester.';
    const w = Number(form.weeklyLectures);
    if (!(w >= 1 && w <= 10)) e.weeklyLectures = 'Weekly lectures must be between 1 and 10.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const dept = departments.find((d) => d.name === form.department);
    const rec = { ...form, code: form.code.trim().toUpperCase(), name: form.name.trim(), course: dept.course, semester: Number(form.semester), weeklyLectures: w, credits: Number(form.credits) || 3, facultyId: form.facultyId || null };
    if (subject) subjects$.update(subject.id, rec);
    else subjects$.add({ ...rec, id: `SUB-${rec.code}` });
    toast.success(subject ? 'Subject updated' : 'Subject added', `${rec.code} · ${rec.name}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={BookOpen}
      title={subject ? 'Edit Subject' : 'Add Subject'}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            <Save className="h-4 w-4" /> Save
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject code" required error={errors.code}>
          <Input value={form.code} onChange={(e) => set('code', e.target.value)} className="font-mono uppercase" placeholder="IT506" error={errors.code} autoFocus />
        </Field>
        <Field label="Subject name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Machine Learning" error={errors.name} />
        </Field>
        <Field label="Department" required error={errors.department}>
          <Select value={form.department} onChange={(e) => set('department', e.target.value)} error={errors.department}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Semester" required error={errors.semester}>
          <Select value={form.semester} onChange={(e) => set('semester', e.target.value)} error={errors.semester}>
            <option value="">Select semester</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Faculty">
          <Select value={form.facultyId} onChange={(e) => set('facultyId', e.target.value)}>
            <option value="">Unassigned</option>
            {faculty
              .filter((f) => !form.department || f.department === form.department)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Weekly lectures" required error={errors.weeklyLectures}>
          <Input type="number" min={1} max={10} value={form.weeklyLectures} onChange={(e) => set('weeklyLectures', e.target.value)} error={errors.weeklyLectures} />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option>Theory</option>
            <option>Theory + Lab</option>
            <option>Practical</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option>Active</option>
            <option>Inactive</option>
          </Select>
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export default function Subjects() {
  const { role } = useAuth();
  const { facultyById, stats, settings, departments, subjects$ } = useData();
  const scope = useScope();
  const toast = useToast();
  const loading = useLoading(300);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [dept, setDept] = useState('');
  const [sem, setSem] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (params.get('q')) setQ(params.get('q'));
  }, [params]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return scope.subjects
      .map((s) => ({ ...s, sum: summarize(stats.bySubject[s.id] || emptyCounts(), settings), conducted: stats.conductedBySubject[s.id] || 0 }))
      .filter((s) => (!term || [s.name, s.code, s.course].some((v) => v.toLowerCase().includes(term))) && (!dept || s.department === dept) && (!sem || s.semester === Number(sem)));
  }, [scope.subjects, stats, settings, q, dept, sem]);

  const columns = [
    { key: 'code', header: 'Code', sort: (r) => r.code, render: (r) => <span className="font-mono text-xs font-bold text-brand">{r.code}</span> },
    {
      key: 'name',
      header: 'Subject',
      sort: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.name}</p>
          <p className="text-[11px] text-ink-3">
            {r.type} · {r.credits} credits
          </p>
        </div>
      ),
    },
    { key: 'department', header: 'Department', sort: (r) => r.department, render: (r) => <span className="text-ink-2">{r.department}</span> },
    { key: 'semester', header: 'Semester', sort: (r) => r.semester, render: (r) => <span className="text-ink-2">{r.course} · Sem {r.semester}</span> },
    { key: 'faculty', header: 'Faculty', sort: (r) => facultyById[r.facultyId]?.name || 'zz', render: (r) => (facultyById[r.facultyId] ? <span>{facultyById[r.facultyId].name}</span> : <span className="text-xs font-semibold text-danger">Unassigned</span>) },
    { key: 'weekly', header: 'Weekly', align: 'center', sort: (r) => r.weeklyLectures, render: (r) => <span className="font-semibold">{r.weeklyLectures}</span> },
    { key: 'total', header: 'Total Classes', align: 'center', sort: (r) => r.conducted, render: (r) => <span className="font-semibold tabular-nums">{r.conducted}</span> },
    {
      key: 'pct',
      header: 'Avg. Attendance',
      sort: (r) => r.sum.pct ?? -1,
      render: (r) => (
        <div className="flex w-32 items-center gap-2">
          <ProgressBar value={r.sum.pct} threshold={settings.threshold} className="flex-1" />
          <span className="w-11 text-right text-xs font-bold tabular-nums">{fmtPct(r.sum.pct, 0)}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge className={r.status === 'Active' ? 'bg-present-soft text-present' : 'bg-muted text-ink-3'} dot>{r.status}</Badge> },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (r) => (
              <div className="flex justify-end gap-0.5">
                <button
                  className="btn-icon h-8 w-8 hover:text-brand"
                  aria-label={`Edit ${r.name}`}
                  onClick={() => {
                    setEditing(r);
                    setFormOpen(true);
                  }}
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                <button className="btn-icon h-8 w-8 hover:bg-danger-soft hover:text-danger" aria-label={`Delete ${r.name}`} onClick={() => setDeleting(r)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Subjects' : 'My Subjects'}
        description={`${scope.subjects.length} subjects${isAdmin ? ` across ${departments.length} departments` : ''}`}
        actions={
          isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add Subject
            </button>
          )
        }
      />
      <div className="card mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_220px_180px]">
        <Input icon={Search} placeholder="Search by subject name, code or course" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id}>{d.name}</option>
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
      </div>
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          pageSize={12}
          minWidth={1100}
          initialSort={{ key: 'code', dir: 'asc' }}
          empty={q || dept || sem ? { icon: SearchX, title: 'No subjects found', message: 'Try another search or filter.' } : { icon: BookOpen, title: 'No subjects yet', message: 'Add subjects to build the timetable.' }}
        />
      )}
      {isAdmin && <SubjectForm open={formOpen} subject={editing} onClose={() => setFormOpen(false)} />}
      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        title="Delete subject?"
        message={deleting ? `${deleting.code} · ${deleting.name} will be removed from the catalogue and timetable. Existing attendance records are kept.` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          subjects$.remove(deleting.id);
          toast.success('Subject deleted', deleting.name);
          setDeleting(null);
        }}
      />
    </div>
  );
}
