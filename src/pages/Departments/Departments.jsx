import { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, PencilLine, Trash2, GraduationCap, UsersRound, School, Crown, Save, MapPin } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import ProgressRing from '../../components/ui/ProgressRing';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/Skeleton';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../hooks/useLoading';
import { summarize, emptyCounts } from '../../utils/attendance';

const EMPTY = { name: '', code: '', course: '', hodId: '', block: '', description: '' };

function DepartmentForm({ open, onClose, dept }) {
  const { departments, faculty, departments$, students$, students, faculty$, classes$, classes, subjects$, subjects } = useData();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(dept ? { ...EMPTY, ...dept } : EMPTY);
      setErrors({});
    }
  }, [open, dept]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (ev) => {
    ev?.preventDefault();
    const e = {};
    const others = departments.filter((d) => d.id !== dept?.id);
    if (!form.name.trim()) e.name = 'Department name is required.';
    else if (others.some((d) => d.name.toLowerCase() === form.name.trim().toLowerCase())) e.name = 'A department with this name exists.';
    if (!form.code.trim()) e.code = 'Department code is required.';
    if (!form.course.trim()) e.course = 'Programme / course is required.';
    else if (others.some((d) => d.course.toLowerCase() === form.course.trim().toLowerCase())) e.course = 'This course belongs to another department.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const rec = { ...form, name: form.name.trim(), code: form.code.trim().toUpperCase(), course: form.course.trim() };
    if (dept) {
      departments$.update(dept.id, rec);
      // keep references consistent if the name/course changed
      if (dept.name !== rec.name || dept.course !== rec.course) {
        students.filter((s) => s.department === dept.name).forEach((s) => students$.update(s.id, { department: rec.name, course: rec.course }));
        faculty.filter((f) => f.department === dept.name).forEach((f) => faculty$.update(f.id, { department: rec.name }));
        classes.filter((c) => c.department === dept.name).forEach((c) => classes$.update(c.id, { department: rec.name, course: rec.course }));
        subjects.filter((s) => s.department === dept.name).forEach((s) => subjects$.update(s.id, { department: rec.name, course: rec.course }));
      }
      toast.success('Department updated', rec.name);
    } else {
      departments$.add({ ...rec, established: new Date().getFullYear() });
      toast.success('Department created', `${rec.name} was added.`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Building2}
      title={dept ? 'Edit Department' : 'Add Department'}
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
        <Field label="Department name" required error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Information Technology" error={errors.name} autoFocus />
        </Field>
        <Field label="Code" required error={errors.code}>
          <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="IT" className="uppercase" error={errors.code} />
        </Field>
        <Field label="Programme (course)" required error={errors.course}>
          <Input value={form.course} onChange={(e) => set('course', e.target.value)} placeholder="BSc IT" error={errors.course} />
        </Field>
        <Field label="Head of Department">
          <Select value={form.hodId || ''} onChange={(e) => set('hodId', e.target.value)}>
            <option value="">Not assigned</option>
            {faculty
              .filter((f) => !dept || f.department === dept.name || f.department === form.name)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Building / block">
          <Input value={form.block} onChange={(e) => set('block', e.target.value)} placeholder="A Block" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export default function Departments() {
  const { departments, students, faculty, classes, stats, settings, facultyById, departments$ } = useData();
  const toast = useToast();
  const loading = useLoading(350);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const cards = useMemo(
    () =>
      departments.map((d) => ({
        ...d,
        students: students.filter((s) => s.department === d.name).length,
        faculty: faculty.filter((f) => f.department === d.name).length,
        classes: classes.filter((c) => c.department === d.name).length,
        sum: summarize(stats.byDept[d.name] || emptyCounts(), settings),
      })),
    [departments, students, faculty, classes, stats, settings],
  );

  return (
    <div>
      <PageHeader
        title="Departments"
        description={`${departments.length} academic departments · ${students.length} students enrolled`}
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Department
          </button>
        }
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="card">
          <EmptyState icon={Building2} title="No departments yet" message="Create your first department to start organising classes." />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {cards.map((d) => {
            const hod = facultyById[d.hodId];
            const low = d.sum.pct != null && d.sum.pct < settings.threshold;
            return (
              <article key={d.id} className="card card-hover flex flex-col">
                <div className="flex items-start gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="chip bg-brand-soft font-mono text-brand-600 dark:text-blue-300">{d.code}</span>
                      <span className="text-xs font-semibold text-ink-3">{d.course}</span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-ink">{d.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-3">{d.description}</p>
                    {d.block && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-3">
                        <MapPin className="h-3 w-3" /> {d.block}
                        {d.established ? ` · Est. ${d.established}` : ''}
                      </p>
                    )}
                  </div>
                  <ProgressRing value={d.sum.pct} threshold={settings.threshold} size={84} stroke={8} label="Avg." color={low ? '#dc2626' : undefined} />
                </div>

                <div className="mx-5 flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                  {hod ? <Avatar name={hod.name} size="sm" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Crown className="h-4 w-4 text-ink-3" /></span>}
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold tracking-wide text-ink-3 uppercase">Head of Department</p>
                    <p className="truncate text-sm font-semibold text-ink">{hod?.name || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 border-t border-line">
                  {[
                    { icon: GraduationCap, l: 'Students', v: d.students },
                    { icon: UsersRound, l: 'Faculty', v: d.faculty },
                    { icon: School, l: 'Classes', v: d.classes },
                  ].map((s, i) => (
                    <div key={s.l} className={`px-4 py-3 ${i ? 'border-l border-line' : ''}`}>
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-3">
                        <s.icon className="h-3.5 w-3.5" /> {s.l}
                      </p>
                      <p className="mt-0.5 text-lg font-extrabold text-ink">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-1 border-t border-line px-3 py-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditing(d);
                      setFormOpen(true);
                    }}
                  >
                    <PencilLine className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm hover:bg-danger-soft hover:text-danger" onClick={() => setDeleting(d)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <DepartmentForm open={formOpen} dept={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        title="Delete department?"
        message={deleting ? (deleting.students || deleting.classes ? `${deleting.name} still has ${deleting.students} students and ${deleting.classes} classes. Move or delete them first.` : `${deleting.name} will be permanently removed.`) : ''}
        confirmLabel={deleting && (deleting.students || deleting.classes) ? 'Understood' : 'Delete'}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting.students || deleting.classes) toast.error('Department not deleted', 'Remove its classes and students before deleting.');
          else {
            departments$.remove(deleting.id);
            toast.success('Department deleted', deleting.name);
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
