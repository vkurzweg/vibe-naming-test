import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api';


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

// Helper function to create a serializable error object
const createSerializableError = (error) => {
  const serializedError = {
    message: error.message || 'An unknown error occurred',
    status: error.response?.status,
    details: error.response?.data || error.toString(),
    timestamp: new Date().toISOString()
  };
  
  // Only include debug info in development
  if (process.env.NODE_ENV === 'development') {
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
      } : 'No response',
      request: error.request ? 'Request was made but no response received' : 'No request was made',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        ...(error.config?.headers && {
          headers: Object.fromEntries(
            Object.entries(error.config.headers).filter(([key]) => 
              typeof key === 'string' && 
              typeof error.config.headers[key] === 'string'
            )
          )
        }),
        data: typeof error.config?.data === 'string' ? error.config.data : '[Non-string data]'
      }
    };
  }
  
  return serializedError;
};

// Async Thunks
export const initializeFormConfig = createAsyncThunk(
  'formConfig/initialize',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const { isInitialized, lastFetched } = getState().formConfig;
      
      // Only fetch if not initialized or data is older than 5 minutes
      if (!isInitialized || !lastFetched || (Date.now() - new Date(lastFetched).getTime() > 5 * 60 * 1000)) {
        await dispatch(fetchFormConfigurations()).unwrap();
        await dispatch(loadActiveFormConfig()).unwrap();
      }
      
      return true;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const fetchFormConfigurations = createAsyncThunk(
  'formConfig/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/form-configurations');
      return response.data || [];
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const loadActiveFormConfig = createAsyncThunk(
  'formConfig/loadActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/form-configurations/active');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data[0]; 
      }
      return data || null; 
    } catch (error) {
      if (error.response?.status === 404) {
        return null; 
      }
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const saveFormConfiguration = createAsyncThunk(
  'formConfig/save',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const method = formData._id ? 'put' : 'post';
      const url = formData._id 
        ? `/api/v1/form-configurations/${formData._id}`
        : '/api/v1/form-configurations';
      
      console.log('Sending form data:', formData); 
      const response = await api[method](url, formData);
      
      // If this is being set as active, update the active config
      if (formData.isActive) {
        await dispatch(loadActiveFormConfig());
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const deleteFormConfiguration = createAsyncThunk(
  'formConfig/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/form-configurations/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const activateFormConfiguration = createAsyncThunk(
  'formConfig/activate',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/api/v1/form-configurations/${id}/activate`);
      // After activation, refetch all configs to ensure state is consistent
      // and load the new active config
      await dispatch(fetchFormConfigurations()).unwrap();
      await dispatch(loadActiveFormConfig()).unwrap();
      return response.data;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

const formConfigSlice = createSlice({
  name: 'formConfig',
  initialState,
  reducers: {
    clearFormConfigError: (state) => {
      state.error = null;
    },
    // setActiveFormConfig is now handled by activateFormConfiguration async thunk
    // and loadActiveFormConfig
    // setActiveFormConfig: (state, action) => {
    //   state.activeFormConfig = action.payload;
    // },
    resetFormConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    // Initialize form config
    builder.addCase(initializeFormConfig.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(initializeFormConfig.fulfilled, (state) => {
      state.loading = false;
      state.isInitialized = true;
      state.lastFetched = new Date().toISOString();
    });
    builder.addCase(initializeFormConfig.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to initialize form configuration';
    });
    
    // Load active form config
    builder.addCase(loadActiveFormConfig.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadActiveFormConfig.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.activeFormConfig = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    });
    builder.addCase(loadActiveFormConfig.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to load active form configuration';
    });
    
    // Handle fetchFormConfigurations
    builder.addCase(fetchFormConfigurations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFormConfigurations.fulfilled, (state, action) => {
      state.loading = false;
      state.formConfigs = action.payload || [];
      state.lastFetched = new Date().toISOString();
    });
    builder.addCase(fetchFormConfigurations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch form configurations';
    });
    
    // Handle saveFormConfiguration
    builder.addCase(saveFormConfiguration.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(saveFormConfiguration.fulfilled, (state, action) => {
      state.loading = false;
      const updatedConfig = action.payload;
      const existingIndex = state.formConfigs.findIndex(c => c._id === updatedConfig._id);
      
      if (existingIndex >= 0) {
        state.formConfigs[existingIndex] = updatedConfig;
      } else {
        state.formConfigs.push(updatedConfig);
      }
      
      // If the saved config is active, update the activeFormConfig in the state.
      // This handles both updating an already active config and activating a new one.
      if (updatedConfig.isActive) {
        state.activeFormConfig = updatedConfig;
      }
      
      state.lastUpdated = new Date().toISOString();
    });
    builder.addCase(saveFormConfiguration.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to save form configuration';
    });
    
    // Handle deleteFormConfiguration
    builder.addCase(deleteFormConfiguration.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteFormConfiguration.fulfilled, (state, action) => {
      state.loading = false;
      const configId = action.payload;
      state.formConfigs = state.formConfigs.filter(c => c._id !== configId);
      
      if (state.activeFormConfig?._id === configId) {
        state.activeFormConfig = null;
      }
      
      state.lastUpdated = new Date().toISOString();
    });
    builder.addCase(deleteFormConfiguration.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to delete form configuration';
    });

    // Handle activateFormConfiguration
    builder.addCase(activateFormConfiguration.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(activateFormConfiguration.fulfilled, (state, action) => {
      state.loading = false;
      // Handle array or object payload
      let activatedConfig = Array.isArray(action.payload) ? action.payload[0] : action.payload;
      // Sanitize dates in activatedConfig
      if (activatedConfig) {
        ['createdAt', 'updatedAt'].forEach(field => {
          if (activatedConfig[field] instanceof Date) {
            activatedConfig[field] = activatedConfig[field].toISOString();
          } else if (typeof activatedConfig[field] === 'string' && !/Z$/.test(activatedConfig[field])) {
            const d = new Date(activatedConfig[field]);
            if (!isNaN(d)) activatedConfig[field] = d.toISOString();
          }
        });
      }
      state.activeFormConfig = activatedConfig;
      // Ensure the list of configs reflects the change in active status and sanitize their dates
      state.formConfigs = state.formConfigs.map(config => {
        const updated = {
          ...config,
          isActive: config._id === activatedConfig?._id
        };
        ['createdAt', 'updatedAt'].forEach(field => {
          if (updated[field] instanceof Date) {
            updated[field] = updated[field].toISOString();
          } else if (typeof updated[field] === 'string' && !/Z$/.test(updated[field])) {
            const d = new Date(updated[field]);
            if (!isNaN(d)) updated[field] = d.toISOString();
          }
        });
        return updated;
      });
      state.lastUpdated = new Date().toISOString();
    });
    builder.addCase(activateFormConfiguration.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to activate form configuration';
    });
  },
});

export const { 
  clearFormConfigError, 
  // setActiveFormConfig, // Removed as it's now handled by thunk
  resetFormConfigState 
} = formConfigSlice.actions;

export default formConfigSlice.reducer;
