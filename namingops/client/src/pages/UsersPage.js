import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TablePagination,
  TableSortLabel,
  TableFooter,
  LinearProgress,
  Snackbar,
  Fade,
  Zoom,
  Slide,
  Grow,
  Container,
  FormHelperText,
  InputAdornment,
  OutlinedInput,
  Input,
  NativeSelect,
  AppBar,
  Toolbar,
  ButtonBase,
  ButtonGroup,
  Fab,
  FormControlLabel,
  FormLabel,
  FormGroup,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  ListSubheader,
  ListItemAvatar,
  ListItemButton,
  Tabs,
  Tab
} from '@mui/material';

import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  selectAllUsers, 
  selectUsersLoading, 
  selectUsersError,
  selectSelectedUser,
  setSelectedUser,
  clearError
} from '../features/admin/usersSlice';

import {
  // Basic Icons
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  Gavel as GavelIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  ManageAccounts as ManageAccountsIcon,
  AccountCircle as AccountCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarTodayIcon,
  EventNote as EventNoteIcon,
  AccessTime as AccessTimeIcon,
  Schedule as ScheduleIcon,
  Timelapse as TimelapseIcon,
  Timer as TimerIcon,
  HourglassEmpty as HourglassEmptyIcon,
  HourglassFull as HourglassFullIcon,
  // Notification Icons
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  NotificationsNone as NotificationsNoneIcon,
  NotificationsPaused as NotificationsPausedIcon,
  NotificationsOutlined as NotificationsOutlinedIcon,
  NotificationsActiveOutlined as NotificationsActiveOutlinedIcon,
  NotificationsOffOutlined as NotificationsOffOutlinedIcon,
  NotificationsNoneOutlined as NotificationsNoneOutlinedIcon,
  NotificationsPausedOutlined as NotificationsPausedOutlinedIcon,
  NotificationsRounded as NotificationsRoundedIcon,
  NotificationsActiveRounded as NotificationsActiveRoundedIcon,
  NotificationsOffRounded as NotificationsOffRoundedIcon,
  NotificationsNoneRounded as NotificationsNoneRoundedIcon,
  NotificationsPausedRounded as NotificationsPausedRoundedIcon,
  NotificationsSharp as NotificationsSharpIcon,
  NotificationsActiveSharp as NotificationsActiveSharpIcon,
  NotificationsOffSharp as NotificationsOffSharpIcon,
  NotificationsNoneSharp as NotificationsNoneSharpIcon,
  NotificationsPausedSharp as NotificationsPausedSharpIcon,
  NotificationsTwoTone as NotificationsTwoToneIcon,
  NotificationsActiveTwoTone as NotificationsActiveTwoToneIcon,
  NotificationsOffTwoTone as NotificationsOffTwoToneIcon,
  NotificationsNoneTwoTone as NotificationsNoneTwoToneIcon,
  NotificationsPausedTwoTone as NotificationsPausedTwoToneIcon,
} from '@mui/icons-material';

const UsersPage = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const selectedUser = useSelector(selectSelectedUser);
  
  const [editingUserId, setEditingUserId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Available roles
  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'reviewer', label: 'Reviewer' },
    { value: 'submitter', label: 'Submitter' },
  ];

  // Load users on component mount and handle errors
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await dispatch(fetchUsers()).unwrap();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error || 'Failed to load users',
          severity: 'error'
        });
      }
    };
    
    loadUsers();
    
    // Cleanup on unmount
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Filter users based on role and search term
  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(updateUser({ 
        id: userId, 
        userData: { role: newRole } 
      })).unwrap();
      
      setEditingUserId(null);
      setSnackbar({
        open: true,
        message: 'User role updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || 'Failed to update user role',
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await dispatch(deleteUser(userToDelete.id)).unwrap();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: error || 'Failed to delete user',
          severity: 'error'
        });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'reviewer':
        return 'primary';
      case 'submitter':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error message if there's an error and no users are loaded
  if (error && users.length === 0) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            label="Search Users"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Role</InputLabel>
            <MuiSelect
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Filter by Role"
            >
              <MenuItem value="all">All Roles</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow 
                    key={user._id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar 
                          src={user.picture} 
                          alt={user.name}
                          sx={{ width: 32, height: 32 }}
                        >
                          {user.name?.charAt(0) || <PersonIcon />}
                        </Avatar>
                        {user.name || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {editingUserId === user._id ? (
                        <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
                          <MuiSelect
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            label="Role"
                          >
                            {roles.map((role) => (
                              <MenuItem key={role.value} value={role.value}>
                                {role.label}
                              </MenuItem>
                            ))}
                          </MuiSelect>
                        </FormControl>
                      ) : (
                        <Chip 
                          label={user.role} 
                          color={getRoleColor(user.role)}
                          size="small"
                          variant={user.role === 'admin' ? 'filled' : 'outlined'}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'} 
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {editingUserId === user._id ? (
                        <>
                          <Tooltip title="Save">
                            <IconButton size="small" color="primary">
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small" 
                              onClick={() => setEditingUserId(null)}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => setEditingUserId(user._id)}
                              disabled={user.role === 'admin'}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(user)}
                              disabled={user.role === 'admin'}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete user: <strong>{userToDelete?.name || userToDelete?.email}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
