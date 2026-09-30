import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from './PageLoader';

export function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthed) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

export function RequireOwner({ children }) {
  const { user, isAuthed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthed) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== 'owner') return <Navigate to="/list-property" replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { isAuthed, loading } = useAuth();
  const params = new URLSearchParams(useLocation().search);
  if (loading) return <PageLoader />;
  if (isAuthed) return <Navigate to={params.get('next') || '/'} replace />;
  return children;
}
