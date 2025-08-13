// src/theme/dashboardStyles.js

export const dashboardContainerSx = {
    maxWidth: 1000,
    mx: 'auto',
    px: { xs: 2, sm: 3, md: 4 },
    py: 3,
  };
  
  export const dashboardTabBarSx = {
    mb: 3,
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: 'background.paper',
    px: { xs: 0, sm: 1 },
  };
  
  export const dashboardCardSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    boxShadow: 1,
    mb: 2,
    p: 2,
    minHeight: 120,
    transition: 'box-shadow 0.2s',
    '&:hover': {
      boxShadow: 4,
    },
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };
  
  export const dashboardCardTitleSx = {
    fontWeight: 600,
    fontSize: '1.15rem',
    mb: 1,
    letterSpacing: 0.1,
  };
  
  export const dashboardCardSubTitleSx = {
    fontWeight: 400,
    fontSize: '1rem',
    color: 'text.secondary',
    mb: 1,
  };
  
  export const dashboardCardContentSx = {
    fontSize: '0.97rem',
    color: 'text.primary',
    mb: 1,
  };
  
  export const expandIconSx = {
    fontSize: 28,
    ml: 'auto',
    mr: 0,
    color: 'text.secondary',
    alignSelf: 'flex-end',
  };
  
  export const dashboardTableSx = {
    mt: 1,
    mb: 1,
    '& th, & td': {
      fontSize: '0.97rem',
      padding: '4px 8px',
    },
  };