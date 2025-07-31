import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Collapse,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  List as ListIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
  }),
  ...(!open && {
    '& .MuiDrawer-paper': {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    },
  }),
}));

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [expanded, setExpanded] = useState({});

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleExpand = (menu) => {
    setExpanded(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Navigation items based on user role
  const navItems = useMemo(() => {
    const items = [
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/',
        show: true,
      },
      {
        text: 'Submit Request',
        icon: <AddIcon />,
        path: '/submit-request',
        show: true,
      },
      {
        text: 'Archive',
        icon: <ArchiveIcon />,
        path: '/archive',
        show: true,
      },
    ];

    // Add admin-specific items
    if (user?.role === 'admin') {
      items.push(
        {
          text: 'Admin',
          icon: <SettingsIcon />,
          children: [
            { text: 'Form Configuration', path: '/admin/forms' },
            { text: 'User Management', path: '/admin/users' },
          ],
          show: true,
        }
      );
    }

    return items;
  }, [user?.role]);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          NamingOps
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.children ? (
              <>
                <ListItemButton onClick={() => handleExpand(item.text)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {expanded[item.text] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={expanded[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.path}
                        sx={{ pl: 4 }}
                        selected={isActive(child.path)}
                        onClick={() => navigate(child.path)}
                      >
                        <ListItemText primary={child.text} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem 
                key={item.path}
                disablePadding
                onClick={isMobile ? handleDrawerToggle : undefined}
              >
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      <StyledDrawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={!isMobile || mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawer}
      </StyledDrawer>
    </Box>
  );
};

export default Sidebar;
