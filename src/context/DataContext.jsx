import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { generateSeed, SEED_VERSION } from '../data/seed';
import { load, save, clearAll } from '../utils/storage';
import { tally, summarize, emptyCounts, STATUS } from '../utils/attendance';
import { uid, classLabel } from '../utils/format';

const DataContext = createContext(null);

const KEYS = ['departments', 'faculty', 'subjects', 'classes', 'timetable', 'students', 'sessions', 'users', 'notifications', 'settings'];

function initialData() {
  if (load('seedVersion') === SEED_VERSION) {
    const data = Object.fromEntries(KEYS.map((k) => [k, load(k, null)]));
    if (KEYS.every((k) => data[k] != null)) return data;
  }
  const seed = generateSeed();
  KEYS.forEach((k) => save(k, seed[k]));
  save('seedVersion', SEED_VERSION);
  return seed;
}

/** useState that mirrors every change into localStorage. */
function usePersisted(key, initial) {
  const [value, setValue] = useState(initial);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    save(key, value);
  }, [key, value]);
  return [value, setValue];
}

export function DataProvider({ children }) {
  const [boot] = useState(initialData);
  const [departments, setDepartments] = usePersisted('departments', boot.departments);
  const [faculty, setFaculty] = usePersisted('faculty', boot.faculty);
  const [subjects, setSubjects] = usePersisted('subjects', boot.subjects);
  const [classes, setClasses] = usePersisted('classes', boot.classes);
  const [timetable, setTimetable] = usePersisted('timetable', boot.timetable);
  const [students, setStudents] = usePersisted('students', boot.students);
  const [sessions, setSessions] = usePersisted('sessions', boot.sessions);
  const [users, setUsers] = usePersisted('users', boot.users);
  const [notifications, setNotifications] = usePersisted('notifications', boot.notifications);
  const [settings, setSettings] = usePersisted('settings', boot.settings);

  // ---------- Lookups ----------
  const maps = useMemo(() => {
    const by = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
    return {
      studentsById: by(students),
      facultyById: by(faculty),
      subjectsById: by(subjects),
      classesById: by(classes),
      departmentsById: by(departments),
      deptByName: Object.fromEntries(departments.map((d) => [d.name, d])),
    };
  }, [students, faculty, subjects, classes, departments]);

  // ---------- Live statistics (recomputed whenever attendance changes) ----------
  const stats = useMemo(
    () => tally(sessions, { classesById: maps.classesById, studentIds: new Set(students.map((s) => s.id)) }),
    [sessions, maps.classesById, students],
  );

  const studentSummary = useCallback((id) => summarize(stats.byStudent[id] || emptyCounts(), settings), [stats, settings]);

  // ---------- Notifications ----------
  const notify = useCallback(
    (n) =>
      setNotifications((list) => [{ id: uid('n'), time: Date.now(), read: false, audience: ['admin', 'faculty'], type: 'system', ...n }, ...list].slice(0, 80)),
    [setNotifications],
  );
  const markRead = useCallback((id) => setNotifications((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))), [setNotifications]);
  const markAllRead = useCallback(
    (role) => setNotifications((l) => l.map((n) => (n.audience.includes(role) ? { ...n, read: true } : n))),
    [setNotifications],
  );
  const removeNotification = useCallback((id) => setNotifications((l) => l.filter((n) => n.id !== id)), [setNotifications]);

  // ---------- Generic CRUD ----------
  const crud = (setter, prefix) => ({
    add: (item) => {
      const rec = { id: item.id || uid(prefix), createdAt: Date.now(), ...item };
      setter((l) => [rec, ...l]);
      return rec;
    },
    update: (id, patch) => setter((l) => l.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x))),
    remove: (id) => setter((l) => l.filter((x) => x.id !== id)),
  });

  const studentsApi = crud(setStudents, 'STU');
  const facultyApi = crud(setFaculty, 'FAC');
  const departmentsApi = crud(setDepartments, 'dept');
  const classesApi = crud(setClasses, 'cls');
  const subjectsApi = crud(setSubjects, 'SUB');

  const removeFaculty = (id) => {
    facultyApi.remove(id);
    setSubjects((l) => l.map((s) => (s.facultyId === id ? { ...s, facultyId: null } : s)));
    setClasses((l) => l.map((c) => (c.classTeacherId === id ? { ...c, classTeacherId: null } : c)));
  };
  const removeSubject = (id) => {
    subjectsApi.remove(id);
    setTimetable((l) => l.filter((t) => t.subjectId !== id));
  };
  const removeClass = (id) => {
    classesApi.remove(id);
    setTimetable((l) => l.filter((t) => t.classId !== id));
  };

  // ---------- Attendance ----------
  const findSession = useCallback(
    (classId, date, slot) => sessions.find((s) => s.classId === classId && s.date === date && s.slot === Number(slot)),
    [sessions],
  );

  /** Create or update a lecture's attendance. Returns { created }. */
  const saveSession = useCallback(
    ({ classId, subjectId, facultyId, date, slot, records }, actor) => {
      const id = `${classId}_${date}_${slot}`;
      const existing = sessions.find((s) => s.id === id);
      const now = Date.now();

      // Detect students that newly fall below the threshold because of this save
      const dropped = [];
      for (const sid in records) {
        const before = summarize(stats.byStudent[sid] || emptyCounts(), settings);
        const after = { ...(stats.byStudent[sid] || emptyCounts()) };
        if (existing?.records[sid]) after[existing.records[sid]]--;
        after[records[sid]]++;
        const a = summarize(after, settings);
        if ((before.pct == null || before.pct >= settings.threshold) && a.pct != null && a.pct < settings.threshold) dropped.push(sid);
      }

      const session = existing
        ? { ...existing, subjectId, facultyId, records, updatedBy: actor.name, updatedAt: now }
        : { id, classId, subjectId, facultyId, date, slot: Number(slot), records, markedBy: actor.name, markedAt: now };
      if (existing) {
        const edits = { ...(existing.edits || {}) };
        for (const sid in records) {
          if (existing.records[sid] && existing.records[sid] !== records[sid]) {
            edits[sid] = { from: edits[sid]?.from || existing.records[sid], to: records[sid], by: actor.name, at: now, reason: 'Updated from Mark Attendance' };
          }
        }
        session.edits = edits;
      }
      setSessions((list) => (existing ? list.map((s) => (s.id === id ? session : s)) : [...list, session]));

      const cls = maps.classesById[classId];
      const sub = maps.subjectsById[subjectId];
      const present = Object.values(records).filter((v) => v === 'P').length;
      if (settings.notifyUpdates) {
        notify({
          type: existing ? 'update' : 'attendance',
          title: existing ? 'Attendance updated' : 'Attendance successfully marked',
          message: `${sub?.name} · ${classLabel(cls)} — ${present} of ${Object.keys(records).length} students present.`,
        });
      }
      if (settings.notifyLowAttendance && dropped.length) {
        const names = dropped.slice(0, 3).map((sid) => maps.studentsById[sid]?.name).filter(Boolean);
        notify({
          type: 'alert',
          title: 'Low attendance warning',
          message: `${names.join(', ')}${dropped.length > 3 ? ` and ${dropped.length - 3} more` : ''} dropped below ${settings.threshold}%.`,
          audience: ['admin', 'faculty'],
        });
        dropped.forEach((sid) => {
          if (maps.studentsById[sid]?.email === 'student@attendease.com')
            notify({ type: 'alert', title: `Your attendance dropped below ${settings.threshold}%`, message: `${sub?.name}: attend upcoming lectures to recover.`, audience: ['student'] });
        });
      }
      return { created: !existing, dropped: dropped.length };
    },
    [sessions, stats, settings, maps, notify, setSessions],
  );

  /** Edit one student's status within an existing session. */
  const updateRecord = useCallback(
    (sessionId, studentId, status, actor, reason = '') => {
      const now = Date.now();
      let prev;
      setSessions((list) =>
        list.map((s) => {
          if (s.id !== sessionId) return s;
          prev = s.records[studentId];
          const original = s.edits?.[studentId]?.from || prev;
          return {
            ...s,
            records: { ...s.records, [studentId]: status },
            edits: { ...(s.edits || {}), [studentId]: { from: original, to: status, by: actor.name, at: now, reason } },
            updatedBy: actor.name,
            updatedAt: now,
          };
        }),
      );
      const st = maps.studentsById[studentId];
      const sess = sessions.find((s) => s.id === sessionId);
      if (settings.notifyUpdates && sess) {
        notify({
          type: 'update',
          title: 'Attendance updated',
          message: `${actor.name} changed ${st?.name} from ${STATUS[sess.records[studentId]]?.label} to ${STATUS[status].label} in ${maps.subjectsById[sess.subjectId]?.name}.`,
        });
      }
    },
    [sessions, maps, settings, notify, setSessions],
  );

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [setSettings]);
  const updateUser = useCallback((id, patch) => setUsers((l) => l.map((u) => (u.id === id ? { ...u, ...patch } : u))), [setUsers]);

  const resetDemo = useCallback(() => {
    clearAll();
    window.location.reload();
  }, []);

  const value = {
    departments,
    faculty,
    subjects,
    classes,
    timetable,
    students,
    sessions,
    users,
    notifications,
    settings,
    ...maps,
    stats,
    studentSummary,
    students$: { ...studentsApi },
    faculty$: { ...facultyApi, remove: removeFaculty },
    departments$: departmentsApi,
    classes$: { ...classesApi, remove: removeClass },
    subjects$: { ...subjectsApi, remove: removeSubject },
    findSession,
    saveSession,
    updateRecord,
    notify,
    markRead,
    markAllRead,
    removeNotification,
    updateSettings,
    updateUser,
    setTimetable,
    resetDemo,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
