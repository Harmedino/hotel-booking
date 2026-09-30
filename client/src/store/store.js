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

// Clear cached private data when the user signs out.
let lastToken = store.getState().auth.token;
store.subscribe(() => {
  const { token } = store.getState().auth;
  if (lastToken && !token) store.dispatch(api.util.resetApiState());
  lastToken = token;
});

export { logout };
export default store;
