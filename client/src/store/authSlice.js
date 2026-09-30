import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'qs_token';
const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: readToken(), user: null },
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      try { localStorage.setItem(TOKEN_KEY, action.payload.token); } catch { /* storage unavailable */ }
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
