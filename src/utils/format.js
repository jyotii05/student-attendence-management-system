export const fmtNumber = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

export function fmtPct(p, digits = 1) {
  if (p == null || Number.isNaN(p)) return '—';
  return `${Number(p).toFixed(digits)}%`;
}

export function initials(name = '') {
  const parts = name.replace(/^(Dr|Prof|Mr|Mrs|Ms)\.?\s+/i, '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function classLabel(cls) {
  if (!cls) return '—';
  return `${cls.course} · Sem ${cls.semester} · Div ${cls.division}`;
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[6-9]\d{9}$/;
