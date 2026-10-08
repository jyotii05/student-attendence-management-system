import { useEffect, useMemo, useState } from 'react';
import { UserPlus, PencilLine, Save } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { Field, Input, Select } from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { useData } from '../../context/DataContext';
import { SEMESTERS, DIVISIONS, GENDERS } from '../../data/catalog';
import { EMAIL_RE, PHONE_RE } from '../../utils/format';

const EMPTY = { name: '', id: '', rollNo: '', email: '', phone: '', gender: '', dob: '', course: '', department: '', semester: '', division: '', admissionYear: '' };

function nextStudentId(students, year) {
  const nums = students.map((s) => Number(String(s.id).slice(-3))).filter((n) => !Number.isNaN(n));
  return `STU${year}${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
}

export default function StudentForm({ open, onClose, student, onSaved }) {
  const { students, classes, departments, students$ } = useData();
  const editing = !!student;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      student
        ? { ...EMPTY, ...student, semester: String(student.semester), admissionYear: String(student.admissionYear) }
        : { ...EMPTY, id: nextStudentId(students, year), admissionYear: String(year) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student]);

  const courses = useMemo(() => departments.map((d) => ({ course: d.course, department: d.name })), [departments]);

  const set = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'course') next.department = courses.find((c) => c.course === v)?.department || '';
      if (k === 'department') next.course = courses.find((c) => c.department === v)?.course || '';
      return next;
    });
    setErrors((e) => ({ ...e, [k]: undefined, ...(k === 'course' || k === 'department' ? { course: undefined, department: undefined, division: undefined } : {}), ...(k === 'semester' ? { division: undefined } : {}) }));
  };

  const targetClass = classes.find((c) => c.course === form.course && c.semester === Number(form.semester) && c.division === form.division);

  const validate = () => {
    const e = {};
    const others = students.filter((s) => s.id !== student?.id);
    if (!form.name.trim()) e.name = 'Student name is required.';
    else if (form.name.trim().length < 3) e.name = 'Name must be at least 3 characters.';
    if (!form.id.trim()) e.id = 'Student ID is required.';
    else if (!/^[A-Z0-9-]{5,15}$/.test(form.id.trim())) e.id = 'Use 5–15 uppercase letters or digits (e.g. STU2026001).';
    else if (others.some((s) => s.id === form.id.trim())) e.id = 'This Student ID is already in use.';
    if (!form.rollNo.trim()) e.rollNo = 'Roll number is required.';
    else if (targetClass && others.some((s) => s.classId === targetClass.id && s.rollNo.toLowerCase() === form.rollNo.trim().toLowerCase())) e.rollNo = 'Roll number already exists in this class.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Please enter a valid email.';
    else if (others.some((s) => s.email.toLowerCase() === form.email.trim().toLowerCase())) e.email = 'This email is already registered.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number.';
    if (!form.gender) e.gender = 'Please select a gender.';
    if (!form.dob) e.dob = 'Date of birth is required.';
    else {
      const age = (Date.now() - new Date(form.dob).getTime()) / 31557600000;
      if (age < 15 || age > 60) e.dob = 'Student must be between 15 and 60 years old.';
    }
    if (!form.course) e.course = 'Please select a course.';
    if (!form.department) e.department = 'Please select a department.';
    if (!form.semester) e.semester = 'Please select a semester.';
    if (!form.division) e.division = 'Please select a division.';
    else if (form.course && form.semester && !targetClass) e.division = 'No class exists for this course, semester and division.';
    const y = Number(form.admissionYear);
    if (!form.admissionYear) e.admissionYear = 'Admission year is required.';
    else if (!Number.isInteger(y) || y < 2000 || y > year) e.admissionYear = `Enter a year between 2000 and ${year}.`;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (ev) => {
    ev?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const rec = {
        name: form.name.trim(),
        id: form.id.trim(),
        rollNo: form.rollNo.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gender: form.gender,
        dob: form.dob,
        course: form.course,
        department: form.department,
        semester: Number(form.semester),
        division: form.division,
        admissionYear: Number(form.admissionYear),
        classId: targetClass.id,
        status: student?.status || 'Active',
      };
      if (editing) students$.update(student.id, rec);
      else students$.add(rec);
      setSaving(false);
      onSaved?.(rec, editing);
      onClose();
    }, 400);
  };

  const F = (k, label, el, cls = '') => (
    <Field label={label} required error={errors[k]} htmlFor={`sf-${k}`} className={cls}>
      {el}
    </Field>
  );
  const inp = (k, props = {}) => <Input id={`sf-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value)} error={errors[k]} {...props} />;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={editing ? PencilLine : UserPlus}
      title={editing ? 'Edit Student' : 'Add Student'}
      description={editing ? `Update details for ${student.name}` : 'Create a new student record. Fields marked * are required.'}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <Spinner /> : <Save className="h-4 w-4" />}
            {editing ? 'Save changes' : 'Add student'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-6">
        <section>
          <p className="mb-3 text-[11px] font-bold tracking-wider text-ink-3 uppercase">Personal details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {F('name', 'Full name', inp('name', { placeholder: 'e.g. Sneha Joshi', autoFocus: true }), 'sm:col-span-2')}
            {F('email', 'Email', inp('email', { type: 'email', placeholder: 'name@students.attendease.com' }))}
            {F('phone', 'Phone', inp('phone', { inputMode: 'numeric', maxLength: 10, placeholder: '98XXXXXXXX' }))}
            {F(
              'gender',
              'Gender',
              <Select id="sf-gender" value={form.gender} onChange={(e) => set('gender', e.target.value)} error={errors.gender}>
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>,
            )}
            {F('dob', 'Date of birth', inp('dob', { type: 'date', max: new Date().toISOString().slice(0, 10) }))}
          </div>
        </section>

        <section>
          <p className="mb-3 text-[11px] font-bold tracking-wider text-ink-3 uppercase">Academic details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {F('id', 'Student ID', inp('id', { placeholder: 'STU2026001', className: 'font-mono uppercase', onChange: (e) => set('id', e.target.value.toUpperCase()) }))}
            {F('rollNo', 'Roll number', inp('rollNo', { placeholder: 'IT5A-25', className: 'font-mono' }))}
            {F(
              'course',
              'Course',
              <Select id="sf-course" value={form.course} onChange={(e) => set('course', e.target.value)} error={errors.course}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.course}>{c.course}</option>
                ))}
              </Select>,
            )}
            {F(
              'department',
              'Department',
              <Select id="sf-department" value={form.department} onChange={(e) => set('department', e.target.value)} error={errors.department}>
                <option value="">Select department</option>
                {courses.map((c) => (
                  <option key={c.department}>{c.department}</option>
                ))}
              </Select>,
            )}
            {F(
              'semester',
              'Semester',
              <Select id="sf-semester" value={form.semester} onChange={(e) => set('semester', e.target.value)} error={errors.semester}>
                <option value="">Select semester</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </Select>,
            )}
            {F(
              'division',
              'Division',
              <Select id="sf-division" value={form.division} onChange={(e) => set('division', e.target.value)} error={errors.division}>
                <option value="">Select division</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    Division {d}
                  </option>
                ))}
              </Select>,
            )}
            {F('admissionYear', 'Admission year', inp('admissionYear', { type: 'number', min: 2000, max: year }))}
            <div className="flex items-end">
              <p className={`w-full rounded-lg border px-3 py-2.5 text-xs ${targetClass ? 'border-brand/30 bg-brand-softer text-brand-600 dark:text-blue-300' : 'border-dashed border-line text-ink-3'}`}>
                {targetClass ? `Will be enrolled in ${targetClass.course} · Sem ${targetClass.semester} · Div ${targetClass.division} (Room ${targetClass.room})` : 'Select course, semester and division to choose a class'}
              </p>
            </div>
          </div>
        </section>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
