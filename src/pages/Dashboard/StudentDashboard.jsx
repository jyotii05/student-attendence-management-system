import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, CircleCheck, CircleX, Layers, TriangleAlert, ArrowRight, CalendarDays, Clock, MapPin, Coffee, History } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import ProgressRing from '../../components/ui/ProgressRing';
import EmptyState from '../../components/ui/EmptyState';
import { StandingBadge, StatusBadge } from '../../components/ui/Badge';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { PercentBarChart, AreaTrendChart } from '../../components/Charts/Charts';
import { lectureStatus, LectureStateBadge } from '../../components/Timetable/TimetableGrid';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLoading } from '../../hooks/useLoading';
import { summarize, standing, classesNeeded, canSkip, monthlySeries, weeklySeries, slotById } from '../../utils/attendance';
import { greeting, todayISO, weekdayOf, formatDate, formatShortDate } from '../../utils/date';
import { fmtPct, classLabel } from '../../utils/format';
import { studentEntries, subjectBreakdown } from '../../utils/selectors';

export default function StudentDashboard() {
  const { profile: me } = useAuth();
  const { stats, settings, subjects, sessions, subjectsById, facultyById, timetable, classesById, findSession } = useData();
  const loading = useLoading(450);
  const today = todayISO();

  const data = useMemo(() => {
    if (!me) return null;
    const sum = summarize(stats.byStudent[me.id] || { P: 0, A: 0 }, settings);
    const bySubject = subjectBreakdown(me, stats, subjects, settings);
    const entries = studentEntries(me, sessions, subjectsById, facultyById);
    const byDate = {};
    for (const e of entries) {
      const c = (byDate[e.date] ||= { P: 0, A: 0 });
      c[e.status]++;
    }
    return { sum, bySubject, entries, monthly: monthlySeries(byDate, settings).map((m) => ({ name: m.label, pct: m.Attendance })), weekly: weeklySeries(byDate, settings) };
  }, [me, stats, settings, subjects, sessions, subjectsById, facultyById]);

  if (!me) return <EmptyState title="Student profile not found" message="Your account isn’t linked to a student record. Please contact the administrator." />;
  if (loading || !data) return <PageSkeleton />;

  const { sum, bySubject, entries, monthly, weekly } = data;
  const t = settings.threshold;
  const atRisk = bySubject.filter((s) => s.pct != null && s.pct < t);
  const wd = weekdayOf(today);
  const todays = timetable.filter((x) => x.classId === me.classId && x.day === wd).sort((a, b) => a.slot - b.slot);
  const cls = classesById[me.classId];
  const first = me.name.split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatDate(today, { weekday: 'long' })}
        title={`${greeting()}, ${first} 👋`}
        description={`${classLabel(cls)} · Roll No ${me.rollNo}`}
        actions={
          <>
            <Link to="/calendar" className="btn btn-secondary">
              <CalendarDays className="h-4 w-4" /> Calendar
            </Link>
            <Link to="/my-attendance" className="btn btn-primary">
              <UserCheck className="h-4 w-4" /> My Attendance
            </Link>
          </>
        }
      />

      {atRisk.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-danger shadow-card">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Attendance warning</p>
            <p className="text-sm text-ink-2">
              You are below {t}% in{' '}
              {atRisk.map((s, i) => (
                <span key={s.subject.id}>
                  <b className="text-danger">
                    {s.subject.name} ({fmtPct(s.pct)})
                  </b>
                  {i < atRisk.length - 1 ? ', ' : ''}
                </span>
              ))}
              . Attend the next {Math.max(...atRisk.map((s) => classesNeeded(s.attended, s.total, t)))} lectures without absence to recover.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserCheck} tone={sum.pct != null && sum.pct < t ? 'danger' : 'brand'} label="Overall Attendance" value={fmtPct(sum.pct)} trend={{ text: standing(sum.pct, t) === 'good' ? 'Good standing' : standing(sum.pct, t) === 'warning' ? 'Close to limit' : 'Below minimum' }} hint={`Minimum required: ${t}%`} />
        <StatCard icon={CircleCheck} label="Classes Attended" value={sum.attended} trend={{ text: `of ${sum.total}` }} hint={`${sum.P} lectures present`} />
        <StatCard icon={CircleX} tone="danger" label="Classes Missed" value={sum.missed} trend={{ text: `${sum.A} absent` }} hint={`${sum.total} lectures conducted`} />
        <StatCard icon={Layers} label="Current Semester" value={`Semester ${me.semester}`} trend={{ text: `Div ${me.division}` }} hint={`${me.course} · ${me.department}`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Subject Attendance" subtitle="Your standing in each subject this semester" className="xl:col-span-2" bodyClassName="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {bySubject.map((s) => {
              const st = standing(s.pct, t);
              const need = classesNeeded(s.attended, s.total, t);
              const skip = canSkip(s.attended, s.total, t);
              return (
                <div key={s.subject.id} className={`card-hover rounded-xl border p-4 ${st === 'low' ? 'border-danger/30' : 'border-line'} bg-surface`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{s.subject.name}</p>
                      <p className="text-[11px] text-ink-3">
                        {s.subject.code} · {facultyById[s.subject.facultyId]?.name || 'Unassigned'}
                      </p>
                    </div>
                    <p className={`text-xl font-extrabold tracking-tight tabular-nums ${st === 'low' ? 'text-danger' : 'text-brand-900 dark:text-blue-200'}`}>{fmtPct(s.pct, 0)}</p>
                  </div>
                  <ProgressBar value={s.pct} threshold={t} className="mt-3" height="h-2" />
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-ink-3">
                      {s.attended}/{s.total} lectures
                    </span>
                    <StandingBadge standing={st} />
                  </div>
                  <p className={`mt-2 text-[11px] ${st === 'low' ? 'font-semibold text-danger' : 'text-ink-3'}`}>
                    {s.total === 0 ? 'No lectures yet' : need > 0 ? `Attend next ${need} lecture${need > 1 ? 's' : ''} to reach ${t}%` : `You can miss up to ${skip} lecture${skip === 1 ? '' : 's'} and stay above ${t}%`}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Overall" subtitle="Attendance summary" bodyClassName="p-5">
          <div className="flex flex-col items-center">
            <ProgressRing value={sum.pct} threshold={t} size={168} stroke={14} label="Overall attendance" />
            <div className="mt-5 grid w-full grid-cols-2 gap-2">
              {[
                ['P', sum.P],
                ['A', sum.A],
              ].map(([k, n]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                  <StatusBadge status={k} size="sm" />
                  <span className="text-sm font-bold text-ink tabular-nums">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Monthly Attendance" subtitle="Attendance % per month">
          <PercentBarChart data={monthly} threshold={t} height={240} barSize={48} />
        </Card>
        <Card title="Subject-wise Attendance" subtitle="Bars below the minimum turn red">
          <PercentBarChart data={bySubject.map((s) => ({ name: s.subject.name.length > 18 ? s.subject.name.slice(0, 17) + '…' : s.subject.name, pct: +(s.pct ?? 0).toFixed(1) }))} threshold={t} height={240} layout="horizontal" />
        </Card>
        <Card title="Attendance Trend" subtitle="Weekly attendance rate">
          <AreaTrendChart data={weekly} threshold={t} height={240} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card
          title="Today’s Timetable"
          subtitle={formatDate(today, { weekday: 'long' })}
          icon={Clock}
          bodyClassName="p-4"
          actions={
            <Link to="/timetable" className="btn btn-ghost btn-sm text-brand">
              Full week <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {todays.length === 0 ? (
            <EmptyState compact icon={Coffee} title="No lectures today" message="Enjoy your day off!" />
          ) : (
            <ul className="space-y-2">
              {todays.map((x) => {
                const s = slotById(x.slot);
                const sub = subjectsById[x.subjectId];
                const sess = findSession(x.classId, today, x.slot);
                const state = sess ? 'done' : lectureStatus(wd, x.slot);
                return (
                  <li key={x.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-xs font-bold text-ink">{s.start}</p>
                      <p className="text-[10px] text-ink-3">{s.end}</p>
                    </div>
                    <div className="h-9 w-px bg-line" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{sub?.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-ink-3">
                        {facultyById[sub?.facultyId]?.name} · <MapPin className="h-3 w-3" /> {x.room}
                      </p>
                    </div>
                    {sess ? <StatusBadge status={sess.records[me.id]} size="sm" /> : <LectureStateBadge state={state} />}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Recent Attendance"
          icon={History}
          bodyClassName="p-0"
          actions={
            <Link to="/my-attendance" className="btn btn-ghost btn-sm text-brand">
              History <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {entries.length === 0 ? (
            <EmptyState compact title="No attendance records yet" />
          ) : (
            <ul className="divide-y divide-line">
              {entries.slice(0, 6).map((e) => (
                <li key={e.sessionId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{e.subject}</p>
                    <p className="text-xs text-ink-3">
                      {formatShortDate(e.date)} · Lecture {e.slot} · {e.faculty}
                    </p>
                  </div>
                  <StatusBadge status={e.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
