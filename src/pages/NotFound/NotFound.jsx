import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { LogoMark } from '../../components/Logo/Logo';
import { useAuth } from '../../context/AuthContext';

export default function NotFound({ standalone }) {
  const { isAuthenticated } = useAuth();
  const content = (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="relative">
        <p className="text-[120px] leading-none font-extrabold tracking-tighter text-brand-900/10 select-none sm:text-[160px] dark:text-white/10">404</p>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface text-brand shadow-pop">
            <Compass className="h-8 w-8" />
          </span>
        </span>
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">404</h1>
      <p className="mt-1 text-base font-semibold text-ink-2">Oops! This page doesn’t exist.</p>
      <p className="mt-2 max-w-sm text-sm text-ink-3">The link may be broken or the page may have been moved. Let’s get you back on track.</p>
      <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn btn-primary mt-6">
        <ArrowLeft className="h-4 w-4" /> {isAuthenticated ? 'Back to Dashboard' : 'Back to Login'}
      </Link>
    </div>
  );
  if (!standalone) return <div className="card">{content}</div>;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page">
      <LogoMark size={44} />
      {content}
    </div>
  );
}
