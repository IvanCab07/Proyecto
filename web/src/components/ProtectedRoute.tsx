import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingScreen } from './LoadingScreen';
import { AppShell } from './AppShell';
import { homePath } from '../lib/nav';

type Role = 'ADMIN' | 'PATIENT' | 'MEDICO';

interface Props {
  role?: Role | Role[];
  children: React.ReactNode;
}

export function ProtectedRoute({ role, children }: Props) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const allowed = role ? (Array.isArray(role) ? role : [role]) : null;
  if (allowed && (!user || !allowed.includes(user.role))) {
    return <Navigate to={homePath(user?.role)} replace />;
  }

  return <AppShell>{children}</AppShell>;
}
