import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, BookOpen, GraduationCap, UserCheck, TriangleAlert, ClipboardCheck, ClipboardList, Clock, MapPin, ArrowRight, Coffee, Activity, CircleCheck, PencilLine } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { PercentBarChart, TrendLineChart } from '../../components/Charts/Charts';
import { lectureStatus, LectureStateBadge } from '../../components/Timetable/TimetableGrid';
import ActivityFeed from './ActivityFeed';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useScope } from '../../hooks/useScope';
import { useLowAttendance } from '../../hooks/useLowAttendance';
import { useLoading } from '../../hooks/useLoading';
import { summarize, tally, dailySeries, slotById, emptyCounts } from '../../utils/attendance';
import { todayISO, weekdayOf, greeting, formatDate, addDays, formatTime } from '../../utils/date';
import { fmtPct, fmtNumber } from '../../utils/format';

export default function FacultyDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { timetable, classesById, subjectsById, settings, findSession } = useData();
  const scope = useScope();
  const low = useLowAttendance();
  const loading = useLoading(450);
  const today = todayISO();
  const wd = weekdayOf(today);

  const mine = useMemo(() => tally(scope.sessions, { classesById }), [scope.sessions, classesById]);
  const overall = summarize(mine.overall, settings);

  const todays = useMemo(
    () =>
      timetable
        .filter((t) => t.day === wd && scope.subjectIds.has(t.subjectId))
        .sort((a, b) => a.slot - b.slot)
        .map((t) => {
          const session = findSession(t.classId, today, t.slot);
          const vals = session ? Object.values(session.records) : [];
          return {
            ...t,
            cls: classesById[t.classId],
            subject: subjectsById[t.subjectId],
            slotInfo: slotById(t.slot),
            session,
            present: vals.filter((v) => v === 'P').length,
            total: vals.length,
            state: session ? 'done' : lectureStatus(wd, t.slot, false),
          };
        }),
    [timetable, wd, scope.subjectIds, findSession, today, classesById, subjectsById],
  );

  const subjectData = scope.subjects.map((s) => ({
    name: s.name.length > 16 ? s.name.slice(0, 15) + '…' : s.name,
    full: s.name,
    pct: +(summarize(mine.bySubject[s.id] || emptyCounts(), settings).pct ?? 0).toFixed(1),
  }));
  const trend = dailySeries(mine.byDate, settings, { from: addDays(today, -20), to: today });
  const marked = todays.filter((t) => t.session).length;
  const lowStudents = new Set(low.map((l) => l.student.id)).size;
  const surname = user.name.split(' ').slice(-1)[0];

  if (loading) return <PageSkeleton />;

  const markLink = (t) => `/attendance/mark?class=${t.classId}&subject=${t.subjectId}&date=${today}&slot=${t.slot}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatDate(today, { weekday: 'long' })}
        title={`${greeting()}, Prof. ${surname} 👋`}
        description={todays.length ? `You have ${todays.length} lecture${todays.length > 1 ? 's' : ''} today — ${marked} marked, ${todays.length - marked} remaining.` : 'No lectures scheduled for you today.'}
        actions={
          <>
            <Link to="/attendance/records" className="btn btn-secondary">
              <ClipboardList className="h-4 w-4" /> View Attendance
            </Link>
            <Link to="/attendance/mark" className="btn btn-primary">
              <ClipboardCheck className="h-4 w-4" /> Mark Attendance
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarClock} label="Lectures Today" value={todays.length} trend={{ text: `${marked} marked` }} hint={`${todays.length - marked} still to mark`} onClick={() => navigate('/timetable')} />
        <StatCard icon={BookOpen} label="Subjects Assigned" value={scope.subjects.length} trend={{ text: `${scope.classes.length} classes` }} hint={profile?.department} onClick={() => navigate('/subjects')} />
        <StatCard icon={UserCheck} label="Avg. Attendance (my lectures)" value={fmtPct(overall.pct)} trend={{ text: `${fmtNumber(mine.sessionCount)} lectures` }} hint="Across all assigned subjects" onClick={() => navigate('/reports')} />
        <StatCard icon={TriangleAlert} tone="danger" label="Students Below Threshold" value={lowStudents} trend={{ text: `< ${settings.threshold}%` }} hint="In at least one of your subjects" onClick={() => navigate('/alerts')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Today’s Classes" subtitle={formatDate(today, { weekday: 'long' })} icon={CalendarClock} bodyClassName="p-4">
          {todays.length === 0 ? (
            <EmptyState icon={Coffee} title="No lectures today" message="Enjoy the free day — or use Mark Attendance to record an extra lecture." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {todays.map((t) => (
                <div key={t.id} className={`card-hover rounded-xl border p-4 ${t.state === 'live' ? 'border-brand bg-brand-softer' : 'border-line bg-surface'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-ink">{t.subject?.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-brand">
                        {t.cls?.course} · Sem {t.cls?.semester} · Div {t.cls?.division}
                      </p>
                    </div>
                    <LectureStateBadge state={t.state} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(t.slotInfo.start)} – {formatTime(t.slotInfo.end)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {t.room}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                    {t.session ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-present">
                        <CircleCheck className="h-4 w-4" /> {t.present}/{t.total} present
                      </span>
                    ) : (
                      <span className="text-xs text-ink-3">Attendance not marked</span>
                    )}
                    <Link to={markLink(t)} className={`btn btn-sm ${t.session ? 'btn-outline' : 'btn-primary'}`}>
                      {t.session ? <PencilLine className="h-3.5 w-3.5" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                      {t.session ? 'Edit' : 'Mark'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Quick Actions" bodyClassName="p-3">
          <div className="space-y-2">
            {[
              { to: '/attendance/mark', icon: ClipboardCheck, t: 'Mark Attendance', d: 'Record a lecture roll call' },
              { to: '/attendance/records', icon: ClipboardList, t: 'View Attendance', d: 'Browse and edit past records' },
              { to: '/students', icon: GraduationCap, t: 'View Students', d: `${scope.students.length} students in your classes` },
              { to: '/reports', icon: BookOpen, t: 'Subject Reports', d: 'Summaries with CSV export' },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="group flex items-center gap-3 rounded-xl border border-line p-3 transition-all hover:border-brand/40 hover:bg-brand-softer">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand transition-transform group-hover:scale-105">
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{a.t}</span>
                  <span className="block truncate text-xs text-ink-3">{a.d}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="My Subjects" subtitle="Average attendance in lectures you teach">
          <PercentBarChart data={subjectData} threshold={settings.threshold} height={260} />
        </Card>
        <Card title="Attendance Trend" subtitle="Your lectures · last 3 weeks">
          <TrendLineChart data={trend} series={['Present', 'Absent']} height={236} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Students Needing Attention"
          subtitle="Lowest attendance in your subjects"
          bodyClassName="p-0"
          actions={
            <Link to="/alerts" className="btn btn-ghost btn-sm text-brand">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {low.length === 0 ? (
            <EmptyState compact title="Everyone is above the threshold" message="No student in your subjects is below the minimum attendance." />
          ) : (
            <ul className="divide-y divide-line">
              {low.slice(0, 5).map((r) => (
                <li key={r.id} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-hover" onClick={() => navigate(`/students/${r.student.id}`)}>
                  <Avatar name={r.student.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{r.student.name}</p>
                    <p className="truncate text-xs text-ink-3">
                      {r.subject?.name} · {r.cls?.course} Sem {r.cls?.semester} {r.cls?.division}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger tabular-nums">{fmtPct(r.pct)}</p>
                    <p className="text-[11px] text-ink-3">needs {r.needed} more</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent Activity" icon={Activity} bodyClassName="p-3">
          <ActivityFeed sessions={scope.sessions} limit={6} />
        </Card>
      </div>
    </div>
  );
}
