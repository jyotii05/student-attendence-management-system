import { useTheme } from '../context/ThemeContext';

/** Concrete colour values for Recharts (SVG attributes can't read CSS variables). */
export function useChartTheme() {
  const { isDark } = useTheme();
  return {
    isDark,
    grid: isDark ? '#1e2a42' : '#edf1f7',
    axis: isDark ? '#6c7a93' : '#8a96aa',
    text: isDark ? '#e8edf6' : '#0f172a',
    cursor: isDark ? 'rgba(96,140,255,0.08)' : 'rgba(37,99,235,0.05)',
    brand: isDark ? '#4f84f6' : '#2563eb',
    brandDeep: isDark ? '#7ea6ff' : '#1e3a8a',
    brandLight: isDark ? '#28427a' : '#bfdbfe',
    track: isDark ? '#1a2640' : '#eef2f8',
    present: '#16a34a',
    absent: '#dc2626',
  };
}
