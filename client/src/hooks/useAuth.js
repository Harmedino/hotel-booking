import { useSelector } from 'react-redux';
import { useGetMeQuery } from '../store/api';

// Returns the signed-in user. `loading` is true while a stored token is being checked.
export function useAuth() {
  const { token, user } = useSelector((s) => s.auth);
  const { isLoading } = useGetMeQuery(undefined, { skip: !token });
  return { user, token, isAuthed: Boolean(token && user), loading: Boolean(token) && (isLoading || !user) };
}
