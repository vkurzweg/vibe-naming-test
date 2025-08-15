// approvedNamesSlice.js (using Redux Toolkit for simplicity)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchApprovedNames = createAsyncThunk(
  'approvedNames/fetchApprovedNames',
  async () => {
    const response = await axios.get('/api/approved-names');
    return response.data;
  }
);

const approvedNamesSlice = createSlice({
  name: 'approvedNames',
  initialState: {
    names: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovedNames.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchApprovedNames.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.names = action.payload;
      })
      .addCase(fetchApprovedNames.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default approvedNamesSlice.reducer;