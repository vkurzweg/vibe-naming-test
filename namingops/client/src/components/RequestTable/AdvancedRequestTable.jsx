import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  IconButton,
  Typography,
  TablePagination,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  PlayArrow,
  Pause,
  Cancel,
  CheckCircle,
  Schedule,
  Error,
} from '@mui/icons-material';
import { getStatusColor } from '../../theme/newColorPalette';
import { format, parseISO } from 'date-fns';
import useRequestManagement from '../../hooks/useRequestManagement';

const columnHelper = createColumnHelper();

// Status filter options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'final_review', label: 'Final Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

// Request actions menu component
const RequestActionsMenu = ({ request, onAction }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    onAction(action, request);
    handleClose();
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        aria-label="request actions"
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        {['submitted', 'under_review'].includes(request.status) && (
          <MenuItem onClick={() => handleAction('claim')}>
            <PlayArrow sx={{ mr: 1 }} fontSize="small" />
            Claim
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction('hold')}>
          <Pause sx={{ mr: 1 }} fontSize="small" />
          Put on Hold
        </MenuItem>
        <MenuItem onClick={() => handleAction('cancel')}>
          <Cancel sx={{ mr: 1 }} fontSize="small" />
          Cancel
        </MenuItem>
      </Menu>
    </>
  );
};

const AdvancedRequestTable = ({ 
  requests = [], 
  role = 'reviewer',
  onRequestAction,
  onRequestSelect,
  isLoading = false 
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Request Title',
        cell: (info) => (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {info.getValue() || 'Untitled Request'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {info.row.original._id?.slice(-8) || 'N/A'}
            </Typography>
          </Box>
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('user.name', {
        header: 'Submitter',
        cell: (info) => (
          <Typography variant="body2">
            {info.getValue() || info.row.original.submitterName || 'Unknown User'}
          </Typography>
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Chip
            label={info.getValue()?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            size="small"
            sx={{
              backgroundColor: getStatusColor(info.getValue()),
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          />
        ),
        filterFn: (row, columnId, value) => {
          if (value === 'all') return true;
          return row.getValue(columnId) === value;
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Submitted',
        cell: (info) => (
          <Typography variant="body2">
            {formatDate(info.getValue() || info.row.original.created_at)}
          </Typography>
        ),
        sortingFn: 'datetime',
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last Updated',
        cell: (info) => (
          <Typography variant="body2">
            {formatDate(info.getValue() || info.row.original.updated_at)}
          </Typography>
        ),
        sortingFn: 'datetime',
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => {
          const createdDate = new Date(info.row.original.createdAt || info.row.original.created_at);
          const daysSinceCreated = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
          const isUrgent = daysSinceCreated > 5 && ['submitted', 'under_review'].includes(info.row.original.status);
          
          return (
            <Chip
              label={isUrgent ? 'URGENT' : 'NORMAL'}
              size="small"
              color={isUrgent ? 'error' : 'default'}
              variant={isUrgent ? 'filled' : 'outlined'}
            />
          );
        },
        sortingFn: (rowA, rowB) => {
          const getUrgency = (row) => {
            const createdDate = new Date(row.original.createdAt || row.original.created_at);
            const daysSinceCreated = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
            return daysSinceCreated > 5 && ['submitted', 'under_review'].includes(row.original.status) ? 1 : 0;
          };
          return getUrgency(rowB) - getUrgency(rowA);
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <RequestActionsMenu
            request={info.row.original}
            onAction={onRequestAction}
          />
        ),
      }),
    ],
    [onRequestAction]
  );

  // Filter data based on status filter
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter(request => request.status === statusFilter);
  }, [requests, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });

  return (
    <Box>
      {/* Filters and Search */}
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search requests..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {table.getFilteredRowModel().rows.length} of {requests.length} requests
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{ 
                      fontWeight: 600,
                      backgroundColor: 'grey.50',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default'
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Box display="flex" alignItems="center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <Box ml={1}>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUpward fontSize="small" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDownward fontSize="small" />
                          ) : null}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading requests...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No requests found matching your criteria
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'grey.50' }
                  }}
                  onClick={() => onRequestSelect && onRequestSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={table.getFilteredRowModel().rows.length}
        page={pagination.pageIndex}
        onPageChange={(_, newPage) => setPagination(prev => ({ ...prev, pageIndex: newPage }))}
        rowsPerPage={pagination.pageSize}
        onRowsPerPageChange={(e) => setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value, 10), pageIndex: 0 }))}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
    </Box>
  );
};

export default AdvancedRequestTable;
