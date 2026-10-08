export default function ProgressBar({ value, threshold = 75, className = '', height = 'h-1.5', tone }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  const color = tone || (value == null ? 'bg-line-strong' : value < threshold ? 'bg-danger' : value < threshold + 10 ? 'bg-late' : 'bg-brand');
  return (
    <div className={`w-full overflow-hidden rounded-full bg-muted ${height} ${className}`}>
      <div className={`${height} rounded-full ${color} transition-[width] duration-700 ease-out`} style={{ width: `${v}%` }} />
    </div>
  );
}
