import React, { useContext } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../theme';

const AppThemeProvider = ({ children }) => {
  const { mode } = useContext(ThemeContext);
  const theme = getTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default AppThemeProvider;
