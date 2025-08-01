import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  formConfigs: [], // Ensure this is always an array
  activeFormConfig: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

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
export const fetchFormConfigurations = createAsyncThunk(
  'formConfig/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching all form configurations...');
      const response = await api.get('/v1/form-configurations');
      console.log('Form configurations fetched successfully:', response.data);
      
      // Ensure we always return an array, even if the response is empty or not an array
      const configs = Array.isArray(response.data) ? response.data : [];
      return configs.length > 0 ? configs : [];
    } catch (error) {
      console.error('Error fetching form configurations:', error);
      
      // In development, return a default config if the request fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('Development: Using default form configuration due to error');
        return [{
          _id: 'default-dev-config',
          name: 'Default Development Form',
          description: 'Default form configuration for development',
          isActive: true,
          fields: [
            {
              _id: '1',
              name: 'requestTitle',
              label: 'Request Title',
              fieldType: 'text',
              required: true
            },
            {
              _id: '2',
              name: 'description',
              label: 'Description',
              fieldType: 'textarea',
              required: true
            }
          ]
        }];
      }
      
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const fetchActiveFormConfig = createAsyncThunk(
  'formConfig/fetchActive',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userRole = state.auth.user?.role || 'submitter';
      
      console.log(`Fetching active form config for role: ${userRole}`);
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/v1/form-configurations/active?role=${userRole}&_t=${timestamp}`;
      
      console.log('Making request to:', url);
      const response = await api.get(url);
      console.log('Active form config fetched successfully:', response.data);
      
      if (!response.data) {
        throw new Error('No active form configuration found');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching active form configuration:', error);
      
      // In development, return a default config if the request fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('Development: Using default form configuration due to error');
        return {
          _id: 'default-dev-config',
          name: 'Default Development Form',
          description: 'Default form configuration for development',
          isActive: true,
          fields: [
            {
              _id: '1',
              name: 'requestTitle',
              label: 'Request Title',
              fieldType: 'text',
              required: true
            },
            {
              _id: '2',
              name: 'description',
              label: 'Description',
              fieldType: 'textarea',
              required: true
            }
          ]
        };
      }
      
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const createFormConfiguration = createAsyncThunk(
  'formConfig/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/v1/form-configurations', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(createSerializableError(error));
    }
  }
);

export const updateFormConfiguration = createAsyncThunk(
  'formConfig/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/v1/form-configurations/${id}`, formData);
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
      await api.delete(`/v1/form-configurations/${id}`);
      return id;
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
  },
  extraReducers: (builder) => {
    // Handle fetchFormConfigurations
    builder
      .addCase(fetchFormConfigurations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormConfigurations.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure we're setting an array, even if the payload is undefined or null
        state.formConfigs = Array.isArray(action.payload) ? action.payload : [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchFormConfigurations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Handle fetchActiveFormConfig
      .addCase(fetchActiveFormConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveFormConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.activeFormConfig = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchActiveFormConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create configuration
      .addCase(createFormConfiguration.fulfilled, (state, action) => {
        state.formConfigs.unshift(action.payload);
      })
      
      // Update configuration
      .addCase(updateFormConfiguration.pending, (state) => {
        console.log('Updating form configuration...');
      })
      .addCase(updateFormConfiguration.fulfilled, (state, action) => {
        const updatedConfig = action.payload;
        console.log('Successfully updated form config:', updatedConfig);
        
        // Update in formConfigs array
        const index = state.formConfigs.findIndex(
          (config) => config._id === updatedConfig._id
        );
        if (index !== -1) {
          state.formConfigs[index] = updatedConfig;
        } else {
          // If it's a new config, add it to the array
          state.formConfigs.push(updatedConfig);
        }
        
        // If this is the active config, update it
        if (!state.activeFormConfig || state.activeFormConfig._id === updatedConfig._id) {
          console.log('Updating active form config with new data');
          state.activeFormConfig = updatedConfig;
        }
      })
      .addCase(updateFormConfiguration.rejected, (state, action) => {
        console.error('Error updating form config:', action.payload);
      })
      
      // Delete configuration
      .addCase(deleteFormConfiguration.fulfilled, (state, action) => {
        state.formConfigs = state.formConfigs.filter(
          (config) => config._id !== action.payload
        );
      });
  },
});

export const { clearFormConfigError } = formConfigSlice.actions;

export default formConfigSlice.reducer;
