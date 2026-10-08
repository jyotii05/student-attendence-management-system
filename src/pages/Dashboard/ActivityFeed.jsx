import { useMemo } from 'react';
import { TriangleAlert } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../context/DataContext';
import { STATUS } from '../../utils/attendance';
import { timeAgo } from '../../utils/date';

/** Recent attendance activity derived from live session data. */
export default function ActivityFeed({ sessions, lowCount, limit = 7 }) {
  const { classesById, subjectsById, studentsById, settings } = useData();

  const items = useMemo(() => {
    const recent = [...sessions].sort((a, b) => Math.max(b.markedAt, b.updatedAt || 0) - Math.max(a.markedAt, a.updatedAt || 0)).slice(0, 12);
    const out = [];
    recent.forEach((s, i) => {
      const cls = classesById[s.classId];
      const sub = subjectsById[s.subjectId];
      const vals = Object.values(s.records);
      const present = vals.filter((v) => v === 'P').length;
      if (s.edits && s.updatedAt) {
        const [sid, e] = Object.entries(s.edits).sort((a, b) => b[1].at - a[1].at)[0];
        out.push({
          id: s.id + 'e',
          who: e.by,
          time: e.at,
          text: (
            <>
              <b className="font-semibold text-ink">{e.by}</b> updated <b className="font-semibold text-ink">{studentsById[sid]?.name}</b> from {STATUS[e.from]?.label} to {STATUS[e.to]?.label}
            </>
          ),
          status: <StatusBadge status={e.to} size="sm" />,
        });
      }
      out.push({
        id: s.id,
        who: s.markedBy,
        time: s.markedAt,
        text: (
          <>
            <b className="font-semibold text-ink">{s.markedBy}</b> marked {sub?.name} for {cls?.course} Sem {cls?.semester} {cls?.division}
          </>
        ),
        status: <span className="chip bg-brand-soft text-brand-600 dark:text-blue-300">{present}/{vals.length} present</span>,
      });
      // Surface an individual student record from the most recent lectures
      if (i < 2) {
        const sid = Object.keys(s.records).find((k) => s.records[k] === (i === 0 ? 'P' : 'A'));
        if (sid)
          out.push({
            id: s.id + sid,
            who: studentsById[sid]?.name,
            time: s.markedAt - 1000,
            text: (
              <>
                <b className="font-semibold text-ink">{studentsById[sid]?.name}</b> marked {STATUS[s.records[sid]].label} in {sub?.name}
              </>
            ),
            status: <StatusBadge status={s.records[sid]} size="sm" />,
          });
      }
    });
    out.sort((a, b) => b.time - a.time);
    const list = out.slice(0, limit - (lowCount ? 1 : 0));
    if (lowCount)
      list.splice(Math.min(2, list.length), 0, {
        id: 'low',
        alert: true,
        time: Date.now() - 20 * 60000,
        text: (
          <>
            <b className="font-semibold text-danger">{lowCount} students</b> have attendance below {settings.threshold}%
          </>
        ),
        status: <span className="chip bg-danger-soft text-danger">Alert</span>,
      });
    return list;
  }, [sessions, classesById, subjectsById, studentsById, lowCount, limit, settings.threshold]);

  if (!items.length) return <EmptyState compact title="No recent activity" message="Attendance activity will appear here as lectures are marked." />;

  return (
    <ol className="relative space-y-1">
      {items.map((it) => (
        <li key={it.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-hover">
          {it.alert ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <TriangleAlert className="h-4 w-4" />
            </span>
          ) : (
            <Avatar name={it.who || '?'} size="sm" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-snug text-ink-2">{it.text}</p>
            <p className="mt-0.5 text-[11px] text-ink-3">{timeAgo(it.time)}</p>
          </div>
          <div className="shrink-0">{it.status}</div>
        </li>
      ))}
    </ol>
  );
}
