import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';

const STATUS_COLOR_MAP = {
  brand_review: '#1976d2',
  legal_review: '#0288d1',
  on_hold: '#ffd600',
  approved: '#43a047',
  canceled: '#e53935',
  cancelled: '#e53935',
  submitted: '#757575',
};

export default function StatusDropdown({
  currentStatus,
  onChange,
  options,
  disabled = false,
  statusLabels = {},
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const optionLabel = options.find(opt => opt.value === currentStatus)?.label;
  const currentLabel = optionLabel || statusLabels[currentStatus] || currentStatus;
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (status) => {
    if (status !== currentStatus) {
      onChange(status);
    }
    handleClose();
  };

  const color = STATUS_COLOR_MAP[currentStatus] || '#757575';

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleClick}
        endIcon={<ArrowDropDown />}
        sx={{
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          height: 36,
          fontWeight: 400,
          fontSize: '0.92rem',
          textTransform: 'capitalize',
          borderColor: color,
          color: color,
          backgroundColor: open ? `${color}22` : 'background.paper',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.2,
          paddingLeft: 2,
          paddingRight: 2,
          '& .MuiButton-endIcon': {
            marginLeft: 1,
          },
          '&:hover': {
            borderColor: color,
            backgroundColor: `${color}11`,
          },
          transition: 'background 0.15s, color 0.15s, width 0.15s',
        }}
        disabled={disabled}
      >
        <span
          style={{
            display: 'block',
            width: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            textAlign: 'left',
            fontWeight: 400,
      fontSize: '0.92rem',
          }}
        >
          {currentLabel}
        </span>
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {options.map(opt => (
          <MenuItem
            key={opt.value}
            selected={opt.value === currentStatus}
            onClick={() => handleSelect(opt.value)}
            sx={{
              color: 'inherit',
              fontWeight: 400, // NORMAL
              fontSize: '0.92rem', // SMALLER
            }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}