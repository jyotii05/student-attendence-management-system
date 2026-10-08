import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, CalendarDays, ChevronDown, Settings, LogOut, User, Moon, Sun, CheckCheck, BellOff } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { NOTIF_META } from './notificationMeta';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ROLE_META } from '../../data/catalog';
import { timeAgo } from '../../utils/date';

function NotificationMenu() {
  const { role } = useAuth();
  const { notifications, markRead, markAllRead } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const mine = notifications.filter((n) => n.audience.includes(role));
  const unread = mine.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-icon relative" aria-label={`Notifications (${unread} unread)`}>
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="animate-pop absolute top-full right-0 z-50 mt-2 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-bold text-ink">Notifications</p>
              <p className="text-xs text-ink-3">{unread ? `${unread} unread` : 'You’re all caught up'}</p>
            </div>
            {unread > 0 && (
              <button onClick={() => markAllRead(role)} className="btn btn-ghost btn-sm text-brand">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {mine.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-ink-3">
                <BellOff className="h-7 w-7" />
                <p className="mt-2 text-sm">No notifications yet</p>
              </div>
            ) : (
              mine.slice(0, 6).map((n) => {
                const m = NOTIF_META[n.type] || NOTIF_META.system;
                const Icon = m.icon;
                return (
                  <button key={n.id} onClick={() => markRead(n.id)} className={`flex w-full gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-hover ${n.read ? '' : 'bg-brand-softer'}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.cls}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-semibold text-ink">{n.title}</span>
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-ink-2">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-ink-3">{timeAgo(n.time)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <Link to="/notifications" onClick={close} className="block border-t border-line bg-surface-2 py-2.5 text-center text-xs font-semibold text-brand hover:bg-hover">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user, role, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-2 hover:bg-hover hover:text-ink';
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-lg py-1 pr-1.5 pl-1 transition-colors hover:bg-hover sm:pr-2" aria-label="Account menu">
        <Avatar name={user?.name} src={user?.avatar} size="sm" />
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[150px] truncate text-[13px] font-semibold text-ink">{user?.name}</span>
          <span className={`chip mt-0.5 px-1.5 py-0 text-[10px] ${ROLE_META[role]?.cls}`}>{ROLE_META[role]?.label}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-ink-3 md:block" />
      </button>
      {open && (
        <div className="animate-pop absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          <div className="flex items-center gap-3 border-b border-line px-2.5 pt-2 pb-3">
            <Avatar name={user?.name} src={user?.avatar} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-3">{user?.email}</p>
              <span className={`chip mt-1 px-1.5 py-0 text-[10px] ${ROLE_META[role]?.cls}`}>{ROLE_META[role]?.label}</span>
            </div>
          </div>
          <div className="py-1">
            <button
              className={item}
              onClick={() => {
                close();
                navigate(role === 'student' ? '/my-attendance' : '/settings');
              }}
            >
              <User className="h-4 w-4" /> {role === 'student' ? 'My attendance' : 'My profile'}
            </button>
            <button
              className={item}
              onClick={() => {
                close();
                navigate('/settings');
              }}
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button className={item} onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
          <div className="border-t border-line pt-1">
            <button className={`${item} text-danger hover:bg-danger-soft hover:text-danger`} onClick={logout}>
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({ onOpenMobile }) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const closeSearch = useCallback(() => setMobileSearch(false), []);
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {mobileSearch ? (
          <GlobalSearch mobile onClose={closeSearch} />
        ) : (
          <>
            <button onClick={onOpenMobile} className="btn-icon lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden flex-1 sm:block">
              <GlobalSearch />
            </div>
            <div className="flex-1 sm:hidden" />
            <button onClick={() => setMobileSearch(true)} className="btn-icon sm:hidden" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-2 xl:flex">
              <CalendarDays className="h-4 w-4 text-brand" />
              {date}
            </div>
            <NotificationMenu />
            <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
            <ProfileMenu />
          </>
        )}
      </div>
    </header>
  );
}
