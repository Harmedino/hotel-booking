import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from './PageLoader';
import { safeNext } from '../../lib/safeNext';

function loginPath(location) {
  return `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
}

// Where a signed-out visitor to a private page goes: home if they just
// signed out themselves, otherwise login (and back here afterwards).
function useSignedOutRedirect() {
  const signedOut = useSelector((s) => s.auth.signedOut);
  const location = useLocation();
  return signedOut ? '/' : loginPath(location);
}

/** Signed-in users only; everyone else goes to login and comes back afterwards. */
export function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth();
  const redirect = useSignedOutRedirect();
  if (loading) return <PageLoader />;
  if (!isAuthed) return <Navigate to={redirect} replace />;
  return children;
}

/** Hotel owners only. Signed-in guests are sent to the page that explains how to list a property. */
export function RequireOwner({ children }) {
  const { user, isAuthed, loading } = useAuth();
  const redirect = useSignedOutRedirect();
  if (loading) return <PageLoader />;
  if (!isAuthed) return <Navigate to={redirect} replace />;
  if (user.role !== 'owner') return <Navigate to="/list-property" replace />;
  return children;
}

/** Login, sign-up and password pages: signed-in users are sent on to where they were going. */
export function GuestOnly({ children }) {
  const { isAuthed, loading } = useAuth();
  const params = new URLSearchParams(useLocation().search);
  if (loading) return <PageLoader />;
  if (isAuthed) return <Navigate to={safeNext(params.get('next'))} replace />;
  return children;
}
