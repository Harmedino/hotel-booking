import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';
import { api } from './api';

const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

// Clear cached private data when the user signs out. lastToken is updated
// *before* dispatching: resetApiState notifies this same listener again, and
// with the old value still in place it would reset again, forever (the
// "Maximum call stack size exceeded" that froze the page on sign-out).
let lastToken = store.getState().auth.token;
store.subscribe(() => {
  const { token } = store.getState().auth;
  const signedOut = Boolean(lastToken) && !token;
  lastToken = token;
  if (signedOut) store.dispatch(api.util.resetApiState());
});

// Signing out in one tab signs out every open tab.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'qs_token' && !event.newValue && store.getState().auth.token) store.dispatch(logout());
  });
}

export { logout };
export default store;
