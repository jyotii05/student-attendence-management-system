import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, ClipboardCheck, Bell, Palette, Shield, Camera, Save, Sun, Moon, LogOut, KeyRound, Eye, EyeOff, Check, Database, RotateCcw, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';
import { Field, Input, Toggle } from '../../components/ui/Field';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { WEEKDAYS, ROLE_META } from '../../data/catalog';
import { EMAIL_RE, PHONE_RE } from '../../utils/format';
import { classesNeeded } from '../../utils/attendance';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
];

function ProfileTab() {
  const { user, role } = useAuth();
  const { users, updateUser } = useData();
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '', avatar: user.avatar });
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Unsupported file', 'Please choose a PNG or JPG image.');
    if (file.size > 1.5 * 1024 * 1024) return toast.error('Image too large', 'Please choose an image under 1.5 MB.');
    // Downscale to keep localStorage small
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const c = document.createElement('canvas');
        const size = 160;
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        set('avatar', c.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const save = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Please enter a valid email.';
    else if (users.some((u) => u.id !== user.id && u.email.toLowerCase() === form.email.trim().toLowerCase())) e.email = 'This email is used by another account.';
    if (form.phone && !PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number.';
    setErrors(e);
    if (Object.keys(e).length) return;
    updateUser(user.id, { name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), avatar: form.avatar });
    toast.success('Profile updated', 'Your changes have been saved.');
  };

  return (
    <Card title="Profile" subtitle="How you appear across AttendEase">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar name={form.name} src={form.avatar} size="xl" />
            <button onClick={() => fileRef.current?.click()} className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-brand-600 text-white shadow hover:bg-brand-700" aria-label="Upload photo">
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
          <span className={`chip ${ROLE_META[role].cls}`}>{ROLE_META[role].label}</span>
          {form.avatar && (
            <button className="text-xs font-semibold text-danger hover:underline" onClick={() => set('avatar', null)}>
              Remove photo
            </button>
          )}
        </div>
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name} className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input value={form.phone} maxLength={10} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
          </Field>
          <Field label="Title" className="sm:col-span-2" hint="Managed by the administrator">
            <Input value={user.title || ''} disabled />
          </Field>
          <div className="flex justify-end sm:col-span-2">
            <button className="btn btn-primary" onClick={save}>
              <Save className="h-4 w-4" /> Save profile
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AttendanceTab() {
  const { role } = useAuth();
  const { settings, updateSettings } = useData();
  const toast = useToast();
  const [form, setForm] = useState({ ...settings, threshold: String(settings.threshold) });
  const [errors, setErrors] = useState({});
  const readOnly = role !== 'admin';
  const th = Number(form.threshold);

  const save = () => {
    const e = {};
    if (!(th >= 1 && th <= 100)) e.threshold = 'Enter a percentage between 1 and 100.';
    if (!form.workingDays.length) e.workingDays = 'Select at least one working day.';
    setErrors(e);
    if (Object.keys(e).length) return;
    updateSettings({ threshold: th, workingDays: [...form.workingDays].sort() });
    toast.success('Attendance settings saved', `Minimum attendance is now ${th}%. All percentages and alerts were recalculated.`);
  };
  const toggleDay = (d) => setForm((f) => ({ ...f, workingDays: f.workingDays.includes(d) ? f.workingDays.filter((x) => x !== d) : [...f.workingDays, d] }));

  return (
    <Card title="Attendance Settings" subtitle={readOnly ? 'Only administrators can change these rules' : 'Rules used for every percentage, report and alert'}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:max-w-sm">
          <Field label="Minimum attendance percentage" required error={errors.threshold} hint="Students below this are flagged as Low Attendance">
            <div className="relative">
              <Input type="number" min={1} max={100} value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))} disabled={readOnly} error={errors.threshold} className="pr-8" />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-3">%</span>
            </div>
          </Field>
        </div>
        {!errors.threshold && th > 0 && th < 100 && (
          <p className="rounded-lg border border-brand/20 bg-brand-softer px-3 py-2.5 text-xs text-ink-2">
            Example: a student with 20 of 30 lectures attended ({((20 / 30) * 100).toFixed(1)}%) would need <b className="text-ink">{classesNeeded(20, 30, th)}</b> consecutive lectures to reach {th}%.
          </p>
        )}
        <Field label="Working days" error={errors.workingDays}>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.concat([{ id: 0, short: 'Sun', name: 'Sunday' }]).map((d) => {
              const on = form.workingDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleDay(d.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${on ? 'border-brand bg-brand-soft text-brand-600 dark:text-blue-300' : 'border-line text-ink-3 hover:border-line-strong'}`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {d.short}
                </button>
              );
            })}
          </div>
        </Field>
        {!readOnly && (
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={save}>
              <Save className="h-4 w-4" /> Save settings
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function NotificationsTab() {
  const { settings, updateSettings } = useData();
  const toast = useToast();
  const set = (k, v) => {
    updateSettings({ [k]: v });
    toast.success('Preference saved');
  };
  return (
    <Card title="Notifications" subtitle="Choose what AttendEase notifies you about">
      <div className="space-y-5">
        <Toggle label="Low attendance alerts" description="When a student drops below the minimum attendance" checked={settings.notifyLowAttendance} onChange={(v) => set('notifyLowAttendance', v)} />
        <div className="h-px bg-line" />
        <Toggle label="Attendance updates" description="When attendance is marked or edited" checked={settings.notifyUpdates} onChange={(v) => set('notifyUpdates', v)} />
        <div className="h-px bg-line" />
        <Toggle label="System notifications" description="Maintenance, new semesters and announcements" checked={settings.notifySystem} onChange={(v) => set('notifySystem', v)} />
      </div>
    </Card>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const opt = (id, label, Icon, preview) => (
    <button
      onClick={() => setTheme(id)}
      className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${theme === id ? 'border-brand ring-4 ring-brand/15' : 'border-line hover:border-line-strong'}`}
      aria-pressed={theme === id}
    >
      <div className={`h-28 rounded-lg border ${preview}`}>
        <div className="flex h-full">
          <div className={`w-1/4 border-r ${id === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className="m-2 h-2 w-8 rounded bg-blue-600" />
            <div className={`mx-2 mt-2 h-1.5 rounded ${id === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <div className={`mx-2 mt-1.5 h-1.5 rounded ${id === 'dark' ? 'bg-blue-500/30' : 'bg-blue-100'}`} />
          </div>
          <div className="flex-1 p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-8 rounded border ${id === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`} />
              ))}
            </div>
            <div className={`mt-1.5 h-10 rounded border ${id === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`} />
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon className="h-4 w-4 text-brand" /> {label}
        {theme === id && <Check className="ml-auto h-4 w-4 text-brand" />}
      </p>
    </button>
  );
  return (
    <Card title="Appearance" subtitle="Light mode is the default. Your choice is saved on this device.">
      <div className="grid gap-4 sm:grid-cols-2">
        {opt('light', 'Light mode', Sun, 'border-slate-200 bg-slate-50')}
        {opt('dark', 'Dark mode', Moon, 'border-slate-700 bg-slate-950')}
      </div>
    </Card>
  );
}

