import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, UsersRound, UserCheck, TriangleAlert, Building2, School, ClipboardCheck, FileChartColumn, ArrowRight, Activity } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard/StatCard';
import Segmented from '../../components/ui/Segmented';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { TrendLineChart, PercentBarChart, DonutChart } from '../../components/Charts/Charts';
import ActivityFeed from './ActivityFeed';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLowStudents } from '../../hooks/useLowAttendance';
import { useLoading } from '../../hooks/useLoading';
import { summarize, dailySeries, distribution, tally, emptyCounts } from '../../utils/attendance';
import { addDays, todayISO, greeting, formatDate, weekdayOf } from '../../utils/date';
import { fmtNumber, fmtPct } from '../../utils/format';
import { latestDates, weekOverWeek } from '../../utils/selectors';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: 'Semester' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { students, faculty, departments, classes, timetable, sessions, stats, settings, classesById, subjectsById } = useData();
  const lowStudents = useLowStudents();
  const loading = useLoading(500);
  const [range, setRange] = useState(7);
  const today = todayISO();

  const kpi = useMemo(() => {
    const { last, prev } = latestDates(stats.byDate);
    const lastPct = last ? summarize(stats.byDate[last], settings).pct : null;
    const prevPct = prev ? summarize(stats.byDate[prev], settings).pct : null;

    const acad = Math.max(...students.map((s) => s.admissionYear));
    const intake = students.filter((s) => s.admissionYear === acad).length;

    // Low attendance a week ago, to show direction of travel
    const weekAgo = addDays(today, -7);
    const past = tally(
      sessions.filter((s) => s.date <= weekAgo),
      {},
    );
    const lowBefore = students.filter((s) => {
      const p = summarize(past.byStudent[s.id] || emptyCounts(), settings).pct;
      return p != null && p < settings.threshold;
    }).length;

    const wd = weekdayOf(today);
    const lecturesToday = timetable.filter((t) => t.day === wd).length;
    const markedToday = sessions.filter((s) => s.date === today).length;

    const onDuty = new Set(timetable.filter((t) => t.day === wd).map((t) => subjectsById[t.subjectId]?.facultyId).filter(Boolean)).size;
    const wow = weekOverWeek(stats.byDate, settings);

    return {
      last,
      lastPct,
      delta: lastPct != null && prevPct != null ? lastPct - prevPct : null,
      intake,
      // Growth of the student body from this year's admissions
      intakeDelta: students.length > intake ? (intake / (students.length - intake)) * 100 : null,
      lowBefore,
      lecturesToday,
      markedToday,
      onDuty,
      wow,
    };
  }, [stats, settings, students, sessions, timetable, today, subjectsById]);

  const trend = useMemo(() => dailySeries(stats.byDate, settings, { from: addDays(today, -(range - 1)), to: today }), [stats, settings, range, today]);

  const deptData = useMemo(
    () =>
      departments
        .map((d) => ({ name: d.course, full: d.name, pct: +(summarize(stats.byDept[d.name] || emptyCounts(), settings).pct ?? 0).toFixed(1) }))
        .filter((d) => stats.byDept[d.full]),
    [departments, stats, settings],
  );

  const classPerf = useMemo(
    () =>
      classes
        .map((c) => ({ cls: c, ...summarize(stats.byClass[c.id] || emptyCounts(), settings) }))
        .filter((c) => c.pct != null)
        .sort((a, b) => b.pct - a.pct),
    [classes, stats, settings],
  );

  const overall = summarize(stats.overall, settings);
  const isToday = kpi.last === today;
  const lowDelta = kpi.lowBefore ? ((lowStudents.length - kpi.lowBefore) / kpi.lowBefore) * 100 : null;

  if (loading) return <PageSkeleton stats={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatDate(today, { weekday: 'long' })}
        title={`${greeting()}, ${user.name.split(' ').slice(-2, -1)[0] || user.name} 👋`}
        description="Here’s what’s happening with attendance across the college today."
        actions={
          <>
            <Link to="/reports" className="btn btn-secondary">
              <FileChartColumn className="h-4 w-4" /> Reports
            </Link>
            <Link to="/attendance/mark" className="btn btn-primary">
              <ClipboardCheck className="h-4 w-4" /> Mark Attendance
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={GraduationCap} label="Total Students" value={fmtNumber(students.length)} trend={{ value: kpi.intakeDelta, label: `+${kpi.intake} new admissions this academic year` }} onClick={() => navigate('/students')} />
        <StatCard icon={UsersRound} label="Faculty Members" value={fmtNumber(faculty.filter((f) => f.status === 'Active').length)} trend={{ text: `${kpi.onDuty} on duty today`, label: `${kpi.onDuty} faculty have lectures today` }} onClick={() => navigate('/faculty')} />
        <StatCard
          icon={UserCheck}
          label={isToday ? 'Today’s Attendance' : 'Latest Attendance'}
          value={fmtPct(kpi.lastPct)}
          trend={{ value: kpi.delta, label: isToday ? 'vs previous working day' : `Last recorded ${kpi.last ? formatDate(kpi.last) : '—'}` }}
          onClick={() => navigate('/attendance/records')}
        />
        <StatCard
          icon={TriangleAlert}
          tone="danger"
          label="Low Attendance Students"
          value={fmtNumber(lowStudents.length)}
          trend={{ value: lowDelta, goodWhenUp: false, label: `Below ${settings.threshold}% · vs last week` }}
          onClick={() => navigate('/alerts')}
        />
        <StatCard icon={Building2} label="Total Departments" value={fmtNumber(departments.length)} trend={{ value: kpi.wow.delta, label: 'Avg attendance vs last week', unit: ' pts' }} onClick={() => navigate('/departments')} />
        <StatCard icon={School} label="Classes Today" value={fmtNumber(kpi.lecturesToday)} trend={{ text: `${kpi.markedToday} marked`, label: `${kpi.markedToday} of ${kpi.lecturesToday} lectures marked so far` }} onClick={() => navigate('/timetable')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Attendance Overview"
          subtitle="Share of marked students per day — Present and Absent"
          actions={<Segmented size="sm" options={RANGES} value={range} onChange={setRange} />}
        >
          <TrendLineChart data={trend} series={['Present', 'Absent']} height={290} />
        </Card>
        <Card title="Attendance Distribution" subtitle="All lectures this semester">
          <DonutChart data={distribution(stats.overall)} centerValue={fmtPct(overall.pct)} centerLabel="Overall attendance" height={200} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Department Attendance" subtitle={`Average attendance by department · bars below ${settings.threshold}% turn red`} actions={<Link to="/analytics" className="btn btn-ghost btn-sm text-brand">Analytics <ArrowRight className="h-3.5 w-3.5" /></Link>}>
          <PercentBarChart data={deptData} threshold={settings.threshold} height={280} />
        </Card>
        <Card title="Recent Activity" subtitle="Live from attendance records" icon={Activity} bodyClassName="p-3">
          <ActivityFeed sessions={sessions} lowCount={lowStudents.length} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Low Attendance Alerts"
          subtitle={`Students whose overall attendance is below ${settings.threshold}%`}
          bodyClassName="p-0"
          actions={
            <Link to="/alerts" className="btn btn-ghost btn-sm text-brand">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {lowStudents.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-3">No students are below the threshold. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base min-w-[560px]">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Attended</th>
                    <th className="w-48">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStudents.slice(0, 6).map((r) => {
                    const c = classesById[r.student.classId];
                    return (
                      <tr key={r.student.id} className="cursor-pointer" onClick={() => navigate(`/students/${r.student.id}`)}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={r.student.name} size="sm" />
                            <div>
                              <p className="font-semibold text-ink">{r.student.name}</p>
                              <p className="text-[11px] text-ink-3">{r.student.rollNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-ink-2">
                          {c?.course} · Sem {c?.semester} {c?.division}
                        </td>
                        <td className="text-ink-2 tabular-nums">
                          {r.attended}/{r.total}
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <ProgressBar value={r.pct} threshold={settings.threshold} className="flex-1" />
                            <span className="w-12 text-right text-xs font-bold text-danger tabular-nums">{fmtPct(r.pct)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Class Performance" subtitle="Average attendance per class" bodyClassName="p-4">
          <ul className="space-y-3">
            {classPerf.map((c) => (
              <li key={c.cls.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">
                    {c.cls.course} <span className="font-medium text-ink-3">· Sem {c.cls.semester} {c.cls.division}</span>
                  </span>
                  <span className={`font-bold tabular-nums ${c.pct < settings.threshold ? 'text-danger' : 'text-ink'}`}>{fmtPct(c.pct)}</span>
                </div>
                <ProgressBar value={c.pct} threshold={settings.threshold} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
