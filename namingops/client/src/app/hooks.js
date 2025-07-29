import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';

// Re-export the standard hooks with proper typing
export { useDispatch, useSelector };

/**
 * Hook to access the naming state and actions
 * @returns {Object} Naming state and actions
 */
export const useNaming = () => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.naming);
  
  // Memoize actions to prevent unnecessary re-renders
  const actions = {
    submitNamingRequest: useCallback((data) => 
      dispatch({ type: 'naming/submitNamingRequest', payload: data }), 
      [dispatch]
    ),
    saveDraft: useCallback((data) => 
      dispatch({ type: 'naming/saveDraft', payload: data }),
      [dispatch]
    ),
    clearSubmission: useCallback(() => 
      dispatch({ type: 'naming/clearSubmission' }), 
      [dispatch]
    ),
    loadDraft: useCallback(() => 
      dispatch({ type: 'naming/loadDraft' }), 
      [dispatch]
    ),
    clearDraft: useCallback(() => 
      dispatch({ type: 'naming/clearDraft' }), 
      [dispatch]
    ),
    resetNamingState: useCallback(() => 
      dispatch({ type: 'naming/resetNamingState' }), 
      [dispatch]
    ),
  };

  return { ...state, ...actions };
};

/**
 * Hook to check if a naming request is loading
 * @returns {boolean} True if a naming request is in progress
 */
export const useIsNamingLoading = () => {
  return useSelector((state) => state.naming.loading);
};

/**
 * Hook to get the current draft
 * @returns {Object} The current draft data
 */
export const useNamingDraft = () => {
  return useSelector((state) => state.naming.draft);
};

/**
 * Hook to get the submission error if any
 * @returns {Object|null} The error object or null
 */
export const useNamingError = () => {
  return useSelector((state) => state.naming.error);
};

/**
 * Hook to check if the submission was successful
 * @returns {boolean} True if the submission was successful
 */
export const useIsSubmissionSuccess = () => {
  return useSelector((state) => state.naming.success);
};

/**
 * Hook to get the request ID after successful submission
 * @returns {string|null} The request ID or null
 */
export const useRequestId = () => {
  return useSelector((state) => state.naming.requestId);
};
