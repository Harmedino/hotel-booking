import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchRooms = createAsyncThunk('rooms/fetchRooms', async () => {
  const data = await api.getRooms();
  return data;
});

const roomsSlice = createSlice({
  name: 'rooms',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRooms.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchRooms.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
  }
});

export default roomsSlice.reducer;