function SecurityTab() {
  const { user, role, logout } = useAuth();
  const { updateUser, resetDemo } = useData();
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const strength = (() => {
    const p = form.next;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const change = () => {
    const e = {};
    if (!form.current) e.current = 'Enter your current password.';
    else if (form.current !== user.password) e.current = 'Current password is incorrect.';
    if (form.next.length < 6) e.next = 'New password must be at least 6 characters.';
    else if (form.next === form.current) e.next = 'New password must be different.';
    if (form.confirm !== form.next) e.confirm = 'Passwords do not match.';
    setErrors(e);
    if (Object.keys(e).length) return;
    updateUser(user.id, { password: form.next });
    setForm({ current: '', next: '', confirm: '' });
    toast.success('Password changed', 'Use your new password the next time you sign in.');
  };

  const pw = (k, label) => (
    <Field label={label} required error={errors[k]}>
      <Input type={show ? 'text' : 'password'} value={form[k]} onChange={(e) => set(k, e.target.value)} error={errors[k]} autoComplete={k === 'current' ? 'current-password' : 'new-password'} />
    </Field>
  );

  return (
    <div className="space-y-5">
      <Card title="Change password" icon={KeyRound}>
        <div className="grid max-w-xl gap-4">
          {pw('current', 'Current password')}
          {pw('next', 'New password')}
          {form.next && (
            <div className="-mt-2 flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? (strength <= 1 ? 'bg-danger' : strength <= 2 ? 'bg-late' : 'bg-present') : 'bg-muted'}`} />
              ))}
              <span className="w-14 text-right text-[11px] font-semibold text-ink-3">{['Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength]}</span>
            </div>
          )}
          {pw('confirm', 'Confirm new password')}
          <div className="flex items-center justify-between">
            <button className="btn btn-ghost btn-sm" onClick={() => setShow((s) => !s)}>
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {show ? 'Hide' : 'Show'} passwords
            </button>
            <button className="btn btn-primary" onClick={change}>
              <Save className="h-4 w-4" /> Update password
            </button>
          </div>
        </div>
      </Card>

      <Card title="Session" icon={LogOut}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-2">
            Signed in as <b className="text-ink">{user.email}</b>
          </p>
          <button className="btn btn-danger" onClick={logout}>
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </Card>

      {role === 'admin' && (
        <Card title="Demo data" icon={Database} subtitle="All data is stored locally in this browser">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-2">Restore the original sample students, faculty and attendance. Your changes will be lost.</p>
            <button className="btn btn-outline hover:border-danger hover:text-danger" onClick={() => setResetOpen(true)}>
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </button>
          </div>
        </Card>
      )}
      <ConfirmDialog
        open={resetOpen}
        tone="danger"
        title="Reset all demo data?"
        message="Every student, faculty member, attendance record and setting will be restored to the original sample data. You will be signed out."
        confirmLabel="Reset data"
        onCancel={() => setResetOpen(false)}
        onConfirm={resetDemo}
      >
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <Trash2 className="h-3.5 w-3.5" /> This cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'profile');
  useEffect(() => {
    const p = params.get('tab');
    if (p && p !== tab) setTab(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const select = (id) => {
    setTab(id);
    setParams(id === 'profile' ? {} : { tab: id }, { replace: true });
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, attendance rules, notifications and appearance." />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${tab === t.id ? 'bg-brand-soft text-brand-600 dark:text-blue-300' : 'text-ink-2 hover:bg-hover hover:text-ink'}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'attendance' && <AttendanceTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}
