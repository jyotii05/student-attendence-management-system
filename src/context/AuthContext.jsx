import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useData } from './DataContext';

const AuthContext = createContext(null);
const KEY = 'ae_session';

function readSession() {
  try {
    const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const { users, studentsById, facultyById } = useData();
  const [session, setSession] = useState(readSession);

  const user = useMemo(() => (session ? users.find((u) => u.id === session.userId) || null : null), [session, users]);

  // The academic record linked to the signed-in account (student or faculty)
  const profile = useMemo(() => {
    if (!user) return null;
    if (user.role === 'student') return studentsById[user.linkedId] || null;
    if (user.role === 'faculty') return facultyById[user.linkedId] || null;
    return null;
  }, [user, studentsById, facultyById]);

  const login = useCallback(
    (email, password, remember = true) => {
      const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u) return { ok: false, field: 'email', error: 'No account found with this email.' };
      if (u.password !== password) return { ok: false, field: 'password', error: 'Incorrect password. Please try again.' };
      const s = { userId: u.id, at: Date.now() };
      try {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
        (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(s));
      } catch {
        /* ignore */
      }
      setSession(s);
      return { ok: true, user: u };
    },
    [users],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setSession(null);
  }, []);

  const value = { user, profile, role: user?.role, isAuthenticated: !!user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
