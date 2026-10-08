import { ClipboardCheck, PencilLine, TriangleAlert, CalendarClock, FileChartColumn, Info } from 'lucide-react';

export const NOTIF_META = {
  attendance: { icon: ClipboardCheck, cls: 'bg-present-soft text-present', label: 'Attendance' },
  update: { icon: PencilLine, cls: 'bg-brand-soft text-brand', label: 'Update' },
  alert: { icon: TriangleAlert, cls: 'bg-danger-soft text-danger', label: 'Alert' },
  schedule: { icon: CalendarClock, cls: 'bg-brand-soft text-brand', label: 'Schedule' },
  report: { icon: FileChartColumn, cls: 'bg-brand-soft text-brand', label: 'Report' },
  system: { icon: Info, cls: 'bg-muted text-ink-2', label: 'System' },
};
