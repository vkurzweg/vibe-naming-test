import React from 'react';
import InboxIcon from '@mui/icons-material/Inbox';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';

export const NAV_ITEMS = [
  {
    label: 'My Requests',
    path: '/my-requests',
    icon: <InboxIcon />,
    roles: ['submitter', 'reviewer', 'admin']
  },
  {
    label: 'Submit Request',
    path: '/submit-request',
    icon: <SendIcon />,
    roles: ['submitter', 'reviewer', 'admin']
  },
  {
    label: 'Review Queue',
    path: '/review-queue',
    icon: <AssignmentIcon />,
    roles: ['reviewer', 'admin']
  },
  {
    label: 'Form Configuration',
    path: '/form-config',
    icon: <SettingsIcon />,
    roles: ['admin']
  },
  {
    label: 'User Management',
    path: '/users',
    icon: <PeopleIcon />,
    roles: ['admin']
  },
  {
    label: 'Archive',
    path: '/archive',
    icon: <ArchiveIcon />,
    roles: ['submitter', 'reviewer', 'admin']
  },
  {
    label: 'Role Switcher',
    path: null,
    icon: <DeveloperModeIcon />,
    roles: ['submitter', 'reviewer', 'admin'],
    devOnly: true
  }
];
