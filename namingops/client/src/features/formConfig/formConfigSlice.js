import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const loadActiveFormConfig = createAsyncThunk(
  'formConfig/loadActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/form-configurations/active');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to load active form configuration');
    }
  }
);

export const fetchFormConfigs = createAsyncThunk(
  'formConfig/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/form-configurations');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch form configurations');
    }
  }
);

export const createFormConfig = createAsyncThunk(
  'formConfig/create',
  async (formConfig, { rejectWithValue }) => {
    try {
      const response = await api.post('/v1/form-configurations', formConfig);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create form configuration');
    }
  }
);

export const updateFormConfig = createAsyncThunk(
  'formConfig/update',
  async ({ id, formConfig }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/v1/form-configurations/${id}`, formConfig);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update form configuration');
    }
  }
);

export const activateFormConfig = createAsyncThunk(
  'formConfig/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/v1/form-configurations/${id}/activate`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to activate form configuration');
    }
  }
);

export const deleteFormConfig = createAsyncThunk(
  'formConfig/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/v1/form-configurations/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete form configuration');
    }
  }
);

const initialState = {
  activeFormConfig: null,
  formConfigs: [],
  loading: false,
  error: null
};

const formConfigSlice = createSlice({
  name: 'formConfig',
  initialState,
  reducers: {
    resetFormConfigError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load active form config
      .addCase(loadActiveFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadActiveFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.activeFormConfig = action.payload;
      })
      .addCase(loadActiveFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load active form configuration';
      })
      
      // Fetch all form configs
      .addCase(fetchFormConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.formConfigs = action.payload;
      })
      .addCase(fetchFormConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch form configurations';
      })
      
      // Create form config
      .addCase(createFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.formConfigs.push(action.payload);
      })
      .addCase(createFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create form configuration';
      })
      
      // Update form config
      .addCase(updateFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.formConfigs.findIndex(config => config._id === action.payload._id);
        if (index !== -1) {
          state.formConfigs[index] = action.payload;
        }
      })
      .addCase(updateFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update form configuration';
      })
      
      // Activate form config
      .addCase(activateFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.activeFormConfig = action.payload;
        // Update the isActive flag for all form configs
        state.formConfigs = state.formConfigs.map(config => ({
          ...config,
          isActive: config._id === action.payload._id
        }));
      })
      .addCase(activateFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to activate form configuration';
      })
      
      // Delete form config
      .addCase(deleteFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.formConfigs = state.formConfigs.filter(config => config._id !== action.payload);
      })
      .addCase(deleteFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete form configuration';
      })
  }
});

export const { resetFormConfigError } = formConfigSlice.actions;

export default formConfigSlice.reducer;
