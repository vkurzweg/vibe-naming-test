import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { GoogleLogin } from '@react-oauth/google';
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
  const { loading, error: authError } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
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
      const resultAction = await dispatch(login(data));
      
      if (login.fulfilled.match(resultAction)) {
        navigate('/');
      } else {
        const error = resultAction.error?.message || 'Login failed';
        setFormError(error);
        console.error('Login error:', error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setFormError(error.message || 'An unexpected error occurred');
    }
  };

  // Check if Google OAuth is configured
  const isGoogleOAuthConfigured = process.env.REACT_APP_GOOGLE_CLIENT_ID && 
    process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';

  // Handle Google OAuth success
  const handleGoogleSuccess = async (credentialResponse) => {
    if (process.env.NODE_ENV === 'development') {
      setFormError('Google OAuth is disabled in development mode');
      return;
    }
  
    setSsoLoading(true);
    setFormError('');
    
    try {
      const resultAction = await dispatch(googleLogin({
        credential: credentialResponse.credential
      }));
      
      if (googleLogin.fulfilled.match(resultAction)) {
        navigate('/');
      } else {
        const error = resultAction.error?.message || 'Google login failed';
        setFormError(error);
        console.error('Google login error:', error);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setFormError(error.message || 'Google login failed');
    } finally {
      setSsoLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', {
      error,
      timestamp: new Date().toISOString(),
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      isConfigured: !!isGoogleOAuthConfigured
    });
    
    let errorMessage = 'Google login failed. Please try again.';
    
    if (error?.error === 'popup_closed_by_user') {
      errorMessage = 'Sign-in was cancelled.';
    } else if (error?.details) {
      errorMessage = `Google sign-in error: ${error.details}`;
    }
    
    setFormError(errorMessage);
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
            Welcome to NamingOps! 🚀
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue
          </Typography>
        </Box>

        {(formError || authError) && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => {
              setFormError('');
              // You might want to clear the auth error from the store here
            }}
          >
            {formError || authError}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit(onSubmit)} 
          noValidate
          sx={{ mt: 1 }}
        >
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
              {...(control?.register('email') || {})}
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
              {...(control?.register('password') || {})}
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

            {isGoogleOAuthConfigured && process.env.NODE_ENV !== 'development' ? (
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
                    {ssoLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Continue with Google'
                    )}
                  </Button>
                )}
              />
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Google OAuth is currently disabled in development mode.
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