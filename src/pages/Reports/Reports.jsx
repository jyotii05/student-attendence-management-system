import { useEffect, useMemo, useState } from 'react';
import { FileChartColumn, Download, Printer, Play, GraduationCap, School, Building2, BookOpen, CalendarRange, FileX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import { StandingBadge } from '../../components/ui/Badge';
import { Field, Input, Select } from '../../components/ui/Field';
import { ChartSkeleton, StatSkeleton } from '../../components/ui/Skeleton';
import { LogoMark } from '../../components/Logo/Logo';
import { TrendLineChart, DonutChart, PercentBarChart } from '../../components/Charts/Charts';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useScope } from '../../hooks/useScope';
import { tally, summarize, dailySeries, distribution, standing, STATUS_KEYS, STATUS } from '../../utils/attendance';
import { todayISO, addDays, startOfWeek, startOfMonth, formatDate, formatDateTime } from '../../utils/date';
import { fmtPct, fmtNumber, classLabel } from '../../utils/format';
import { toCSV, downloadCSV } from '../../utils/csv';
import { INSTITUTION } from '../../data/catalog';

const TYPES = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'class', label: 'Class', icon: School },
  { value: 'department', label: 'Department', icon: Building2 },
  { value: 'subject', label: 'Subject', icon: BookOpen },
];

const PRESETS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'semester', label: 'Semester' },
  { value: 'custom', label: 'Custom' },
];

