// src/middleware/errorMiddleware.js
export const errorMiddleware = (store) => (next) => (action) => {
    try {
      return next(action);
    } catch (error) {
      console.error('Redux middleware caught error:', error);
      // Optionally dispatch an error action
      store.dispatch({ type: 'ERROR', error: error.message });
      throw error;
    }
  };