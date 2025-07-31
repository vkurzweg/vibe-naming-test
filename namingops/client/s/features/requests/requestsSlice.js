import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const getRequests = createAsyncThunk('requests/getRequests', async () => {
  const res = await api.get('/requests');
  return res.data;
});

export const getMyRequests = createAsyncThunk('requests/getMyRequests', async () => {
  const res = await api.get('/requests/my-requests');
  return res.data;
});

export const searchRequests = createAsyncThunk('requests/searchRequests', async (query) => {
  const res = await api.get(`/requests/search?q=${query}`);
  return res.data;
});

export const getRequestById = createAsyncThunk('requests/getRequestById', async (id) => {
  const res = await api.get(`/requests/${id}`);
  return res.data;
});

export const createRequest = createAsyncThunk('requests/createRequest', async (formData) => {
  const res = await api.post('/requests', formData);
  return res.data;
});

export const updateRequest = createAsyncThunk('requests/updateRequest', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/requests/${id}`, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

const requestsSlice = createSlice({
  name: 'requests',
  initialState: {
    requests: [],
    currentRequest: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(getRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error;
      })
      .addCase(getMyRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(getMyRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error;
      })
      .addCase(searchRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(searchRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error;
      })
      .addCase(getRequestById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequest = action.payload;
      })
      .addCase(getRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error;
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        state.requests.push(action.payload);
      })
      .addCase(updateRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequest = action.payload;
        const index = state.requests.findIndex((req) => req._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(updateRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default requestsSlice.reducer;
