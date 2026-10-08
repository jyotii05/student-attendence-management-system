import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import EmptyState from '../ui/EmptyState';
import { ChartColumn } from 'lucide-react';

// ---------- Shared bits ----------

export function ChartTooltip({ active, payload, label, suffix = '%', labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[150px] rounded-lg border border-line bg-surface px-3 py-2.5 shadow-pop">
      <p className="mb-1.5 text-xs font-bold text-ink">{labelFormatter ? labelFormatter(label, payload) : label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5 text-xs">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
            {p.name}
          </span>
          <span className="font-bold text-ink tabular-nums">
            {typeof p.value === 'number' ? p.value.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : p.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
          {i.dashed ? (
            <svg width="14" height="4" aria-hidden>
              <line x1="0" y1="2" x2="14" y2="2" stroke={i.color} strokeWidth="2" strokeDasharray="4 2" />
            </svg>
          ) : (
            <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

function NoData({ height }) {
  return (
    <div style={{ height }} className="flex items-center justify-center">
      <EmptyState compact icon={ChartColumn} title="No data for this range" message="Try a wider date range or different filters." />
    </div>
  );
}

const axisProps = (c) => ({ tick: { fill: c.axis, fontSize: 11 }, axisLine: false, tickLine: false });

// ---------- Line: Present / Absent over time ----------

const SERIES = {
  Present: (c) => ({ color: c.present }),
  Absent: (c) => ({ color: c.absent, dash: '5 3' }),
  Attendance: (c) => ({ color: c.brand }),
};

export function TrendLineChart({ data, series = ['Present', 'Absent'], height = 280, domain = [0, 100], threshold, showLegend = true }) {
  const c = useChartTheme();
  if (!data.length) return <NoData height={height} />;
  return (
    <div>
      {showLegend && series.length > 1 && (
        <Legend className="mb-3" items={series.map((s) => ({ label: s, color: SERIES[s](c).color, dashed: !!SERIES[s](c).dash }))} />
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps(c)} minTickGap={18} dy={6} />
          <YAxis domain={domain} {...axisProps(c)} tickFormatter={(v) => `${v}%`} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.axis, strokeDasharray: '3 3' }} />
          {threshold != null && <ReferenceLine y={threshold} stroke={c.absent} strokeDasharray="4 4" strokeOpacity={0.6} />}
          {series.map((s) => {
            const m = SERIES[s](c);
            return (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={m.color}
                strokeWidth={2}
                strokeDasharray={m.dash}
                dot={data.length <= 14 ? { r: 3, strokeWidth: 2, fill: c.isDark ? '#101829' : '#fff' } : false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: c.isDark ? '#101829' : '#fff' }}
                isAnimationActive
                animationDuration={700}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Bar: percentage per category, red below threshold ----------

export function PercentBarChart({ data, dataKey = 'pct', nameKey = 'name', threshold = 75, height = 280, layout = 'vertical', onBarClick, barSize }) {
  const c = useChartTheme();
  if (!data.length) return <NoData height={height} />;
  const horizontal = layout === 'horizontal';
  const fill = (v) => (v < threshold ? c.absent : c.brand);
  return (
    <ResponsiveContainer width="100%" height={height}>
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap="26%">
          <CartesianGrid stroke={c.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} {...axisProps(c)} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey={nameKey} {...axisProps(c)} width={130} tick={{ fill: c.axis, fontSize: 11 }} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: c.cursor }} />
          <ReferenceLine x={threshold} stroke={c.absent} strokeDasharray="4 4" strokeOpacity={0.6} />
          <Bar dataKey={dataKey} name="Attendance" radius={[0, 4, 4, 0]} barSize={barSize} onClick={onBarClick} className={onBarClick ? 'cursor-pointer' : ''}>
            {data.map((d) => (
              <Cell key={d[nameKey]} fill={fill(d[dataKey])} />
            ))}
          </Bar>
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey={nameKey} {...axisProps(c)} interval={0} dy={6} tick={{ fill: c.axis, fontSize: 11 }} />
          <YAxis domain={[0, 100]} {...axisProps(c)} tickFormatter={(v) => `${v}%`} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: c.cursor }} />
          <ReferenceLine y={threshold} stroke={c.absent} strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: `Min ${threshold}%`, position: 'insideTopRight', fill: c.absent, fontSize: 10 }} />
          <Bar dataKey={dataKey} name="Attendance" radius={[4, 4, 0, 0]} maxBarSize={barSize || 44} onClick={onBarClick} className={onBarClick ? 'cursor-pointer' : ''}>
            {data.map((d) => (
              <Cell key={d[nameKey]} fill={fill(d[dataKey])} />
            ))}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

// ---------- Area: single attendance-rate series ----------

export function AreaTrendChart({ data, dataKey = 'Attendance', height = 260, threshold, domain = [50, 100] }) {
  const c = useChartTheme();
  if (!data.length) return <NoData height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
        <defs>
          <linearGradient id="ae-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.brand} stopOpacity={c.isDark ? 0.35 : 0.22} />
            <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps(c)} minTickGap={16} dy={6} />
        <YAxis domain={domain} {...axisProps(c)} tickFormatter={(v) => `${v}%`} width={44} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.axis, strokeDasharray: '3 3' }} />
        {threshold != null && <ReferenceLine y={threshold} stroke={c.absent} strokeDasharray="4 4" strokeOpacity={0.6} />}
        <Area type="monotone" dataKey={dataKey} name="Attendance" stroke={c.brand} strokeWidth={2} fill="url(#ae-area)" activeDot={{ r: 5, strokeWidth: 2, stroke: c.isDark ? '#101829' : '#fff' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------- Donut: Present / Absent ----------

export function DonutChart({ data, centerValue, centerLabel = 'Attendance', height = 220, showList = true }) {
  const c = useChartTheme();
  const total = data.reduce((a, d) => a + d.value, 0);
  if (!total) return <NoData height={height} />;
  const colorFor = (d) => d.color;
  return (
    <div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip suffix="" />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={1.5} stroke={c.isDark ? '#101829' : '#fff'} strokeWidth={2} startAngle={90} endAngle={-270}>
              {data.map((d) => (
                <Cell key={d.key} fill={colorFor(d)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tracking-tight text-ink">{centerValue}</span>
          <span className="text-[11px] font-medium text-ink-3">{centerLabel}</span>
        </div>
      </div>
      {showList && (
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {data.map((d) => (
            <li key={d.key} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <span className="flex items-center gap-2 text-xs font-medium text-ink-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorFor(d) }} />
                {d.name}
              </span>
              <span className="text-xs font-bold text-ink tabular-nums">{d.pct.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Stacked counts per period ----------

export function StackedCountChart({ data, height = 260 }) {
  const c = useChartTheme();
  if (!data.length) return <NoData height={height} />;
  const gap = c.isDark ? '#101829' : '#fff';
  return (
    <div>
      <Legend
        className="mb-3"
        items={[
          { label: 'Present', color: c.present },
          { label: 'Absent', color: c.absent },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -4, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps(c)} dy={6} />
          <YAxis {...axisProps(c)} width={44} />
          <Tooltip content={<ChartTooltip suffix="" />} cursor={{ fill: c.cursor }} />
          <Bar dataKey="Present" stackId="a" fill={c.present} stroke={gap} strokeWidth={1} maxBarSize={40} />
          <Bar dataKey="Absent" stackId="a" fill={c.absent} stroke={gap} strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
