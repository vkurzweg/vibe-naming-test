import { configureStore } from '@reduxjs/toolkit';
import formConfigReducer, { 
  fetchFormConfigurations, 
  loadActiveFormConfig, 
  saveFormConfiguration, 
  deleteFormConfiguration,
  selectFormConfigs,
  selectActiveFormConfig,
  selectFormConfigById,
  selectFormConfigState
} from './formConfigSlice';

// Mock the API module
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

import api from '../../services/api';

describe('formConfigSlice', () => {
  let store;
  
  // Sample data for testing
  const mockFormConfigs = [
    { id: '1', name: 'Test Config 1', isActive: true, fields: [] },
    { id: '2', name: 'Test Config 2', isActive: false, fields: [] }
  ];
  
  const mockActiveConfig = { id: '1', name: 'Test Config 1', isActive: true, fields: [] };
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        formConfig: formConfigReducer
      }
    });
  });
  
  describe('initial state', () => {
    it('should have the correct initial state', () => {
      const state = store.getState().formConfig;
      expect(state).toEqual({
        formConfigs: [],
        activeFormConfig: null,
        loading: false,
        error: null,
        lastUpdated: null,
        lastFetched: null,
        isInitialized: false
      });
    });
  });
  
  describe('fetchFormConfigurations', () => {
    it('should handle fetching form configurations successfully', async () => {
      // Mock the API response
      api.get.mockResolvedValueOnce({ data: mockFormConfigs });
      
      // Dispatch the action
      await store.dispatch(fetchFormConfigurations());
      
      // Get the state after the action
      const state = store.getState().formConfig;
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/v1/form-configurations');
      
      // Verify the state was updated correctly
      expect(state.formConfigs).toEqual(mockFormConfigs);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeTruthy();
    });
    
    it('should handle fetch error', async () => {
      // Mock an error response
      const error = { message: 'Failed to fetch' };
      api.get.mockRejectedValueOnce(error);
      
      // Dispatch the action
      await store.dispatch(fetchFormConfigurations());
      
      // Get the state after the action
      const state = store.getState().formConfig;
      
      // Verify the state was updated correctly
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.error.message).toBe('Failed to fetch');
    });
  });
  
  describe('loadActiveFormConfig', () => {
    it('should handle loading the active form config successfully', async () => {
      // Mock the API response
      api.get.mockResolvedValueOnce({ data: mockActiveConfig });
      
      // Dispatch the action
      await store.dispatch(loadActiveFormConfig());
      
      // Get the state after the action
      const state = store.getState().formConfig;
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/v1/form-configurations/active');
      
      // Verify the state was updated correctly
      expect(state.activeFormConfig).toEqual(mockActiveConfig);
      expect(state.lastUpdated).toBeTruthy();
    });
    
    it('should handle 404 when no active config exists', async () => {
      // Mock a 404 response
      const error = { response: { status: 404 } };
      api.get.mockRejectedValueOnce(error);
      
      // Dispatch the action
      await store.dispatch(loadActiveFormConfig());
      
      // Get the state after the action
      const state = store.getState().formConfig;
      
      // Verify the state was updated correctly
      expect(state.activeFormConfig).toBeNull();
      expect(state.error).toBeNull();
    });
  });
  
  describe('saveFormConfiguration', () => {
    it('should handle creating a new form config', async () => {
      const newConfig = { name: 'New Config', fields: [], isActive: true };
      const savedConfig = { ...newConfig, id: '3' };
      
      // Mock the API response
      api.post.mockResolvedValueOnce({ data: savedConfig });
      
      // Dispatch the action
      await store.dispatch(saveFormConfiguration(newConfig));
      
      // Verify the API was called correctly
      expect(api.post).toHaveBeenCalledWith('/v1/form-configurations', newConfig);
      
      // Since saveFormConfiguration doesn't directly update the state, we just verify the API call
      // The actual state update would happen through the extraReducers
      expect(api.post).toHaveBeenCalled();
    });
    
    it('should handle updating an existing form config', async () => {
      const updatedConfig = { id: '1', name: 'Updated Config', fields: [], isActive: true };
      
      // Mock the API response
      api.put.mockResolvedValueOnce({ data: updatedConfig });
      
      // Dispatch the action
      await store.dispatch(saveFormConfiguration(updatedConfig));
      
      // Verify the API was called correctly
      expect(api.put).toHaveBeenCalledWith('/v1/form-configurations/1', updatedConfig);
      
      // Since saveFormConfiguration doesn't directly update the state, we just verify the API call
      // The actual state update would happen through the extraReducers
      expect(api.put).toHaveBeenCalled();
    });
  });
  
  describe('selectors', () => {
    let state;
    
    beforeEach(() => {
      // Set up some initial state
      state = {
        formConfig: {
          formConfigs: [...mockFormConfigs],
          activeFormConfig: { ...mockActiveConfig },
          loading: false,
          error: null,
          lastUpdated: null,
          lastFetched: null,
          isInitialized: true
        }
      };
    });
    
    it('should select the form config state', () => {
      const selected = selectFormConfigState(state);
      expect(selected).toEqual(state.formConfig);
    });
    
    it('should select all form configs', () => {
      const selected = selectFormConfigs(state);
      expect(selected).toEqual(mockFormConfigs);
    });
    
    it('should select the active form config', () => {
      const selected = selectActiveFormConfig(state);
      expect(selected).toEqual(mockActiveConfig);
    });
    
    it('should select a form config by ID', () => {
      const selected = selectFormConfigById(state, '2');
      expect(selected).toEqual(mockFormConfigs[1]);
    });
    
    it('should return undefined for non-existent ID', () => {
      const selected = selectFormConfigById(state, '999');
      expect(selected).toBeUndefined();
    });
  });
});
