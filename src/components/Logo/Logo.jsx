/** AttendEase mark: a calendar page with a check, plus a small red "notification" dot. */
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="ae-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#ae-g)" />
      <rect x="9" y="11" width="22" height="20" rx="4" fill="none" stroke="#fff" strokeWidth="2.4" />
      <path d="M9 17h22" stroke="#fff" strokeWidth="2.4" />
      <path d="M15 8v5M25 8v5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m15.5 24 3 3 6-6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="31.5" cy="10.5" r="3.2" fill="#EF4444" stroke="#1E3A8A" strokeWidth="1.2" />
    </svg>
  );
}

export default function Logo({ size = 36, subtitle = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <div className="leading-tight">
        <p className="text-[17px] font-extrabold tracking-tight text-brand-900 dark:text-white">
          Attend<span className="text-brand">Ease</span>
        </p>
        {subtitle && <p className="text-[10.5px] font-medium text-ink-3">Student Attendance Management</p>}
      </div>
    </div>
  );
}
