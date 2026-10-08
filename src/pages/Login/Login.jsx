import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound, Check } from 'lucide-react';
import { LogoMark } from '../../components/Logo/Logo';
import { Field, Input } from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/Modal/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_ACCOUNTS } from '../../data/catalog';
import { EMAIL_RE } from '../../utils/format';

const ROLE_LABEL = { admin: 'Administrator', faculty: 'Faculty', student: 'Student' };

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (k === 'email' || k === 'password') setDemoRole(null);
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Please enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const res = login(form.email, form.password, form.remember);
      setLoading(false);
      if (!res.ok) {
        setErrors({ [res.field]: res.error });
        return;
      }
      const first = res.user.name.split(' ').slice(-2, -1)[0] || res.user.name;
      toast.success(`Welcome back, ${first}!`, `Signed in as ${ROLE_LABEL[res.user.role]}.`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    }, 600);
  };

  const fillDemo = (d) => {
    setForm((f) => ({ ...f, email: d.email, password: d.password }));
    setErrors({});
    setDemoRole(d.role);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <main className="w-[90%] max-w-[440px] sm:w-full">
        <div className="rounded-[18px] border border-line bg-surface px-6 py-9 shadow-[0_1px_3px_rgba(17,24,39,0.04),0_8px_24px_-12px_rgba(17,24,39,0.08)] sm:px-9">
          {/* Brand */}
          <div className="flex flex-col items-center text-center">
            <LogoMark size={54} />
            <p className="mt-3 text-xl font-extrabold tracking-tight text-brand-900 dark:text-white">
              Attend<span className="text-brand-600 dark:text-blue-400">Ease</span>
            </p>
            <p className="mt-0.5 text-xs text-[#64748B] dark:text-ink-3">Student Attendance Management System</p>
          </div>

          {/* Heading */}
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-ink">Welcome Back 👋</h1>
            <p className="mt-1.5 text-sm text-[#64748B] dark:text-ink-2">Sign in to continue to your dashboard.</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
            <Field label="Email Address" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" icon={Mail} autoComplete="email" placeholder="Enter your email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} className="h-11" />
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password}>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={`input h-11 pr-11 pl-9 ${errors.password ? 'input-error' : ''}`}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-3 hover:bg-hover hover:text-ink"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#64748B] select-none dark:text-ink-2">
                <input type="checkbox" checked={form.remember} onChange={(e) => set('remember', e.target.checked)} className="h-4 w-4 rounded border-line-strong accent-brand-600" />
                Remember me
              </label>
              <button type="button" onClick={() => setForgotOpen(true)} className="text-sm font-semibold text-brand-600 hover:underline dark:text-blue-400">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary mt-2 h-11 w-full text-[15px]">
              {loading && <Spinner />}
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Demo login */}
          <div className="mt-8 border-t border-line pt-5 text-center">
            <p className="text-xs font-medium text-[#64748B] dark:text-ink-3">Demo Login</p>
            <div className="mt-2.5 flex flex-wrap justify-center gap-2">
              {DEMO_ACCOUNTS.map((d) => {
                const on = demoRole === d.role;
                return (
                  <button
                    key={d.role}
                    type="button"
                    onClick={() => fillDemo(d)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      on ? 'border-brand-600 bg-brand-soft text-brand-600 dark:text-blue-300' : 'border-line text-[#64748B] hover:border-brand/50 hover:text-brand-600 dark:text-ink-2'
                    }`}
                  >
                    {on && <Check className="h-3 w-3" />}
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <ForgotPassword open={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={form.email} />
    </div>
  );
}

function ForgotPassword({ open, onClose, initialEmail }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setSent(false);
    setError('');
    setEmail('');
    onClose();
  };

  const submit = (e) => {
    e?.preventDefault();
    const v = (email || initialEmail).trim();
    if (!v) return setError('Email is required.');
    if (!EMAIL_RE.test(v)) return setError('Please enter a valid email.');
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
      toast.success('Reset link sent', `Check ${v} for instructions (demo).`);
    }, 700);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Reset your password"
      description="We’ll email you a secure link to set a new password."
      icon={KeyRound}
      size="sm"
      footer={
        sent ? (
          <button className="btn btn-primary" onClick={close}>
            Back to sign in
          </button>
        ) : (
          <>
            <button className="btn btn-outline" onClick={close}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy && <Spinner />} Send reset link
            </button>
          </>
        )
      }
    >
      {sent ? (
        <div className="flex items-start gap-3 rounded-lg border border-present/30 bg-present-soft p-3 text-sm text-ink">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-present" />
          <span>If an account exists for that email, a reset link is on its way. For this demo, use the Demo Login buttons on the sign-in page.</span>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <Field label="Email Address" error={error}>
            <Input
              icon={Mail}
              type="email"
              placeholder="Enter your email"
              defaultValue={initialEmail}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error}
            />
          </Field>
          <p className="mt-3 text-xs text-ink-3">Demo mode — no email is actually sent.</p>
        </form>
      )}
    </Modal>
  );
}
