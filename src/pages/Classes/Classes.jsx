import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { School, Plus, PencilLine, Trash2, GraduationCap, MapPin, Save, ClipboardCheck, UserRound, SearchX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/Modal/Modal';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import Segmented from '../../components/ui/Segmented';
import { StandingBadge } from '../../components/ui/Badge';
import { Field, Input, Select } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/Skeleton';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useScope } from '../../hooks/useScope';
import { useLoading } from '../../hooks/useLoading';
import { summarize, standing, emptyCounts } from '../../utils/attendance';
import { fmtPct } from '../../utils/format';
import { SEMESTERS, DIVISIONS } from '../../data/catalog';

const EMPTY = { course: '', semester: '', division: '', room: '', classTeacherId: '', capacity: '60' };

function ClassForm({ open, onClose, cls }) {
  const { classes, departments, faculty, classes$ } = useData();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(cls ? { ...EMPTY, ...cls, semester: String(cls.semester), capacity: String(cls.capacity ?? 60), classTeacherId: cls.classTeacherId || '' } : EMPTY);
      setErrors({});
    }
  }, [open, cls]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const dept = departments.find((d) => d.course === form.course);

  const submit = (ev) => {
    ev?.preventDefault();
    const e = {};
    if (!form.course) e.course = 'Please select a course.';
    if (!form.semester) e.semester = 'Please select a semester.';
    if (!form.division) e.division = 'Please select a division.';
    if (!form.room.trim()) e.room = 'Room is required.';
    if (form.course && form.semester && form.division && classes.some((c) => c.id !== cls?.id && c.course === form.course && c.semester === Number(form.semester) && c.division === form.division))
      e.division = 'This class already exists.';
    if (!(Number(form.capacity) > 0)) e.capacity = 'Capacity must be greater than 0.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const rec = { course: form.course, department: dept.name, semester: Number(form.semester), division: form.division, room: form.room.trim(), classTeacherId: form.classTeacherId || null, capacity: Number(form.capacity) };
    if (cls) classes$.update(cls.id, rec);
    else classes$.add({ ...rec, id: `${dept.id}-${rec.semester}${rec.division}`, academicYear: classes[0]?.academicYear });
    toast.success(cls ? 'Class updated' : 'Class created', `${rec.course} · Sem ${rec.semester} · Div ${rec.division}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={School}
      title={cls ? 'Edit Class' : 'Add Class'}
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
        <Field label="Course" required error={errors.course}>
          <Select value={form.course} onChange={(e) => set('course', e.target.value)} error={errors.course} disabled={!!cls}>
            <option value="">Select course</option>
            {departments.map((d) => (
              <option key={d.id}>{d.course}</option>
            ))}
          </Select>
        </Field>
        <Field label="Semester" required error={errors.semester}>
          <Select value={form.semester} onChange={(e) => set('semester', e.target.value)} error={errors.semester} disabled={!!cls}>
            <option value="">Select semester</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Division" required error={errors.division}>
          <Select value={form.division} onChange={(e) => set('division', e.target.value)} error={errors.division} disabled={!!cls}>
            <option value="">Select division</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                Division {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Room" required error={errors.room}>
          <Input value={form.room} onChange={(e) => set('room', e.target.value)} placeholder="A-301" error={errors.room} />
        </Field>
        <Field label="Class teacher">
          <Select value={form.classTeacherId} onChange={(e) => set('classTeacherId', e.target.value)}>
            <option value="">Not assigned</option>
            {faculty
              .filter((f) => !dept || f.department === dept.name)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Capacity" error={errors.capacity}>
          <Input type="number" min={1} value={form.capacity} onChange={(e) => set('capacity', e.target.value)} error={errors.capacity} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export default function Classes() {
  const { role } = useAuth();
  const { students, stats, settings, facultyById, departments, classes$ } = useData();
  const scope = useScope();
  const toast = useToast();
  const loading = useLoading(350);
  const [params] = useSearchParams();
  const highlight = params.get('highlight');
  const [course, setCourse] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (highlight && !loading) document.getElementById(`class-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight, loading]);

  const cards = useMemo(
    () =>
      scope.classes
        .filter((c) => course === 'all' || c.course === course)
        .map((c) => {
          const roster = students.filter((s) => s.classId === c.id);
          const sum = summarize(stats.byClass[c.id] || emptyCounts(), settings);
          const low = roster.filter((s) => {
            const p = summarize(stats.byStudent[s.id] || emptyCounts(), settings).pct;
            return p != null && p < settings.threshold;
          }).length;
          return { ...c, roster, sum, low };
        })
        .sort((a, b) => a.course.localeCompare(b.course) || a.semester - b.semester || a.division.localeCompare(b.division)),
    [scope.classes, course, students, stats, settings],
  );

  const courses = [...new Set(scope.classes.map((c) => c.course))];

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Classes' : 'My Classes'}
        description={`${scope.classes.length} classes · ${scope.classes.reduce((a, c) => a + students.filter((s) => s.classId === c.id).length, 0)} students`}
        actions={
          isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add Class
            </button>
          )
        }
      />

      {courses.length > 1 && (
        <Segmented className="mb-5" value={course} onChange={setCourse} options={[{ value: 'all', label: 'All courses' }, ...departments.filter((d) => courses.includes(d.course)).map((d) => ({ value: d.course, label: d.course }))]} />
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="card">
          <EmptyState icon={SearchX} title="No classes found" message="There are no classes for this selection." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => {
            const teacher = facultyById[c.classTeacherId];
            const st = standing(c.sum.pct, settings.threshold);
            return (
              <article id={`class-${c.id}`} key={c.id} className={`card card-hover flex flex-col p-5 ${highlight === c.id ? 'ring-2 ring-brand' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-brand">{c.department}</p>
                    <h3 className="mt-0.5 text-base font-bold text-ink">{c.course}</h3>
                    <p className="text-sm text-ink-2">
                      Semester {c.semester} · Division {c.division}
                    </p>
                  </div>
                  <StandingBadge standing={st} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-surface-2 py-2">
                    <p className="text-lg font-extrabold text-ink">{c.roster.length}</p>
                    <p className="text-[10.5px] font-medium text-ink-3">Students</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 py-2">
                    <p className="text-lg font-extrabold text-brand-900 dark:text-blue-200">{fmtPct(c.sum.pct, 0)}</p>
                    <p className="text-[10.5px] font-medium text-ink-3">Avg. attendance</p>
                  </div>
                  <div className={`rounded-lg py-2 ${c.low ? 'bg-danger-soft' : 'bg-surface-2'}`}>
                    <p className={`text-lg font-extrabold ${c.low ? 'text-danger' : 'text-ink'}`}>{c.low}</p>
                    <p className="text-[10.5px] font-medium text-ink-3">Below {settings.threshold}%</p>
                  </div>
                </div>
                <ProgressBar value={c.sum.pct} threshold={settings.threshold} className="mt-4" />

                <div className="mt-4 space-y-1.5 text-xs text-ink-2">
                  <p className="flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-ink-3" /> Class teacher: <b className="font-semibold text-ink">{teacher?.name || 'Not assigned'}</b>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-ink-3" /> Room {c.room} · Capacity {c.capacity ?? 60}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-line pt-3">
                  <Link to={`/attendance/mark?class=${c.id}`} className="btn btn-ghost btn-sm text-brand">
                    <ClipboardCheck className="h-3.5 w-3.5" /> Mark
                  </Link>
                  <Link to={`/students?course=${encodeURIComponent(c.course)}&sem=${c.semester}&div=${c.division}`} className="btn btn-ghost btn-sm">
                    <GraduationCap className="h-3.5 w-3.5" /> Students
                  </Link>
                  {isAdmin && (
                    <span className="ml-auto flex gap-1">
                      <button
                        className="btn-icon h-8 w-8"
                        aria-label="Edit class"
                        onClick={() => {
                          setEditing(c);
                          setFormOpen(true);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button className="btn-icon h-8 w-8 hover:bg-danger-soft hover:text-danger" aria-label="Delete class" onClick={() => setDeleting(c)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isAdmin && <ClassForm open={formOpen} cls={editing} onClose={() => setFormOpen(false)} />}
      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        title="Delete class?"
        message={deleting ? (deleting.roster.length ? `${deleting.course} Sem ${deleting.semester} ${deleting.division} still has ${deleting.roster.length} students. Move or delete them before removing the class.` : 'This class and its timetable will be removed.') : ''}
        confirmLabel={deleting?.roster.length ? 'Understood' : 'Delete'}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting.roster.length) toast.error('Class not deleted', 'It still has enrolled students.');
          else {
            classes$.remove(deleting.id);
            toast.success('Class deleted');
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
