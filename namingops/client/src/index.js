import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import store from './store';
import reportWebVitals from './reportWebVitals';
import './index.css';

// Google OAuth Client ID - use test ID in development if not set
let GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// In development, use a test client ID if none is provided
if (process.env.NODE_ENV === 'development' && (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID')) {
  console.warn('Using test Google OAuth client ID for development. For production, set REACT_APP_GOOGLE_CLIENT_ID in your .env file.');
  GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
}

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const container = document.getElementById('root');
const root = createRoot(container);

// Create a wrapper component to handle Google OAuth provider
const AppWithGoogleOAuth = () => {
  const isTestClient = !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID';
  
  if (isTestClient) {
    console.warn('Using test Google OAuth client ID. For production, set REACT_APP_GOOGLE_CLIENT_ID in your .env file.');
  }

  const appContent = (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          {isTestClient && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '10px',
              textAlign: 'center',
              zIndex: 9999,
              borderBottom: '1px solid #ffeeba'
            }}>
              Using test Google OAuth client. For production, set REACT_APP_GOOGLE_CLIENT_ID in your .env file.
            </div>
          )}
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

  if (isTestClient) {
    return appContent;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </GoogleOAuthProvider>
  );
};

root.render(
  <React.StrictMode>
    <AppWithGoogleOAuth />
  </React.StrictMode>
);

// If you want to measure performance, pass a function to log results
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