export default function Reports() {
  const data = useData();
  const { settings, departments, classesById, subjectsById, studentsById, notify } = data;
  const { user, role } = useAuth();
  const scope = useScope();
  const toast = useToast();
  const today = todayISO();
  const t = settings.threshold;

  const [type, setType] = useState('class');
  const [entity, setEntity] = useState('');
  const [preset, setPreset] = useState('semester');
  const [from, setFrom] = useState(settings.termStart || addDays(today, -70));
  const [to, setTo] = useState(today);
  const [studentQ, setStudentQ] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const departmentsInScope = departments.filter((d) => scope.isAll || scope.subjects.some((s) => s.department === d.name));
  const options = useMemo(() => {
    if (type === 'student')
      return scope.students
        .filter((s) => !studentQ || s.name.toLowerCase().includes(studentQ.toLowerCase()) || s.rollNo.toLowerCase().includes(studentQ.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ value: s.id, label: `${s.name} · ${s.rollNo}` }));
    if (type === 'class') return scope.classes.map((c) => ({ value: c.id, label: classLabel(c) }));
    if (type === 'department') return departmentsInScope.map((d) => ({ value: d.name, label: d.name }));
    return scope.subjects.map((s) => ({ value: s.id, label: `${s.code} · ${s.name} (${s.course} ${s.semester})` }));
  }, [type, scope, studentQ, departmentsInScope]);

  // Default the entity whenever the report type changes
  useEffect(() => {
    setEntity(options[0]?.value || '');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const applyPreset = (p) => {
    setPreset(p);
    if (p === 'week') {
      setFrom(startOfWeek(today));
      setTo(today);
    } else if (p === 'month') {
      setFrom(startOfMonth(today));
      setTo(today);
    } else if (p === 'semester') {
      setFrom(settings.termStart || addDays(today, -70));
      setTo(today);
    }
  };

  const build = (cfg) => {
    const { type, entity, from, to } = cfg;
    let sessions = scope.sessions.filter((s) => s.date >= from && s.date <= to);
    let studentIds = null;
    let title = '';
    if (type === 'student') {
      const st = studentsById[entity];
      studentIds = new Set([entity]);
      sessions = sessions.filter((s) => s.records[entity]);
      title = `${st?.name} (${st?.rollNo})`;
    } else if (type === 'class') {
      sessions = sessions.filter((s) => s.classId === entity);
      title = classLabel(classesById[entity]);
    } else if (type === 'department') {
      sessions = sessions.filter((s) => classesById[s.classId]?.department === entity);
      title = `Department of ${entity}`;
    } else {
      sessions = sessions.filter((s) => s.subjectId === entity);
      const sub = subjectsById[entity];
      title = `${sub?.code} · ${sub?.name}`;
    }
    const live = new Set(Object.keys(studentsById));
    const tl = tally(sessions, { classesById, studentIds: studentIds || live });
    const sum = summarize(tl.overall, settings);

    let breakdown = [];
    let breakdownLabel = '';
    if (type === 'student' || type === 'class') {
      breakdownLabel = type === 'student' ? 'Subject' : 'Student';
      if (type === 'student')
        breakdown = Object.entries(tl.bySubject).map(([id, c]) => ({ id, name: subjectsById[id]?.name, sub: subjectsById[id]?.code, ...summarize(c, settings) }));
      else
        breakdown = Object.entries(tl.byStudent)
          .map(([id, c]) => ({ id, name: studentsById[id]?.name, sub: studentsById[id]?.rollNo, ...summarize(c, settings) }))
          .sort((a, b) => a.sub.localeCompare(b.sub, undefined, { numeric: true }));
    } else if (type === 'department') {
      breakdownLabel = 'Class';
      breakdown = Object.entries(tl.byClass).map(([id, c]) => ({ id, name: classLabel(classesById[id]), sub: `Room ${classesById[id]?.room}`, ...summarize(c, settings) }));
    } else {
      breakdownLabel = 'Student';
      breakdown = Object.entries(tl.byStudent)
        .map(([id, c]) => ({ id, name: studentsById[id]?.name, sub: studentsById[id]?.rollNo, ...summarize(c, settings) }))
        .sort((a, b) => a.sub.localeCompare(b.sub, undefined, { numeric: true }));
    }
    const chartBreakdown =
      type === 'student' || type === 'department'
        ? breakdown.map((b) => ({ name: b.name.length > 16 ? b.name.slice(0, 15) + '…' : b.name, pct: +(b.pct ?? 0).toFixed(1) }))
        : Object.entries(tl.bySubject).map(([id, c]) => ({ name: (subjectsById[id]?.name || '').slice(0, 16), pct: +(summarize(c, settings).pct ?? 0).toFixed(1) }));

    return {
      cfg,
      title,
      typeLabel: TYPES.find((x) => x.value === type).label,
      sum,
      lectures: tl.sessionCount,
      overall: tl.overall,
      trend: dailySeries(tl.byDate, settings),
      breakdown,
      breakdownLabel,
      chartBreakdown,
      chartTitle: type === 'student' ? 'By subject' : type === 'department' ? 'By class' : 'By subject',
      generatedAt: Date.now(),
      empty: tl.sessionCount === 0,
    };
  };

  const generate = (silent) => {
    if (!entity) return setError(`Please select a ${type}.`);
    if (!from || !to) return setError('Please choose a date range.');
    if (from > to) return setError('Start date must be before the end date.');
    setError('');
    setLoading(true);
    setTimeout(() => {
      const r = build({ type, entity, from, to });
      setReport(r);
      setLoading(false);
      if (!silent && !r.empty) {
        toast.success('Report generated', `${r.typeLabel} report · ${r.title}`);
        notify({ type: 'report', title: 'Report generated', message: `${r.typeLabel} attendance report for ${r.title} is ready.`, audience: [role] });
      }
    }, 550);
  };

  // First load: generate a default report so the page is never blank
  useEffect(() => {
    if (entity && !report && !loading) generate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  const exportCSV = () => {
    if (!report) return;
    const { sum } = report;
    const rows = report.breakdown.map((b) => ({ ...b, standing: standing(b.pct, t) }));
    const head =
      `${INSTITUTION.name}\nAttendance Report — ${report.typeLabel}: ${report.title}\nPeriod: ${report.cfg.from} to ${report.cfg.to}\n` +
      `Total classes,${report.lectures}\nPresent,${sum.P}\nAbsent,${sum.A}\nAttendance %,${sum.pct == null ? '' : sum.pct.toFixed(2)}\n\n`;
    const body = toCSV(rows, [
      { label: report.breakdownLabel, key: 'name' },
      { label: 'Reference', key: 'sub' },
      { label: 'Present', key: 'P' },
      { label: 'Absent', key: 'A' },
      { label: 'Attended', key: 'attended' },
      { label: 'Total', key: 'total' },
      { label: 'Attendance %', value: (r) => (r.pct == null ? '' : r.pct.toFixed(2)) },
      { label: 'Status', value: (r) => (r.standing === 'low' ? 'Low Attendance' : r.standing === 'warning' ? 'Warning' : r.standing === 'good' ? 'Good' : '') },
    ]);
    downloadCSV(`attendance-report-${report.cfg.type}-${report.cfg.from}-to-${report.cfg.to}.csv`, head + body);
    toast.success('CSV downloaded', 'The report was exported successfully.');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance Reports"
        description="Generate attendance summaries by student, class, department or subject."
        actions={
          <>
            <button className="btn btn-secondary" onClick={exportCSV} disabled={!report || report.empty}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()} disabled={!report || report.empty}>
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </>
        }
      />

      <div className="card no-print p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented options={TYPES} value={type} onChange={setType} />
            <Segmented size="sm" options={PRESETS} value={preset} onChange={applyPreset} />
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_auto] md:items-end">
            <Field label={TYPES.find((x) => x.value === type).label} error={error}>
              <div className="flex gap-2">
                {type === 'student' && <Input placeholder="Filter…" value={studentQ} onChange={(e) => setStudentQ(e.target.value)} className="w-32 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <Select value={entity} onChange={(e) => setEntity(e.target.value)} error={error}>
                    <option value="">Select {type}</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Field>
            <Field label="From">
              <Input
                type="date"
                value={from}
                max={to}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPreset('custom');
                }}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPreset('custom');
                }}
              />
            </Field>
            <button className="btn btn-primary h-[38px]" onClick={() => generate(false)} disabled={loading}>
              {loading ? <Spinner /> : <Play className="h-4 w-4" />} Generate report
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
          <ChartSkeleton />
        </div>
      ) : !report ? (
        <div className="card">
          <EmptyState icon={FileChartColumn} title="Configure your report" message="Choose a report type, a subject of the report and a date range, then click Generate report." />
        </div>
      ) : report.empty ? (
        <div className="card">
          <EmptyState icon={FileX} title="No attendance records found." message="There is no attendance for this selection in the chosen date range." />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Print header */}
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <LogoMark size={44} />
              <div>
                <p className="text-[11px] font-bold tracking-wider text-brand uppercase">{report.typeLabel} attendance report</p>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">{report.title}</h2>
                <p className="flex items-center gap-1.5 text-xs text-ink-3">
                  <CalendarRange className="h-3.5 w-3.5" /> {formatDate(report.cfg.from)} – {formatDate(report.cfg.to)}
                </p>
              </div>
            </div>
            <div className="text-xs text-ink-3 sm:text-right">
              <p className="font-semibold text-ink-2">{INSTITUTION.name}</p>
              <p>
                Generated {formatDateTime(report.generatedAt)} by {user.name}
              </p>
              <p>Minimum attendance: {t}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { l: 'Total classes', v: fmtNumber(report.lectures), cls: 'text-brand-900 dark:text-blue-200' },
              ...STATUS_KEYS.map((k) => ({ l: STATUS[k].label, v: fmtNumber(report.sum[k]), cls: STATUS[k].text, dot: STATUS[k].solid })),
              { l: 'Attendance', v: fmtPct(report.sum.pct), cls: report.sum.pct < t ? 'text-danger' : 'text-brand' },
            ].map((s) => (
              <div key={s.l} className="card p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
                  {s.dot && <span className={`h-2 w-2 rounded-full ${s.dot}`} />}
                  {s.l}
                </p>
                <p className={`mt-1.5 text-2xl font-extrabold tracking-tight tabular-nums ${s.cls}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card title="Attendance trend" subtitle="Daily attendance rate in this period" className="xl:col-span-2">
              <TrendLineChart data={report.trend} series={['Attendance']} threshold={t} domain={[0, 100]} height={260} />
            </Card>
            <Card title="Distribution">
              <DonutChart data={distribution(report.overall)} centerValue={fmtPct(report.sum.pct)} centerLabel="Attendance" height={180} />
            </Card>
          </div>

          {report.chartBreakdown.length > 1 && (
            <Card title={report.chartTitle} subtitle={`Bars below ${t}% are highlighted in red`}>
              <PercentBarChart data={report.chartBreakdown} threshold={t} height={260} />
            </Card>
          )}

          <Card title={`Breakdown by ${report.breakdownLabel.toLowerCase()}`} subtitle={`${report.breakdown.length} rows`} bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="table-base min-w-[760px]">
                <thead>
                  <tr>
                    <th>{report.breakdownLabel}</th>
                    {STATUS_KEYS.map((k) => (
                      <th key={k} className="text-right">
                        {STATUS[k].label}
                      </th>
                    ))}
                    <th className="text-right">Attended / Total</th>
                    <th className="w-48">Attendance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <p className="font-semibold text-ink">{b.name}</p>
                        <p className="text-[11px] text-ink-3">{b.sub}</p>
                      </td>
                      {STATUS_KEYS.map((k) => (
                        <td key={k} className="text-right tabular-nums">
                          {b[k]}
                        </td>
                      ))}
                      <td className="text-right tabular-nums">
                        {b.attended}/{b.total}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={b.pct} threshold={t} className="flex-1" />
                          <span className={`w-14 text-right text-xs font-bold tabular-nums ${b.pct < t ? 'text-danger' : ''}`}>{fmtPct(b.pct)}</span>
                        </div>
                      </td>
                      <td>
                        <StandingBadge standing={standing(b.pct, t)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="print-only text-center text-[10px] text-ink-3">
            AttendEase · {INSTITUTION.name} · Confidential — for internal academic use
          </p>
        </div>
      )}
    </div>
  );
}
