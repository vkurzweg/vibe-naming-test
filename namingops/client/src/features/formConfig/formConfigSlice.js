import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api';

// Helper function to create a serializable error object
const createSerializableError = (error) => {
  const serializedError = {
    message: error.message || 'An unknown error occurred',
    status: error.response?.status,
    details: error.response?.data || error.toString(),
    timestamp: new Date().toISOString()
  };
  
  // Only include debug info in development
  if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true') {
    serializedError._debug = {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: {
          'content-type': error.response.headers?.['content-type'],
          'content-length': error.response.headers?.['content-length']
        }
      } : null,
      stack: error.stack
    };
  }
  
  return serializedError;
};

const initialState = {
  formConfigs: [],
  activeFormConfig: null,
  loading: false,
  error: null,
  lastUpdated: null,
  lastFetched: null,
  isInitialized: false,
};

// Selectors
export const selectFormConfigState = (state) => state.formConfig;

export const selectFormConfigs = createSelector(
  [selectFormConfigState],
  (formConfig) => formConfig.formConfigs
);

export const selectActiveFormConfig = createSelector(
  [selectFormConfigState],
  (formConfig) => formConfig.activeFormConfig
);

export const selectFormConfigById = (state, configId) =>
  state.formConfig.formConfigs.find(config => config._id === configId);

export const selectIsLoading = createSelector(
  [selectFormConfigState],
  (formConfig) => formConfig.loading
);

// Async Thunks
export const loadActiveFormConfig = createAsyncThunk(
  'formConfig/loadActive',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching active form configuration...');
      // Use the correct API endpoint with /api prefix
      const response = await api.get('/api/v1/form-configurations/active');
      console.log('Form config response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading form config:', error);
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const fetchFormConfigs = createAsyncThunk(
  'formConfig/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Use the correct API endpoint with /api prefix
      const response = await api.get('/api/v1/form-configurations');
      return response.data;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const createFormConfig = createAsyncThunk(
  'formConfig/create',
  async (formConfig, { rejectWithValue }) => {
    try {
      // Use the correct API endpoint with /api prefix
      const response = await api.post('/api/v1/form-configurations', formConfig);
      return response.data;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const updateFormConfig = createAsyncThunk(
  'formConfig/update',
  async ({ id, formConfig }, { rejectWithValue }) => {
    try {
      // Use the correct API endpoint with /api prefix
      const response = await api.put(`/api/v1/form-configurations/${id}`, formConfig);
      return response.data;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const deleteFormConfig = createAsyncThunk(
  'formConfig/delete',
  async (id, { rejectWithValue }) => {
    try {
      // Use the correct API endpoint with /api prefix
      await api.delete(`/api/v1/form-configurations/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const activateFormConfiguration = createAsyncThunk(
  'formConfig/activate',
  async (id, { rejectWithValue }) => {
    try {
      // Use the correct API endpoint with /api prefix
      const response = await api.put(`/api/v1/form-configurations/${id}/activate`);
      return response.data;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const initializeFormConfig = createAsyncThunk(
  'formConfig/initialize',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const { isInitialized, lastFetched } = getState().formConfig;
      
      // Only fetch if not initialized or data is older than 5 minutes
      if (!isInitialized || !lastFetched || (Date.now() - new Date(lastFetched).getTime() > 5 * 60 * 1000)) {
        await dispatch(fetchFormConfigs()).unwrap();
        await dispatch(loadActiveFormConfig()).unwrap();
      }
      
      return true;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

const formConfigSlice = createSlice({
  name: 'formConfig',
  initialState,
  reducers: {
    clearFormConfigError(state) {
      state.error = null;
    },
    resetFormConfigState(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // loadActiveFormConfig
    builder
      .addCase(loadActiveFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadActiveFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.activeFormConfig = action.payload;
        state.error = null;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(loadActiveFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to load active form configuration' };
      });

    // fetchFormConfigs
    builder
      .addCase(fetchFormConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.formConfigs = action.payload;
        state.error = null;
        state.lastFetched = new Date().toISOString();
        state.isInitialized = true;
      })
      .addCase(fetchFormConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to fetch form configurations' };
      });

    // createFormConfig
    builder
      .addCase(createFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.formConfigs.push(action.payload);
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to create form configuration' };
      });

    // updateFormConfig
    builder
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
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to update form configuration' };
      });

    // deleteFormConfig
    builder
      .addCase(deleteFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.formConfigs = state.formConfigs.filter(config => config._id !== action.payload);
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to delete form configuration' };
      });

    // activateFormConfiguration
    builder
      .addCase(activateFormConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateFormConfiguration.fulfilled, (state, action) => {
        state.loading = false;
        state.activeFormConfig = action.payload;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(activateFormConfiguration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to activate form configuration' };
      });

    // initializeFormConfig
    builder
      .addCase(initializeFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeFormConfig.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(initializeFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to initialize form configuration' };
      });
  },
});

export const { clearFormConfigError, resetFormConfigState } = formConfigSlice.actions;

export default formConfigSlice.reducer;
