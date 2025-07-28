import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

/**
 * Async thunk for submitting a naming request
 * @param {Object} formData - The form data to submit
 */
export const submitNamingRequest = createAsyncThunk(
  'naming/submitRequest',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/name-requests', formData);
      return response.data;
    } catch (error) {
      // Handle different error statuses
      if (error.response) {
        return rejectWithValue({
          type: 'API_ERROR',
          status: error.response.status,
          message: error.response.data?.message || 'Submission failed',
          errors: error.response.data?.errors || {}
        });
      }
      return rejectWithValue({
        type: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection'
      });
    }
  }
);

/**
 * Async thunk for saving a draft of the naming request
 * @param {Object} draftData - The draft data to save
 */
export const saveDraft = createAsyncThunk(
  'naming/saveDraft',
  async (draftData, { getState }) => {
    const { auth } = getState();
    const draft = {
      ...draftData,
      lastSaved: new Date().toISOString(),
      userId: auth.user?.id
    };
    localStorage.setItem('namingRequestDraft', JSON.stringify(draft));
    return draft;
  }
);

const initialState = {
  loading: false,
  success: false,
  error: null,
  requestId: null,
  draft: null
};

const namingSlice = createSlice({
  name: 'naming',
  initialState,
  reducers: {
    /**
     * Clear the submission state
     */
    clearSubmission: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.requestId = null;
    },
    
    /**
     * Load draft from localStorage
     */
    loadDraft: (state) => {
      try {
        const draft = JSON.parse(localStorage.getItem('namingRequestDraft') || 'null');
        if (draft) {
          state.draft = draft;
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    },
    
    /**
     * Clear the current draft
     */
    clearDraft: (state) => {
      localStorage.removeItem('namingRequestDraft');
      state.draft = null;
    },
    
    /**
     * Reset the entire naming state
     */
    resetNamingState: () => initialState
  },
  extraReducers: (builder) => {
    // Submit Naming Request
    builder.addCase(submitNamingRequest.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    });
    
    builder.addCase(submitNamingRequest.fulfilled, (state, action) => {
      state.loading = false;
      state.success = true;
      state.requestId = action.payload.id || action.payload._id;
      state.draft = null;
    });
    
    builder.addCase(submitNamingRequest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || {
        type: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred'
      };
    });
    
    // Save Draft
    builder.addCase(saveDraft.fulfilled, (state, action) => {
      state.draft = action.payload;
    });
  }
});

// Export actions
export const { 
  clearSubmission, 
  loadDraft, 
  clearDraft, 
  resetNamingState 
} = namingSlice.actions;

// Export selectors
export const selectNamingState = (state) => state.naming;
export const selectIsLoading = (state) => state.naming.loading;
export const selectSubmissionError = (state) => state.naming.error;
export const selectIsSubmissionSuccess = (state) => state.naming.success;
export const selectRequestId = (state) => state.naming.requestId;
export const selectDraft = (state) => state.naming.draft;

export default namingSlice.reducer;
