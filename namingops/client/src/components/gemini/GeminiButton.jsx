import React from 'react';
import { Button } from '@mui/material';

export default function GeminiSparkle({ children = "Help from Gemini", ...props }) {
  return (
    <Button
      variant="outlined"
      sx={{
        width: { xs: '100%', sm: '60%', md: '50%' }, // Wider on desktop, full on mobile
        minWidth: 180,
        height: '56px',
        borderRadius: 2,
        border: '3px solid transparent',
        borderImage: 'linear-gradient(90deg, #5a46ff, #e05cff, #00d5ff, #00ffc8) 1',
        borderImageSlice: 1,
        padding: { xs: '0 10px', sm: '0 18px' },
        display: 'flex',
        alignItems: 'left',
        gap: 1.5,
        fontWeight: 400,
        fontSize: { xs: '0.95rem', sm: '0.98rem', md: '1rem' }, // Smaller text
        fontFamily: theme => theme.typography.fontFamily,
        color: theme => theme.palette.text.primary,
        textTransform: 'none',
        boxShadow: '0 2px 12px 0 rgba(90,70,255,0.10)',
        transition: 'filter 0.2s',
        '&:hover': {
          filter: 'brightness(1.08)',
          borderColor: 'transparent',
        },
      }}
      {...props}
    >
      <img
        src="/gemini.png"
        alt="Gemini"
        style={{
          width: 28,
          height: 28,
          marginRight: 8,
          verticalAlign: 'middle',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        draggable={false}
      />
      {children}
    </Button>
  );
}