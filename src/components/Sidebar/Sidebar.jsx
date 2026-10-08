import { NavLink } from 'react-router-dom';
import { X, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Logo, { LogoMark } from '../Logo/Logo';
import Avatar from '../ui/Avatar';
import { navFor } from '../../layouts/navigation';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLowStudents } from '../../hooks/useLowAttendance';
import { ROLE_META, INSTITUTION } from '../../data/catalog';

function NavItem({ item, collapsed, badges, onNavigate }) {
  const Icon = item.icon;
  const count = item.badge ? badges[item.badge] : 0;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg py-2 text-[13.5px] font-medium transition-colors ${collapsed ? 'justify-center px-2' : 'px-3'} ${
          isActive ? 'bg-brand-soft font-semibold text-brand-600 dark:text-blue-300' : 'text-ink-2 hover:bg-hover hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r-full bg-brand-600" />}
          <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-brand' : 'text-ink-3 group-hover:text-ink-2'}`} />
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {count > 0 &&
            (collapsed ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger" />
            ) : (
              <span className="min-w-5 rounded-full bg-danger px-1.5 py-px text-center text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>
            ))}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, role, logout } = useAuth();
  const { notifications } = useData();
  const low = useLowStudents();
  const badges = {
    unread: notifications.filter((n) => n.audience.includes(role) && !n.read).length,
    low: low.length,
  };
  const sections = navFor(role);

  const body = (isDrawer) => (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center border-b border-line ${collapsed && !isDrawer ? 'justify-center px-2' : 'justify-between px-5'}`}>
        {collapsed && !isDrawer ? <LogoMark size={34} /> : <Logo size={34} />}
        {isDrawer && (
          <button className="btn-icon" onClick={onCloseMobile} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className={`flex-1 space-y-5 overflow-y-auto py-5 ${collapsed && !isDrawer ? 'px-2' : 'px-3'}`} aria-label="Main">
        {sections.map((sec) => (
          <div key={sec.section}>
            {collapsed && !isDrawer ? (
              <div className="mx-auto mb-2 h-px w-6 bg-line" />
            ) : (
              <p className="mb-1.5 px-3 text-[10.5px] font-bold tracking-[0.08em] text-ink-3 uppercase">{sec.section}</p>
            )}
            <div className="space-y-0.5">
              {sec.items.map((item) => (
                <NavItem key={item.to} item={item} collapsed={collapsed && !isDrawer} badges={badges} onNavigate={isDrawer ? onCloseMobile : undefined} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-line ${collapsed && !isDrawer ? 'p-2' : 'p-3'}`}>
        {!(collapsed && !isDrawer) && (
          <div className="mb-2 flex items-center gap-3 rounded-lg p-2">
            <Avatar name={user?.name} src={user?.avatar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <span className={`chip mt-0.5 px-1.5 py-0 text-[10px] ${ROLE_META[role]?.cls}`}>{ROLE_META[role]?.label}</span>
            </div>
          </div>
        )}
        <div className={`flex ${collapsed && !isDrawer ? 'flex-col items-center gap-1' : 'items-center gap-1'}`}>
          <button onClick={logout} className={`btn btn-ghost ${collapsed && !isDrawer ? 'h-9 w-9 p-0' : 'flex-1 justify-start'}`} title="Logout">
            <LogOut className="h-4 w-4" />
            {!(collapsed && !isDrawer) && 'Logout'}
          </button>
          {!isDrawer && (
            <button onClick={onToggleCollapse} className="btn-icon" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label="Toggle sidebar">
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          )}
        </div>
        {!(collapsed && !isDrawer) && <p className="mt-2 truncate px-2 text-[10px] text-ink-3">{INSTITUTION.short} · v1.0</p>}
      </div>
    </div>
  );

  return (
    <>
      <aside className={`no-print fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-surface transition-[width] duration-200 lg:block ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        {body(false)}
      </aside>
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade absolute inset-0 bg-slate-900/40 dark:bg-black/60" onClick={onCloseMobile} />
          <aside className="animate-drawer absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-pop">{body(true)}</aside>
        </div>
      )}
    </>
  );
}
