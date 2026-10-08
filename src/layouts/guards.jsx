import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccess } from './navigation';
import EmptyState from '../components/ui/EmptyState';

/** Only signed-in users; everyone else goes to /login (remembering where they were headed). */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** /login for guests only — signed-in users go straight to their dashboard. */
export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/** Blocks pages a role isn't permitted to open. */
export function RoleGate({ children }) {
  const { role } = useAuth();
  const { pathname } = useLocation();
  if (!canAccess(role, pathname))
    return (
      <div className="card">
        <EmptyState
          icon={ShieldAlert}
          title="You don’t have access to this page"
          message="This section is restricted for your role. Contact the administrator if you believe this is a mistake."
          action={
            <Link to="/dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
          }
        />
      </div>
    );
  return children;
}
