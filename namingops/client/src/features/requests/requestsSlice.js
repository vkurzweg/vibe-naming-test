import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // Corrected import path
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Async Thunks
export const fetchUserRequests = createAsyncThunk(
  'requests/fetchUserRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, status, priority, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
      
      const response = await api.get('/requests', {
        params: {
          page,
          limit,
          status,
          priority,
          search,
          sortBy,
          sortOrder
        }
      });
      
      return {
        data: response.data.data,
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch requests');
    }
  }
);

export const getMyRequests = createAsyncThunk(
  'requests/getMyRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/requests/my-requests');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch my requests');
    }
  }
);

export const searchRequests = createAsyncThunk(
  'requests/searchRequests',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(`/requests/search?query=${query}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Search failed');
    }
  }
);

export const fetchRequestById = createAsyncThunk(
  'requests/fetchRequestById',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/requests/${requestId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch request');
    }
  }
);

export const updateRequest = createAsyncThunk(
  'requests/updateRequest',
  async ({ id, requestData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/requests/${id}`, requestData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

const initialState = {
  requests: [],
  filteredRequests: [],
  currentRequest: null,
  loading: false,
  error: null,
  searchQuery: '',
  filters: {
    status: '',
    dateRange: { start: null, end: null },
    reviewer: ''
  },
  sortConfig: {
    key: 'request_date',
    direction: 'descending'
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  pagination: {}
};

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.filteredRequests = applyFilters(state);
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
      state.filteredRequests = applyFilters(state);
    },
    setSort: (state, action) => {
      const { key } = action.payload;
      if (state.sortConfig.key === key) {
        state.sortConfig.direction = 
          state.sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
      } else {
        state.sortConfig.key = key;
        state.sortConfig.direction = 'ascending';
      }
      state.filteredRequests = applyFilters(state);
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchQuery = '';
      state.filteredRequests = applyFilters(state);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.data;
        state.pagination = action.payload.pagination;
        state.filteredRequests = applyFilters({
          ...state,
          requests: action.payload.data
        });
      })
      .addCase(fetchUserRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getMyRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
        state.filteredRequests = applyFilters({
          ...state,
          requests: action.payload
        });
      })
      .addCase(getMyRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchRequests.fulfilled, (state, action) => {
        state.filteredRequests = action.payload;
      })
      .addCase(fetchRequestById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRequestById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentRequest = action.payload;
      })
      .addCase(fetchRequestById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequest = action.payload;
        const index = state.requests.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
        state.filteredRequests = applyFilters(state);
      })
      .addCase(updateRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Helper function to apply filters
const applyFilters = (state) => {
  let result = [...state.requests];
  
  // Apply search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    result = result.filter(
      request =>
        request.request_title?.toLowerCase().includes(query) ||
        request.reviewer_name?.toLowerCase().includes(query) ||
        request.status?.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (state.filters.status) {
    result = result.filter(
      request => request.status === state.filters.status
    );
  }

  // Apply date range filter
  if (state.filters.dateRange.start) {
    const startDate = new Date(state.filters.dateRange.start);
    result = result.filter(
      request => new Date(request.request_date) >= startDate
    );
  }
  if (state.filters.dateRange.end) {
    const endDate = new Date(state.filters.dateRange.end);
    result = result.filter(
      request => new Date(request.request_date) <= endDate
    );
  }

  // Apply reviewer filter
  if (state.filters.reviewer) {
    result = result.filter(
      request => request.reviewer_id === state.filters.reviewer
    );
  }

  // Apply sorting
  const { key, direction } = state.sortConfig;
  if (key) {
    result.sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  return result;
};

// Export actions
export const { setSearchQuery, setFilter, setSort, resetFilters } = requestsSlice.actions;

// Export selectors
export const selectAllRequests = (state) => state.requests.requests;
export const selectFilteredRequests = (state) => state.requests.filteredRequests;
export const selectIsLoading = (state) => state.requests.loading;
export const selectError = (state) => state.requests.error;
export const selectSearchQuery = (state) => state.requests.searchQuery;
export const selectFilters = (state) => state.requests.filters;
export const selectSortConfig = (state) => state.requests.sortConfig;
export const selectPagination = (state) => state.requests.pagination;

// Export utility functions
export const exportToCSV = (requests) => {
  if (!requests.length) return '';
  
  const headers = Object.keys(requests[0]).join(',');
  const rows = requests.map(request => 
    Object.values(request).map(field => 
      typeof field === 'string' ? `"${field.replace(/"/g, '""')}"` : field
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export const exportToPDF = (requests, title = 'Name Requests Report') => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${date}`, 14, 30);
  
  // Prepare data for the table
  const tableColumn = ['Title', 'Date', 'Status', 'Reviewer'];
  const tableRows = requests.map(request => [
    request.request_title,
    new Date(request.request_date).toLocaleDateString(),
    request.status,
    request.reviewer_name || 'Unassigned'
  ]);
  
  // Add table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      valign: 'middle',
      overflow: 'linebreak',
      tableWidth: 'wrap'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 40 }
  });
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }
  
  return doc;
};

export default requestsSlice.reducer;
