import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
  Paper,
} from '@mui/material';
import { Visibility, VisibilityOff, Google as GoogleIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { login, googleLogin } from '../features/auth/authSlice';

// Form validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      await dispatch(login(data)).unwrap();
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  // Check if Google OAuth is configured
  const isGoogleOAuthConfigured = process.env.REACT_APP_GOOGLE_CLIENT_ID && 
    process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';

  // Handle Google OAuth success
  const handleGoogleSuccess = async (credentialResponse) => {
    setSsoLoading(true);
    try {
      console.log('Google OAuth success - Credential Response:', {
        clientId: credentialResponse.clientId,
        credential: credentialResponse.credential ? '✅ Credential received' : '❌ No credential',
        select_by: credentialResponse.select_by || 'unknown',
        // Don't log the full credential for security
        credential_length: credentialResponse.credential ? credentialResponse.credential.length : 0
      });

      // Here you would typically send the credential to your backend for verification
      // For testing purposes, we'll just show an alert and redirect
      alert('Google OAuth successful! Check the console for details.');
      
      // In a real app, you would verify the credential with your backend
      // and then log the user in before redirecting
      // await verifyWithBackend(credentialResponse.credential);
      
      // For now, just redirect to home
      navigate('/');
    } catch (err) {
      console.error('Google login failed:', err);
      alert(`Google login failed: ${err.message}`);
    } finally {
      setSsoLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', {
      error,
      timestamp: new Date().toISOString(),
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      isConfigured: !!(process.env.REACT_APP_GOOGLE_CLIENT_ID && 
                     process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID')
    });
    
    let errorMessage = 'Google login failed. Please try again.';
    
    if (error && error.error === 'popup_closed_by_user') {
      errorMessage = 'Sign-in was cancelled.';
    } else if (error && error.details) {
      errorMessage = `Google sign-in error: ${error.details}`;
    }
    
    alert(errorMessage);
    setSsoLoading(false);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.background.default,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account to continue
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            <TextField
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading || ssoLoading}
              {...(control ? control.register('email') : {})}
            />

            <TextField
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading || ssoLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...(control ? control.register('password') : {})}
            />

            <Box sx={{ textAlign: 'right' }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                underline="hover"
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || ssoLoading}
              sx={{ mt: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {isGoogleOAuthConfigured ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                auto_select
                width="100%"
                size="large"
                text="continue_with"
                shape="rectangular"
                logo_alignment="left"
                theme="outline"
                type="standard"
                ux_mode="popup"
                context="use"
                itp_support={true}
                render={(renderProps) => (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    onClick={renderProps.onClick}
                    disabled={loading || ssoLoading || renderProps.disabled}
                    sx={{
                      mb: 2,
                      backgroundColor: 'white',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {ssoLoading ? 'Signing in...' : 'Continue with Google'}
                  </Button>
                )}
              />
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Google OAuth is not configured. Please set up the Google OAuth client ID in your environment variables.
              </Alert>
            )}

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  underline="hover"
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
