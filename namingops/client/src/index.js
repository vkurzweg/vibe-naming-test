import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { store } from './app/store';
import { ThemeProvider as AppThemeProviderWrapper } from './context/ThemeContext';
import AppThemeProvider from './providers/AppThemeProvider';
import reportWebVitals from './reportWebVitals';
import './styles/radix-ui.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1009058437445-s15inh3vb1dl1o1hcmg0nn9q6grr7n7h.apps.googleusercontent.com';

if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
  console.warn('Using default Google OAuth Client ID. For production, set REACT_APP_GOOGLE_CLIENT_ID in your .env file');
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AppThemeProviderWrapper>
            <AppThemeProvider>
              <App />
            </AppThemeProvider>
          </AppThemeProviderWrapper>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// If you want to measure performance, pass a function to log results
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
