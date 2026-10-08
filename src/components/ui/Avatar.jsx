import { initials } from '../../utils/format';

// Muted, professional tints — deterministic per name
const TINTS = [
  'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  'bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
];

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-20 w-20 text-2xl' };

export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (src) return <img src={src} alt={name} className={`${SIZES[size]} shrink-0 rounded-full object-cover ring-2 ring-surface ${className}`} />;
  return (
    <span className={`${SIZES[size]} ${TINTS[hash % TINTS.length]} inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-surface ${className}`} aria-hidden>
      {initials(name)}
    </span>
  );
}
