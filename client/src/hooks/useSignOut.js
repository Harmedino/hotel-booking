import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

// Clears the session; the route guards then send the user home (see
// signedOut in authSlice) instead of to the login page.
export function useSignOut() {
  const dispatch = useDispatch();
  return () => dispatch(logout());
}
