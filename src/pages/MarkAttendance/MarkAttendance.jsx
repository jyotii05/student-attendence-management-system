import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, CheckCheck, RotateCcw, Save, Search, Users, Info, CircleCheck, ClipboardList, Plus, TriangleAlert, CalendarClock, UserX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import { Field, Input, Select } from '../../components/ui/Field';
import AttendanceTable from '../../components/AttendanceTable/AttendanceTable';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useScope } from '../../hooks/useScope';
import { STATUS, STATUS_KEYS, LECTURE_SLOTS, summarize, emptyCounts } from '../../utils/attendance';
import { todayISO, weekdayOf, formatDate, formatDateTime, DAYS } from '../../utils/date';
import { fmtPct } from '../../utils/format';
import { SEMESTERS, DIVISIONS } from '../../data/catalog';

export default function MarkAttendance() {
  const { role, user, profile } = useAuth();
  const data = useData();
  const { departments, classes, students, faculty, facultyById, subjectsById, timetable, settings, stats, findSession, saveSession } = data;
  const scope = useScope();
  const toast = useToast();
  const [params] = useSearchParams();
  const isFaculty = role === 'faculty';

  // ---------- Selection ----------
  const initial = useMemo(() => {
    const cls = classes.find((c) => c.id === params.get('class'));
    const sub = subjectsById[params.get('subject')];
    return {
      department: cls?.department || sub?.department || (isFaculty ? profile?.department : '') || '',
      course: cls?.course || sub?.course || '',
      semester: cls ? String(cls.semester) : sub ? String(sub.semester) : '',
      division: cls?.division || '',
      subjectId: sub?.id || '',
      facultyId: isFaculty ? profile?.id : sub?.facultyId || '',
      date: params.get('date') || todayISO(),
      slot: params.get('slot') || '',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sel, setSel] = useState(initial);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({});
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const allowedSubjects = isFaculty ? scope.subjects : data.subjects;
  const deptOptions = departments.filter((d) => allowedSubjects.some((s) => s.department === d.name));
  const courseOptions = deptOptions.filter((d) => !sel.department || d.name === sel.department).map((d) => d.course);
  const semOptions = SEMESTERS.filter((s) => classes.some((c) => c.course === sel.course && c.semester === s));
  const divOptions = DIVISIONS.filter((d) => classes.some((c) => c.course === sel.course && c.semester === Number(sel.semester) && c.division === d));
  const subjectOptions = allowedSubjects.filter((s) => s.course === sel.course && s.semester === Number(sel.semester));

  const cls = classes.find((c) => c.course === sel.course && c.semester === Number(sel.semester) && c.division === sel.division);
  const subject = subjectsById[sel.subjectId];
  const roster = useMemo(() => (cls ? students.filter((s) => s.classId === cls.id).sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true })) : []), [cls, students]);
  const existing = cls && sel.date && sel.slot ? findSession(cls.id, sel.date, sel.slot) : null;
  const ready = cls && subject && sel.date && sel.slot && sel.facultyId;
  const scheduled = cls ? timetable.filter((t) => t.classId === cls.id && t.day === weekdayOf(sel.date)) : [];

  const update = (k, v) => {
    setSaved(null);
    setSel((s) => {
      const n = { ...s, [k]: v };
      if (k === 'department') {
        n.course = departments.find((d) => d.name === v)?.course || '';
        n.semester = n.division = n.subjectId = '';
      }
      if (k === 'course') {
        n.department = departments.find((d) => d.course === v)?.name || n.department;
        n.semester = n.division = n.subjectId = '';
      }
      if (k === 'semester') n.division = n.subjectId = '';
      if (k === 'subjectId' && !isFaculty) n.facultyId = subjectsById[v]?.facultyId || '';
      return n;
    });
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Suggest the lecture slot from the timetable when subject/class/date line up
  useEffect(() => {
    if (!cls || !sel.subjectId || sel.slot) return;
    const hit = timetable.find((t) => t.classId === cls.id && t.subjectId === sel.subjectId && t.day === weekdayOf(sel.date));
    if (hit) setSel((s) => ({ ...s, slot: String(hit.slot) }));
  }, [cls, sel.subjectId, sel.date, sel.slot, timetable]);

  // Load existing marks whenever the lecture identity changes
  const lectureKey = cls && sel.date && sel.slot ? `${cls.id}_${sel.date}_${sel.slot}` : '';
  useEffect(() => {
    setValues(existing ? { ...existing.records } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureKey]);

  // ---------- Counters ----------
  const counts = useMemo(() => {
    const c = { ...emptyCounts(), U: 0 };
    roster.forEach((s) => (values[s.id] ? c[values[s.id]]++ : c.U++));
    return c;
  }, [roster, values]);
  const liveSum = summarize(counts, settings);
  const summaries = useMemo(() => Object.fromEntries(roster.map((s) => [s.id, summarize(stats.byStudent[s.id] || emptyCounts(), settings)])), [roster, stats, settings]);
  const visible = roster.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.rollNo.toLowerCase().includes(q.toLowerCase()));
  const edited = new Set(existing ? roster.filter((s) => values[s.id] && existing.records[s.id] && values[s.id] !== existing.records[s.id]).map((s) => s.id) : []);
  const dirty = existing ? edited.size > 0 || roster.some((s) => values[s.id] && !existing.records[s.id]) : Object.keys(values).length > 0;

  const markAll = (st) => {
    setSaved(null);
    setValues(Object.fromEntries(roster.map((s) => [s.id, st])));
  };
  const markRemaining = (st) => setValues((v) => ({ ...Object.fromEntries(roster.map((s) => [s.id, v[s.id] || st])) }));

  const validate = () => {
    const e = {};
    if (!sel.department) e.department = 'Please select a department.';
    if (!sel.course) e.course = 'Please select a course.';
    if (!sel.semester) e.semester = 'Please select a semester.';
    if (!sel.division) e.division = 'Please select a division.';
    if (!sel.subjectId) e.subjectId = 'Please select a subject.';
    if (!sel.facultyId) e.facultyId = 'Please select a faculty member.';
    if (!sel.date) e.date = 'Please select a date.';
    else if (sel.date > todayISO()) e.date = 'Attendance can’t be marked for a future date.';
    if (!sel.slot) e.slot = 'Please select a lecture.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onSave = () => {
    if (!validate()) {
      toast.error('Missing lecture details', 'Complete the highlighted fields before saving.');
      return;
    }
    if (!roster.length) return;
    if (counts.U > 0) {
      toast.warning(`${counts.U} student${counts.U > 1 ? 's are' : ' is'} not marked`, 'Mark every student, or use “Mark remaining present”.');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const records = Object.fromEntries(roster.map((s) => [s.id, values[s.id]]));
      const res = saveSession({ classId: cls.id, subjectId: sel.subjectId, facultyId: sel.facultyId, date: sel.date, slot: Number(sel.slot), records }, user);
      setSaving(false);
      setSaved({ ...res, present: counts.P, total: roster.length, pct: liveSum.pct });
      toast.success(res.created ? 'Attendance saved successfully' : 'Attendance updated', `${subject.name} · ${counts.P}/${roster.length} present (${fmtPct(liveSum.pct)}).${res.dropped ? ` ${res.dropped} student(s) fell below ${settings.threshold}%.` : ''}`);
    }, 650);
  };

  const sel8 = (k, label, opts, ph, disabled) => (
    <Field label={label} required error={errors[k]}>
      <Select value={sel[k]} onChange={(e) => update(k, e.target.value)} error={errors[k]} disabled={disabled}>
        <option value="">{ph}</option>
        {opts}
      </Select>
    </Field>
  );

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        title="Mark Attendance"
        description="Select the lecture, then mark each student. Attendance percentages update instantly after saving."
        actions={
          <Link to="/attendance/records" className="btn btn-secondary">
            <ClipboardList className="h-4 w-4" /> Attendance Records
          </Link>
        }
      />

      <Card title="Lecture details" subtitle="All fields are required" icon={CalendarClock}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sel8(
            'department',
            'Department',
            deptOptions.map((d) => (
              <option key={d.id}>{d.name}</option>
            )),
            'Select department',
          )}
          {sel8(
            'course',
            'Course',
            courseOptions.map((c) => <option key={c}>{c}</option>),
            'Select course',
            !sel.department,
          )}
          {sel8(
            'semester',
            'Semester',
            semOptions.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            )),
            'Select semester',
            !sel.course,
          )}
          {sel8(
            'division',
            'Division',
            divOptions.map((d) => (
              <option key={d} value={d}>
                Division {d}
              </option>
            )),
            'Select division',
            !sel.semester,
          )}
          {sel8(
            'subjectId',
            'Subject',
            subjectOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            )),
            'Select subject',
            !sel.semester,
          )}
          {sel8(
            'facultyId',
            'Faculty',
            (isFaculty ? faculty.filter((f) => f.id === profile?.id) : faculty.filter((f) => !sel.department || f.department === sel.department)).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            )),
            'Select faculty',
            isFaculty,
          )}
          <Field label="Date" required error={errors.date}>
            <Input type="date" value={sel.date} max={todayISO()} onChange={(e) => update('date', e.target.value)} error={errors.date} />
          </Field>
          {sel8(
            'slot',
            'Lecture / time',
            LECTURE_SLOTS.map((s) => {
              const tt = scheduled.find((t) => t.slot === s.id);
              return (
                <option key={s.id} value={s.id}>
                  {s.label} · {s.start}–{s.end}
                  {tt ? ` · ${subjectsById[tt.subjectId]?.name}` : ''}
                </option>
              );
            }),
            'Select lecture',
          )}
        </div>
        {sel.date && !settings.workingDays.includes(weekdayOf(sel.date)) && (
          <p className="mt-4 flex items-center gap-2 rounded-lg border border-late/40 bg-late-soft px-3 py-2 text-xs text-ink-2">
            <TriangleAlert className="h-4 w-4 text-late" /> {DAYS[weekdayOf(sel.date)]} is not a configured working day. You can still record an extra lecture.
          </p>
        )}
      </Card>

      {!cls ? (
        <div className="card">
          <EmptyState icon={Users} title="Select a class to load students" message="Choose the department, course, semester and division above to see the roll call." />
        </div>
      ) : roster.length === 0 ? (
        <div className="card">
          <EmptyState icon={UserX} title="No students in this class" message="Add students to this class from the Students page." />
        </div>
      ) : (
        <Card
          title={`${cls.course} · Semester ${cls.semester} · Division ${cls.division}`}
          subtitle={`${roster.length} students · ${subject ? subject.name : 'No subject selected'} · ${sel.date ? formatDate(sel.date, { weekday: 'short' }) : ''}`}
          bodyClassName="p-0"
          actions={
            <>
              <button className="btn btn-outline btn-sm" onClick={() => markAll('P')}>
                <CheckCheck className="h-3.5 w-3.5" /> Mark All Present
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => (Object.keys(values).length ? setConfirmReset(true) : null)}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </>
          }
        >
          {existing && (
            <div className="flex items-start gap-3 border-b border-line bg-brand-softer px-5 py-3 text-xs text-ink-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p>
                Attendance for this lecture was marked by <b className="text-ink">{existing.markedBy}</b> on {formatDateTime(existing.markedAt)}
                {existing.updatedBy && (
                  <>
                    {' '}
                    · last updated by <b className="text-ink">{existing.updatedBy}</b> at {formatDateTime(existing.updatedAt)}
                  </>
                )}
                . Saving will update the existing record{existing.subjectId !== sel.subjectId && sel.subjectId ? ` (currently recorded as ${subjectsById[existing.subjectId]?.name})` : ''}.
              </p>
            </div>
          )}

          {saved && (
            <div className="animate-pop flex flex-col gap-3 border-b border-present/30 bg-present-soft px-5 py-4 sm:flex-row sm:items-center">
              <CircleCheck className="h-6 w-6 shrink-0 text-present" />
              <div className="flex-1 text-sm">
                <p className="font-bold text-ink">{saved.created ? 'Attendance saved' : 'Attendance updated'} — {saved.present}/{saved.total} present ({fmtPct(saved.pct)})</p>
                <p className="text-xs text-ink-2">Student percentages, dashboards, reports and low-attendance alerts have been updated.</p>
              </div>
              <div className="flex gap-2">
                <Link to="/attendance/records" className="btn btn-outline btn-sm">
                  View records
                </Link>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSaved(null);
                    update('slot', '');
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Next lecture
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-b border-line px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_KEYS.map((k) => (
                <span key={k} className={`chip ${STATUS[k].bg} ${STATUS[k].text} px-2.5 py-1`}>
                  <span className={`h-2 w-2 rounded-full ${STATUS[k].solid}`} />
                  {STATUS[k].label} <b className="tabular-nums">{counts[k]}</b>
                </span>
              ))}
              <span className={`chip px-2.5 py-1 ${counts.U ? 'bg-muted text-ink-2' : 'bg-present-soft text-present'}`}>
                Unmarked <b className="tabular-nums">{counts.U}</b>
              </span>
              <span className="chip bg-brand-soft px-2.5 py-1 text-brand-600 dark:text-blue-300">
                Lecture attendance <b className="tabular-nums">{fmtPct(liveSum.pct)}</b>
              </span>
            </div>
            <div className="flex gap-2">
              {counts.U > 0 && counts.U < roster.length && (
                <button className="btn btn-ghost btn-sm whitespace-nowrap text-present" onClick={() => markRemaining('P')}>
                  Mark remaining present
                </button>
              )}
              <div className="w-full lg:w-60">
                <Input icon={Search} placeholder="Find student or roll no" value={q} onChange={(e) => setQ(e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState compact title="No students match your search" />
          ) : (
            <AttendanceTable
              students={visible}
              values={values}
              summaries={summaries}
              threshold={settings.threshold}
              editedIds={edited}
              onChange={(id, st) => {
                setSaved(null);
                setValues((v) => ({ ...v, [id]: st }));
              }}
            />
          )}

          <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-b-xl border-t border-line bg-surface/95 px-5 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-3">
              {ready ? (
                <>
                  Marking as <b className="text-ink-2">{facultyById[sel.facultyId]?.name}</b> · Minimum attendance {settings.threshold}%
                </>
              ) : (
                'Complete the lecture details above to save.'
              )}
            </p>
            <div className="flex gap-2">
              <button className="btn btn-outline" onClick={() => (Object.keys(values).length ? setConfirmReset(true) : null)} disabled={saving}>
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button className="btn btn-primary min-w-[160px]" onClick={onSave} disabled={saving || (existing && !dirty && !!saved)}>
                {saving ? <Spinner /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : existing ? 'Update Attendance' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset all marks?"
        message={existing ? 'This restores the marks that were last saved for this lecture.' : 'All selections for this lecture will be cleared.'}
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setValues(existing ? { ...existing.records } : {});
          setSaved(null);
          setConfirmReset(false);
          toast.info('Marks reset');
        }}
      />
    </div>
  );
}
