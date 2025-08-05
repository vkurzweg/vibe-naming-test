// Accessibility utilities for WCAG compliance and enhanced UX

/**
 * Check if a color meets WCAG contrast ratio requirements
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {string} level - WCAG level ('AA' or 'AAA')
 * @returns {boolean} - Whether the contrast ratio meets requirements
 */
export const meetsContrastRequirement = (foreground, background, level = 'AA') => {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = level === 'AAA' ? 7 : 4.5;
  return ratio >= minRatio;
};

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {number} - Contrast ratio
 */
export const getContrastRatio = (color1, color2) => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Get relative luminance of a color
 * @param {string} color - Color (hex)
 * @returns {number} - Relative luminance
 */
export const getLuminance = (color) => {
  const rgb = hexToRgb(color);
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color
 * @returns {number[]} - RGB values
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

/**
 * Generate accessible focus styles
 * @param {object} theme - Material UI theme
 * @returns {object} - Focus styles
 */
export const getFocusStyles = (theme) => ({
  '&:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
    borderRadius: theme.shape.borderRadius,
  },
  '&:focus:not(:focus-visible)': {
    outline: 'none',
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
});

/**
 * Generate accessible button styles
 * @param {object} theme - Material UI theme
 * @param {string} variant - Button variant
 * @returns {object} - Button styles
 */
export const getAccessibleButtonStyles = (theme, variant = 'contained') => ({
  minHeight: 44, // WCAG minimum touch target size
  minWidth: 44,
  ...getFocusStyles(theme),
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  '&:hover:not(:disabled)': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[4],
  },
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
});

/**
 * Generate skip link styles for keyboard navigation
 * @param {object} theme - Material UI theme
 * @returns {object} - Skip link styles
 */
export const getSkipLinkStyles = (theme) => ({
  position: 'absolute',
  top: -40,
  left: 6,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  textDecoration: 'none',
  borderRadius: theme.shape.borderRadius,
  zIndex: theme.zIndex.tooltip,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 600,
  '&:focus': {
    top: 6,
  },
});

/**
 * Announce content to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Announcement priority ('polite' or 'assertive')
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Trap focus within a container
 * @param {HTMLElement} container - Container element
 * @returns {function} - Cleanup function
 */
export const trapFocus = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Generate ARIA attributes for form fields
 * @param {object} field - Field configuration
 * @param {object} errors - Form errors
 * @returns {object} - ARIA attributes
 */
export const getFieldAriaAttributes = (field, errors = {}) => {
  const fieldError = errors[field.name];
  const attributes = {
    'aria-required': field.required || false,
    'aria-invalid': !!fieldError,
  };

  if (field.description) {
    attributes['aria-describedby'] = `${field.name}-description`;
  }

  if (fieldError) {
    attributes['aria-describedby'] = `${field.name}-error`;
  }

  if (field.description && fieldError) {
    attributes['aria-describedby'] = `${field.name}-description ${field.name}-error`;
  }

  return attributes;
};

/**
 * Generate accessible status indicators
 * @param {string} status - Status value
 * @param {object} theme - Material UI theme
 * @returns {object} - Status indicator props
 */
export const getAccessibleStatusProps = (status, theme) => {
  const statusConfig = {
    draft: { 
      label: 'Draft', 
      color: theme.palette.grey[600],
      icon: '📝',
      ariaLabel: 'Status: Draft - Request is being prepared'
    },
    submitted: { 
      label: 'Submitted', 
      color: theme.palette.info.main,
      icon: '📤',
      ariaLabel: 'Status: Submitted - Request has been submitted for review'
    },
    under_review: { 
      label: 'Under Review', 
      color: theme.palette.warning.main,
      icon: '👀',
      ariaLabel: 'Status: Under Review - Request is currently being reviewed'
    },
    approved: { 
      label: 'Approved', 
      color: theme.palette.success.main,
      icon: '✅',
      ariaLabel: 'Status: Approved - Request has been approved'
    },
    rejected: { 
      label: 'Rejected', 
      color: theme.palette.error.main,
      icon: '❌',
      ariaLabel: 'Status: Rejected - Request has been rejected'
    },
    on_hold: { 
      label: 'On Hold', 
      color: theme.palette.grey[500],
      icon: '⏸️',
      ariaLabel: 'Status: On Hold - Request is temporarily paused'
    },
  };

  return statusConfig[status] || statusConfig.draft;
};
