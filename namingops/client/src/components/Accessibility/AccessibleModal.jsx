import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  Fade,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const AccessibleModal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'md',
  fullWidth = true,
  disableBackdropClick = false,
  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  const theme = useTheme();

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: theme.zIndex.modal,
              backdropFilter: 'blur(4px)',
            }}
            onClick={disableBackdropClick ? undefined : onClose}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <Fade in={open} timeout={200}>
            <Box
              sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: fullWidth ? '90vw' : 'auto',
                maxWidth: maxWidth === 'xs' ? 400 : 
                         maxWidth === 'sm' ? 600 :
                         maxWidth === 'md' ? 900 :
                         maxWidth === 'lg' ? 1200 :
                         maxWidth === 'xl' ? 1536 : 900,
                maxHeight: '90vh',
                backgroundColor: theme.palette.background.paper,
                borderRadius: theme.shape.borderRadius * 2,
                boxShadow: theme.shadows[24],
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                zIndex: theme.zIndex.modal + 1,
                '&:focus': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ariaLabelledBy || 'modal-title'}
              aria-describedby={ariaDescribedBy}
              tabIndex={-1}
            >
              {/* Header */}
              {title && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  <Dialog.Title asChild>
                    <Typography
                      id={ariaLabelledBy || 'modal-title'}
                      variant="h6"
                      component="h2"
                      sx={{ fontWeight: 600 }}
                    >
                      {title}
                    </Typography>
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <IconButton
                      onClick={onClose}
                      size="small"
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                      aria-label="Close modal"
                    >
                      <Close />
                    </IconButton>
                  </Dialog.Close>
                </Box>
              )}

              {/* Content */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: title ? 3 : 0,
                }}
                id={ariaDescribedBy}
              >
                {children}
              </Box>
            </Box>
          </Fade>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AccessibleModal;
