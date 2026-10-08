// Thin, fault-tolerant wrapper around localStorage.
const PREFIX = 'ae_';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    // Storage full or blocked — the app keeps working in memory.
    console.warn('AttendEase: unable to persist', key, err);
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX) && k !== PREFIX + 'theme')
      .forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem(PREFIX + 'session');
  } catch {
    /* ignore */
  }
}
