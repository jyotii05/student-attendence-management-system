import { useMemo, useState } from 'react';
import { ChartNoAxesCombined, Trophy, TrendingDown, CalendarDays, Percent, BookOpen, ClipboardList } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Segmented from '../../components/ui/Segmented';
import StatCard from '../../components/StatCard/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { Input, Select } from '../../components/ui/Field';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { TrendLineChart, PercentBarChart, DonutChart, AreaTrendChart, StackedCountChart } from '../../components/Charts/Charts';
import { useData } from '../../context/DataContext';
import { useLoading } from '../../hooks/useLoading';
import { tally, summarize, dailySeries, monthlySeries, weeklySeries, weekdaySeries, distribution, LECTURE_SLOTS, emptyCounts } from '../../utils/attendance';
import { todayISO, addDays, startOfWeek, startOfMonth, formatDate } from '../../utils/date';
import { fmtPct, fmtNumber } from '../../utils/format';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'semester', label: 'This semester' },
  { value: 'custom', label: 'Custom range' },
];

export default function Analytics() {
  const { sessions, students, departments, subjectsById, classesById, settings } = useData();
  const today = todayISO();
  const termStart = settings.termStart || addDays(today, -70);
  const [range, setRange] = useState('semester');
  const [custom, setCustom] = useState({ from: addDays(today, -13), to: today });
  const [dept, setDept] = useState('');
  const [subjectView, setSubjectView] = useState('lowest');
  const loading = useLoading(550, [range, dept]);
  const t = settings.threshold;

  const { from, to } = useMemo(() => {
    if (range === 'today') return { from: today, to: today };
    if (range === 'week') return { from: startOfWeek(today), to: today };
    if (range === 'month') return { from: startOfMonth(today), to: today };
    if (range === 'custom') return custom;
    return { from: termStart, to: today };
  }, [range, custom, today, termStart]);

  const live = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const inDept = (s) => !dept || classesById[s.classId]?.department === dept;

  const a = useMemo(() => {
    const ss = sessions.filter((s) => s.date >= from && s.date <= to && inDept(s));
    const tl = tally(ss, { classesById, studentIds: live });
    const semester = tally(
      sessions.filter((s) => s.date >= termStart && inDept(s)),
      { classesById, studentIds: live },
    );
    const sum = summarize(tl.overall, settings);

    // Single day → show the day lecture by lecture
    let trend;
    if (from === to) {
      const bySlot = {};
      ss.forEach((s) => {
        const c = (bySlot[s.slot] ||= emptyCounts());
        for (const sid in s.records) if (live.has(sid)) c[s.records[sid]]++;
      });
      trend = LECTURE_SLOTS.filter((sl) => bySlot[sl.id]).map((sl) => {
        const c = bySlot[sl.id];
        const n = c.P + c.A || 1;
        return { label: `L${sl.id} ${sl.start}`, Attendance: +(summarize(c, settings).pct ?? 0).toFixed(1), Absent: +((c.A / n) * 100).toFixed(1), Present: +((c.P / n) * 100).toFixed(1) };
      });
    } else trend = dailySeries(tl.byDate, settings);

    const deptData = departments
      .filter((d) => tl.byDept[d.name])
      .map((d) => ({ name: d.course, pct: +(summarize(tl.byDept[d.name], settings).pct ?? 0).toFixed(1) }));
    const subjData = Object.entries(tl.bySubject)
      .map(([id, c]) => ({ name: subjectsById[id]?.name || id, label: `${subjectsById[id]?.name} (${subjectsById[id]?.course} ${subjectsById[id]?.semester})`, pct: +(summarize(c, settings).pct ?? 0).toFixed(1) }))
      .sort((x, y) => x.pct - y.pct);
    const months = monthlySeries(semester.byDate, settings);
    const monthly = months.length >= 3 ? months : weeklySeries(semester.byDate, settings);
    const weekly = weeklySeries(tl.byDate, settings).map((w) => ({ ...w }));

    const bestDept = [...deptData].sort((x, y) => y.pct - x.pct)[0];
    const worstSubj = subjData[0];
    const weekdays = weekdaySeries(tl.byDate, settings);
    const bestDay = [...weekdays].sort((x, y) => y.Attendance - x.Attendance)[0];

    return { tl, sum, trend, deptData, subjData, monthly, monthlyIsWeekly: months.length < 3, weekly, bestDept, worstSubj, weekdays, bestDay };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, from, to, dept, classesById, live, settings, departments, subjectsById, termStart]);

  const subjShown = (subjectView === 'lowest' ? a.subjData.slice(0, 10) : [...a.subjData].reverse().slice(0, 10)).map((s) => ({ ...s, name: s.name.length > 22 ? s.name.slice(0, 21) + '…' : s.name }));

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance Analytics" description={`Insights for ${formatDate(from)}${from !== to ? ` – ${formatDate(to)}` : ''}${dept ? ` · ${dept}` : ' · All departments'}`} />

      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented options={RANGES} value={range} onChange={setRange} />
        <div className="flex flex-wrap items-center gap-2">
          {range === 'custom' && (
            <>
              <Input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="w-40" aria-label="From" />
              <span className="text-xs text-ink-3">to</span>
              <Input type="date" value={custom.to} min={custom.from} max={today} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="w-40" aria-label="To" />
            </>
          )}
          <div className="w-56">
            <Select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : a.tl.sessionCount === 0 ? (
        <div className="card">
          <EmptyState icon={ChartNoAxesCombined} title="No attendance in this range" message={range === 'today' ? 'No lectures have been marked today yet.' : 'Choose a different range or department.'} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Percent} label="Overall attendance" value={fmtPct(a.sum.pct)} tone={a.sum.pct < t ? 'danger' : 'brand'} trend={{ text: `${fmtNumber(a.sum.marked)} records` }} hint={`${fmtNumber(a.sum.attended)} attended`} />
            <StatCard icon={ClipboardList} label="Lectures conducted" value={fmtNumber(a.tl.sessionCount)} trend={{ text: `${Object.keys(a.tl.byDate).length} days` }} hint="Marked in this range" />
            <StatCard icon={Trophy} label="Top department" value={a.bestDept?.name || '—'} trend={{ text: fmtPct(a.bestDept?.pct) }} hint={a.bestDay ? `Best weekday: ${a.bestDay.label} (${fmtPct(a.bestDay.Attendance)})` : ''} />
            <StatCard icon={TrendingDown} tone="danger" label="Lowest subject" value={fmtPct(a.worstSubj?.pct)} trend={{ text: 'Needs attention' }} hint={a.worstSubj?.label} />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2" title="Overall Attendance Trend" subtitle={from === to ? 'Lecture by lecture for the selected day' : 'Daily attendance rate and absence rate'}>
              <TrendLineChart data={a.trend} series={['Attendance', 'Absent']} threshold={t} height={290} />
            </Card>
            <Card title="Attendance Distribution" subtitle="Share of all marked records">
              <DonutChart data={distribution(a.tl.overall)} centerValue={fmtPct(a.sum.pct)} centerLabel="Attended" height={200} />
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Department Comparison" subtitle={`Average attendance · minimum ${t}%`}>
              <PercentBarChart data={a.deptData} threshold={t} height={280} />
            </Card>
            <Card title="Subject Attendance" subtitle={`${subjectView === 'lowest' ? 'Lowest' : 'Highest'} 10 subjects`} actions={<Segmented size="sm" value={subjectView} onChange={setSubjectView} options={[{ value: 'lowest', label: 'Lowest' }, { value: 'highest', label: 'Highest' }]} />}>
              <PercentBarChart data={subjShown} threshold={t} height={280} layout="horizontal" barSize={14} />
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2" title="Monthly Attendance" subtitle={a.monthlyIsWeekly ? 'Semester to date, week by week' : 'Semester to date, month by month'} icon={CalendarDays}>
              <AreaTrendChart data={a.monthly} threshold={t} height={260} />
            </Card>
            <Card title="Attendance by Weekday" subtitle="Which days students skip most" icon={BookOpen}>
              <PercentBarChart data={a.weekdays.map((w) => ({ name: w.label, pct: w.Attendance }))} threshold={t} height={260} />
            </Card>
          </div>

          {a.weekly.length > 1 && (
            <Card title="Weekly Status Breakdown" subtitle="Number of student records per status each week">
              <StackedCountChart data={a.weekly} height={260} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
