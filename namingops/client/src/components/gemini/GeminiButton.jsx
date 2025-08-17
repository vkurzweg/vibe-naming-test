import React from 'react';
import { Button } from '@mui/material';
import styles from './GeminiButton.module.css';

export default function GeminiSparkle ({ children = "Generate with Gemini", ...props }) {
  return (
    <Button  variant="outlined" sx={{ width: '35%', borderRadius: '8px', borderImageSource: 'linear-gradient(90deg, #5a46ff, #e05cff, #00d5ff, #00ffc8)1', borderImageSlice: '1', border: '3px solid transparent', padding: '1rem' }} {...props}>
      <img
        src="/gemini.png"
        alt="Gemini"
        className={styles.geminiImageIcon}
        draggable={false}
      />
      {children}
    </Button>
  );
}