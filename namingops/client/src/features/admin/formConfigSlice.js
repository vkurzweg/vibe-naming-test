import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  formConfigs: [],
  activeFormConfig: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchFormConfigurations = createAsyncThunk(
  'formConfig/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/form-configurations');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchActiveFormConfig = createAsyncThunk(
  'formConfig/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/form-configurations/active');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createFormConfiguration = createAsyncThunk(
  'formConfig/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/form-configurations', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateFormConfiguration = createAsyncThunk(
  'formConfig/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/form-configurations/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteFormConfiguration = createAsyncThunk(
  'formConfig/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/form-configurations/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const formConfigSlice = createSlice({
  name: 'formConfig',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormConfigurations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFormConfigurations.fulfilled, (state, action) => {
        state.loading = false;
        state.formConfigs = action.payload;
      })
      .addCase(fetchFormConfigurations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchActiveFormConfig.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.activeFormConfig = action.payload;
      })
      .addCase(fetchActiveFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFormConfiguration.fulfilled, (state, action) => {
        state.formConfigs.push(action.payload);
      })
      .addCase(updateFormConfiguration.fulfilled, (state, action) => {
        const index = state.formConfigs.findIndex(
          (config) => config._id === action.payload._id
        );
        if (index !== -1) {
          state.formConfigs[index] = action.payload;
        }
      })
      .addCase(deleteFormConfiguration.fulfilled, (state, action) => {
        state.formConfigs = state.formConfigs.filter(
          (config) => config._id !== action.payload
        );
      });
  },
});

export default formConfigSlice.reducer;
