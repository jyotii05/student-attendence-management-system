import { useEffect, useState } from 'react';
import { UserPlus, PencilLine, Save } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { Field, Input, Select } from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { useData } from '../../context/DataContext';
import { DESIGNATIONS, GENDERS } from '../../data/catalog';
import { EMAIL_RE, PHONE_RE } from '../../utils/format';

const EMPTY = { name: '', id: '', email: '', phone: '', gender: '', department: '', designation: '', qualification: '', experience: '', joined: '', status: 'Active', subjectIds: [] };

export default function FacultyForm({ open, onClose, member, onSaved }) {
  const { faculty, departments, subjects, faculty$, subjects$ } = useData();
  const editing = !!member;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (member) setForm({ ...EMPTY, ...member, experience: String(member.experience ?? ''), subjectIds: subjects.filter((s) => s.facultyId === member.id).map((s) => s.id) });
    else {
      const n = Math.max(100, ...faculty.map((f) => Number(String(f.id).replace(/\D/g, '')) || 0)) + 1;
      setForm({ ...EMPTY, id: `FAC${n}`, joined: new Date().toISOString().slice(0, 10) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'department' ? { subjectIds: [] } : {}) }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggleSubject = (id) => setForm((f) => ({ ...f, subjectIds: f.subjectIds.includes(id) ? f.subjectIds.filter((x) => x !== id) : [...f.subjectIds, id] }));

  const validate = () => {
    const e = {};
    const others = faculty.filter((f) => f.id !== member?.id);
    if (!form.name.trim()) e.name = 'Faculty name is required.';
    if (!form.id.trim()) e.id = 'Faculty ID is required.';
    else if (others.some((f) => f.id === form.id.trim())) e.id = 'This Faculty ID is already in use.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Please enter a valid email.';
    else if (others.some((f) => f.email.toLowerCase() === form.email.trim().toLowerCase())) e.email = 'This email is already registered.';
    if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number.';
    if (!form.gender) e.gender = 'Please select a gender.';
    if (!form.department) e.department = 'Please select a department.';
    if (!form.designation) e.designation = 'Please select a designation.';
    if (form.experience !== '' && (Number(form.experience) < 0 || Number(form.experience) > 50)) e.experience = 'Experience must be 0–50 years.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (ev) => {
    ev?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const { subjectIds, ...rest } = form;
      const rec = { ...rest, name: form.name.trim(), id: form.id.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), experience: Number(form.experience || 0) };
      if (editing) faculty$.update(member.id, rec);
      else faculty$.add(rec);
      // Sync subject assignments
      subjects.forEach((s) => {
        const want = subjectIds.includes(s.id);
        if (want && s.facultyId !== rec.id) subjects$.update(s.id, { facultyId: rec.id });
        if (!want && s.facultyId === rec.id) subjects$.update(s.id, { facultyId: null });
      });
      setSaving(false);
      onSaved?.(rec, editing);
      onClose();
    }, 400);
  };

  const deptSubjects = subjects.filter((s) => s.department === form.department);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={editing ? PencilLine : UserPlus}
      title={editing ? 'Edit Faculty' : 'Add Faculty'}
      description={editing ? `Update details for ${member.name}` : 'Add a faculty member and assign their subjects.'}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : <Save className="h-4 w-4" />} {editing ? 'Save changes' : 'Add faculty'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Prof. Anita Kulkarni" error={errors.name} autoFocus />
        </Field>
        <Field label="Faculty ID" required error={errors.id}>
          <Input value={form.id} onChange={(e) => set('id', e.target.value.toUpperCase())} className="font-mono" error={errors.id} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@attendease.com" error={errors.email} />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <Input value={form.phone} maxLength={10} inputMode="numeric" onChange={(e) => set('phone', e.target.value)} placeholder="98XXXXXXXX" error={errors.phone} />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <Select value={form.gender} onChange={(e) => set('gender', e.target.value)} error={errors.gender}>
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
        </Field>
        <Field label="Department" required error={errors.department}>
          <Select value={form.department} onChange={(e) => set('department', e.target.value)} error={errors.department}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Designation" required error={errors.designation}>
          <Select value={form.designation} onChange={(e) => set('designation', e.target.value)} error={errors.designation}>
            <option value="">Select designation</option>
            {DESIGNATIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label="Qualification">
          <Input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="e.g. M.Tech, NET" />
        </Field>
        <Field label="Experience (years)" error={errors.experience}>
          <Input type="number" min={0} max={50} value={form.experience} onChange={(e) => set('experience', e.target.value)} error={errors.experience} />
        </Field>
        <Field label="Joining date">
          <Input type="date" value={form.joined} onChange={(e) => set('joined', e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option>Active</option>
            <option>On Leave</option>
            <option>Inactive</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <p className="label">Assigned subjects</p>
          {!form.department ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-3 text-xs text-ink-3">Select a department to assign subjects.</p>
          ) : (
            <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-2">
              {deptSubjects.map((s) => (
                <label key={s.id} className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${form.subjectIds.includes(s.id) ? 'bg-brand-soft text-brand-600 dark:text-blue-300' : 'hover:bg-hover'}`}>
                  <input type="checkbox" className="accent-brand-600" checked={form.subjectIds.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                  <span className="font-semibold">{s.name}</span>
                  <span className="ml-auto text-ink-3">Sem {s.semester}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
