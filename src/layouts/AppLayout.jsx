import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import { PAGE_TITLES } from './navigation';
import { RoleGate } from './guards';
import { PageSkeleton } from '../components/ui/Skeleton';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ae_sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem('ae_sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Page title + scroll reset on navigation
  useEffect(() => {
    const key = Object.keys(PAGE_TITLES)
      .filter((p) => pathname === p || pathname.startsWith(p + '/'))
      .sort((a, b) => b.length - a.length)[0];
    document.title = `${key ? PAGE_TITLES[key] + ' · ' : ''}AttendEase`;
    window.scrollTo(0, 0);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-page">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className={`print-full transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main key={pathname} className="animate-page print-full mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:py-8">
          <RoleGate>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </RoleGate>
        </main>
      </div>
    </div>
  );
}
