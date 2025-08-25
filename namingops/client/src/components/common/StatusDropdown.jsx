import React from 'react';
import { Button, Menu, MenuItem, useTheme } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';

const STATUS_COLOR_MAP = (theme) => ({
  brand_review: theme.palette.info.main,
  legal_review: theme.palette.primary.main,
  on_hold: theme.palette.warning.main,
  approved: theme.palette.success.main,
  canceled: theme.palette.error.main,
  submitted: theme.palette.text.secondary,
});

export default function StatusDropdown({
  currentStatus,
  onChange,
  options,
  disabled = false,
  statusLabels = {},
}) {
  const theme = useTheme();
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

  const colorMap = STATUS_COLOR_MAP(theme);
  const color = colorMap[currentStatus] || theme.palette.text.secondary;
  const bgColor = open
    ? theme.palette.action.selected
    : theme.palette.background.paper;

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
          backgroundColor: bgColor,
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
            backgroundColor: theme.palette.action.hover,
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
              color: colorMap[opt.value] || theme.palette.text.secondary,
              fontWeight: 400,
              fontSize: '0.92rem',
            }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}