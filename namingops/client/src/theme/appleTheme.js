// // Apple-inspired theme system with light/dark mode support
// // Professional colors and typography from Material-UI design

// const createTheme = (mode = 'light') => {
//   const isLight = mode === 'light';

//   return {
//     mode,

//     // Typography system using SF Pro Display with Material-UI influence
//     typography: {
//       fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//       fontWeights: {
//         light: 300,
//         regular: 400,
//         medium: 500,
//         semibold: 600,
//         bold: 700,
//       },
//       sizes: {
//         h1: '32px',
//         h2: '28px',
//         h3: '24px',
//         h4: '20px',
//         body: '16px',
//         small: '14px',
//         caption: '12px',
//       },
//       lineHeights: {
//         tight: 1.2,
//         normal: 1.4,
//         relaxed: 1.6,
//       },
//       letterSpacing: '0.02857em', // Add default letterSpacing value
//     },

//     // Color system - professional Material-UI inspired colors
//     colors: {
//       // Primary colors
//       primary: isLight ? '#1976d2' : '#90caf9',
//       primaryHover: isLight ? '#1565c0' : '#64b5f6',
//       primaryLight: isLight ? '#e3f2fd' : '#0d47a1',
//       primaryDark: isLight ? '#0d47a1' : '#e3f2fd',

//       // Secondary colors
//       secondary: isLight ? '#9c27b0' : '#ce93d8',
//       secondaryHover: isLight ? '#7b1fa2' : '#ba68c8',

//       // Status colors - professional approach
//       success: isLight ? '#2e7d32' : '#66bb6a',
//       successLight: isLight ? '#e8f5e8' : '#1b5e20',
//       warning: isLight ? '#ed6c02' : '#ffb74d',
//       warningLight: isLight ? '#fff3e0' : '#e65100',
//       error: isLight ? '#d32f2f' : '#f44336',
//       errorLight: isLight ? '#ffebee' : '#b71c1c',
//       info: isLight ? '#0288d1' : '#29b6f6',
//       infoLight: isLight ? '#e1f5fe' : '#01579b',

//       // Background colors
//       background: isLight ? '#ffffff' : '#121212',
//       backgroundSecondary: isLight ? '#f5f5f5' : '#1e1e1e',
//       backgroundTertiary: isLight ? '#fafafa' : '#2d2d2d',
//       paper: isLight ? '#ffffff' : '#1e1e1e',

//       // Text colors
//       textPrimary: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
//       textSecondary: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
//       textTertiary: isLight ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.38)',
//       textDisabled: isLight ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.26)',

//       // Border colors
//       border: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
//       borderLight: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
//       divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',

//       // Interactive colors
//       hover: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
//       selected: isLight ? 'rgba(25, 118, 210, 0.08)' : 'rgba(144, 202, 249, 0.08)',
//       focus: isLight ? 'rgba(25, 118, 210, 0.12)' : 'rgba(144, 202, 249, 0.12)',
//       disabled: isLight ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.26)',
//     },

//     // Spacing system
//     spacing: {
//       xs: '4px',
//       sm: '8px',
//       md: '16px',
//       lg: '24px',
//       xl: '32px',
//       xxl: '48px',
//     },

//     // Border radius system
//     borderRadius: {
//       sm: '4px',
//       md: '8px',
//       lg: '12px',
//       xl: '16px',
//       round: '50%',
//     },

//     // Shadow system
//     shadows: {
//       sm: isLight
//         ? '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)'
//         : '0px 2px 1px -1px rgba(0,0,0,0.4), 0px 1px 1px 0px rgba(0,0,0,0.28), 0px 1px 3px 0px rgba(0,0,0,0.24)',
//       md: isLight
//         ? '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)'
//         : '0px 3px 3px -2px rgba(0,0,0,0.4), 0px 3px 4px 0px rgba(0,0,0,0.28), 0px 1px 8px 0px rgba(0,0,0,0.24)',
//       lg: isLight
//         ? '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)'
//         : '0px 5px 5px -3px rgba(0,0,0,0.4), 0px 8px 10px 1px rgba(0,0,0,0.28), 0px 3px 14px 2px rgba(0,0,0,0.24)',
//       xl: isLight
//         ? '0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)'
//         : '0px 8px 10px -5px rgba(0,0,0,0.4), 0px 16px 24px 2px rgba(0,0,0,0.28), 0px 6px 30px 5px rgba(0,0,0,0.24)',
//     },

//     // Component-specific styles
//     components: {
//       button: {
//         borderRadius: '4px',
//         padding: '8px 16px',
//         fontSize: '14px',
//         fontWeight: 500,
//         textTransform: 'uppercase',
//         letterSpacing: '0.02857em',
//         transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
//       },
//       card: {
//         borderRadius: '4px',
//         padding: '16px',
//         backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
//         border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
//         boxShadow: isLight
//           ? '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)'
//           : '0px 2px 1px -1px rgba(0,0,0,0.4), 0px 1px 1px 0px rgba(0,0,0,0.28), 0px 1px 3px 0px rgba(0,0,0,0.24)',
//       },
//       input: {
//         borderRadius: '4px',
//         padding: '16.5px 14px',
//         border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'}`,
//         fontSize: '16px',
//       },
//       tab: {
//         minHeight: '48px',
//         padding: '12px 16px',
//         fontSize: '14px',
//         fontWeight: 500,
//         textTransform: 'uppercase',
//         letterSpacing: '0.02857em',
//       },
//     },
//   };
// };

