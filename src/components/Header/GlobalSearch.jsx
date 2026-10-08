import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GraduationCap, UsersRound, School, BookOpen, SearchX, ArrowRight, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useScope } from '../../hooks/useScope';
import { useClickOutside } from '../../hooks/useClickOutside';
import { classLabel } from '../../utils/format';

const GROUPS = [
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'faculty', label: 'Faculty', icon: UsersRound },
  { key: 'classes', label: 'Classes', icon: School },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
];

function highlight(text, q) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-brand-soft px-0.5 text-brand-600 dark:text-blue-300">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function GlobalSearch({ mobile, onClose }) {
  const { role } = useAuth();
  const { faculty, facultyById } = useData();
  const scope = useScope();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(!!mobile);
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const input = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);
  useClickOutside(wrap, close, open);

  // Ctrl/⌘ + K focuses search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (mobile) input.current?.focus();
  }, [mobile]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...vals) => vals.some((v) => String(v ?? '').toLowerCase().includes(term));
    const out = [];
    if (role !== 'student') {
      scope.students
        .filter((s) => has(s.name, s.id, s.rollNo, s.email))
        .slice(0, 6)
        .forEach((s) => out.push({ group: 'students', id: s.id, title: s.name, sub: `${s.id} · ${s.course} Sem ${s.semester} ${s.division}`, to: `/students/${s.id}`, avatar: s.name }));
      faculty
        .filter((f) => has(f.name, f.id, f.department, f.email))
        .slice(0, 4)
        .forEach((f) => out.push({ group: 'faculty', id: f.id, title: f.name, sub: `${f.designation} · ${f.department}`, to: `/faculty/${f.id}`, avatar: f.name }));
      scope.classes
        .filter((c) => has(classLabel(c), c.course, c.department, `sem ${c.semester}`, c.room))
        .slice(0, 4)
        .forEach((c) => out.push({ group: 'classes', id: c.id, title: classLabel(c), sub: `${c.department} · Room ${c.room}`, to: `/classes?highlight=${c.id}` }));
    }
    scope.subjects
      .filter((s) => has(s.name, s.code, s.course))
      .slice(0, 5)
      .forEach((s) => out.push({ group: 'subjects', id: s.id, title: s.name, sub: `${s.code} · ${s.course} Sem ${s.semester} · ${facultyById[s.facultyId]?.name || 'Unassigned'}`, to: `/subjects?q=${encodeURIComponent(s.code)}` }));
    return out;
  }, [q, role, scope, faculty, facultyById]);

  useEffect(() => setActive(0), [q]);

  const go = (r) => {
    navigate(r.to);
    setQ('');
    close();
    input.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  const showPanel = open && q.trim().length >= 2;

  return (
    <div ref={wrap} className={`relative ${mobile ? 'w-full' : 'w-full max-w-md'}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={role === 'student' ? 'Search subjects…' : 'Search students, faculty, classes, subjects…'}
          className="input h-10 bg-surface-2 pr-16 pl-9"
          aria-label="Global search"
          role="combobox"
          aria-expanded={showPanel}
        />
        {mobile ? (
          <button onClick={close} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-3" aria-label="Close search">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-3 sm:block">
            Ctrl K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div className="animate-pop absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-pop">
          {results.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <SearchX className="h-8 w-8 text-ink-3" />
              <p className="mt-2 text-sm font-semibold text-ink">No results for “{q}”</p>
              <p className="text-xs text-ink-3">Try a name, student ID, roll number or subject code.</p>
            </div>
          ) : (
            GROUPS.map((g) => {
              const items = results.filter((r) => r.group === g.key);
              if (!items.length) return null;
              const Icon = g.icon;
              return (
                <div key={g.key} className="mb-1 last:mb-0">
                  <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[10.5px] font-bold tracking-wider text-ink-3 uppercase">
                    <Icon className="h-3.5 w-3.5" /> {g.label}
                  </p>
                  {items.map((r) => {
                    const idx = results.indexOf(r);
                    return (
                      <button
                        key={r.group + r.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(r)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${idx === active ? 'bg-brand-soft' : 'hover:bg-hover'}`}
                      >
                        {r.avatar ? (
                          <Avatar name={r.avatar} size="sm" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-2">
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{highlight(r.title, q.trim())}</span>
                          <span className="block truncate text-xs text-ink-3">{r.sub}</span>
                        </span>
                        {idx === active && <ArrowRight className="h-4 w-4 text-brand" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