// export const lightTheme = createTheme('light');
// export const darkTheme = createTheme('dark');
// export const appleTheme = lightTheme; // Default export for backward compatibility

// // CSS-in-JS helper functions
// export const getStatusColor = (status, theme = appleTheme) => {
//   switch (status) {
//     case 'approved':
//       return theme.colors.success;
//     case 'rejected':
//       return theme.colors.error;
//     case 'pending':
//     case 'submitted':
//     case 'under_review':
//     default:
//       return theme.colors.textSecondary;
//   }
// };

// export const getTypography = (variant, theme = appleTheme) => {
//   return theme.typography.sizes[variant] || theme.typography.sizes.body;
// };

// // Global CSS variables for consistent theming
// export const cssVariables = `
//   :root {
//     /* Colors */
//     --color-bg-primary: ${appleTheme.colors.background};
//     --color-bg-secondary: ${appleTheme.colors.backgroundSecondary};
//     --color-bg-tertiary: ${appleTheme.colors.backgroundTertiary};
//     --color-bg-primary: ${appleTheme.colors.background};
//     --color-bg-secondary: ${appleTheme.colors.backgroundSecondary};
//     --color-bg-tertiary: ${appleTheme.colors.backgroundTertiary};

//     --color-text-primary: ${appleTheme.colors.textPrimary};
//     --color-text-secondary: ${appleTheme.colors.textSecondary};
//     --color-text-tertiary: ${appleTheme.colors.textTertiary};

//     --color-accent-primary: ${appleTheme.colors.primary};
//     --color-accent-secondary: ${appleTheme.colors.secondary};

//     --color-status-approved: ${appleTheme.colors.success};
//     --color-status-neutral: ${appleTheme.colors.textSecondary};

//     --color-border-light: ${appleTheme.colors.borderLight};
//     --color-border-medium: ${appleTheme.colors.border};

//     --color-interactive-hover: ${appleTheme.colors.hover};
//     --color-interactive-active: ${appleTheme.colors.selected};

//     /* Typography */
//     --font-family-primary: ${appleTheme.typography.fontFamily};

//     /* Spacing */
//     --spacing-xs: ${appleTheme.spacing.xs};
//     --spacing-sm: ${appleTheme.spacing.sm};
//     --spacing-md: ${appleTheme.spacing.md};
//     --spacing-lg: ${appleTheme.spacing.lg};
//     --spacing-xl: ${appleTheme.spacing.xl};
//     --spacing-xxl: ${appleTheme.spacing.xxl};

//     /* Border radius */
//     --border-radius-sm: ${appleTheme.borderRadius.sm};
//     --border-radius-md: ${appleTheme.borderRadius.md};
//     --border-radius-lg: ${appleTheme.borderRadius.lg};

//     /* Shadows */
//     --shadow-sm: ${appleTheme.shadows.sm};
//     --shadow-md: ${appleTheme.shadows.md};
//     --shadow-lg: ${appleTheme.shadows.lg};
//   }

//   /* Global typography styles */
//   body {
//     font-family: var(--font-family-primary);
//     color: var(--color-text-primary);
//     background-color: var(--color-bg-primary);
//     line-height: 1.5;
//     -webkit-font-smoothing: antialiased;
//     -moz-osx-font-smoothing: grayscale;
//   }

//   /* Remove default margins and paddings */
//   * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//   }

//   /* Typography classes */
//   .typography-h1 {
//     font-size: ${appleTheme.typography.sizes.h1};
//     font-weight: ${appleTheme.typography.fontWeights.bold};
//     line-height: ${appleTheme.typography.lineHeights.tight};
//     letter-spacing: ${appleTheme.typography.letterSpacing || '0.02857em'};
//   }

//   .typography-h2 {
//     font-size: ${appleTheme.typography.sizes.h2};
//     font-weight: ${appleTheme.typography.fontWeights.semibold};
//     line-height: ${appleTheme.typography.lineHeights.normal};
//     letter-spacing: ${appleTheme.typography.letterSpacing || '0.02857em'};
//   }

//   .typography-h3 {
//     font-size: ${appleTheme.typography.sizes.h3};
//     font-weight: ${appleTheme.typography.fontWeights.semibold};
//     line-height: ${appleTheme.typography.lineHeights.normal};
//     letter-spacing: ${appleTheme.typography.letterSpacing || '0.02857em'};
//   }

//   .typography-body {
//     font-size: ${appleTheme.typography.sizes.body};
//     font-weight: ${appleTheme.typography.fontWeights.regular};
//     line-height: ${appleTheme.typography.lineHeights.normal};
//     letter-spacing: ${appleTheme.typography.letterSpacing || '0.02857em'};
//   }

//   .typography-caption {
//     font-size: ${appleTheme.typography.sizes.caption};
//     font-weight: ${appleTheme.typography.fontWeights.regular};
//     line-height: ${appleTheme.typography.lineHeights.tight};
//     letter-spacing: ${appleTheme.typography.letterSpacing || '0.02857em'};
//   }
  
//   .typography-small {
//     font-size: ${appleTheme.typography.sizes.small};
//     font-weight: ${appleTheme.typography.fontWeights.regular};
//     line-height: ${appleTheme.typography.lineHeights.normal};
//     letter-spacing: ${appleTheme.typography.letterSpacing || '0.02857em'};
//   }
// `;
