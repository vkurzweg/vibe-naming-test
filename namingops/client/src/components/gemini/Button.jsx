import React from 'react';
import styles from './Button.module.css';

export default function GeminiButton({ children = "Generate with Gemini", ...props }) {
  return (
    <button className={styles.geminiButton} {...props}>
      <img
        src="/gemini.png"
        alt="Gemini"
        className={styles.geminiImageIcon}
        draggable={false}
      />
      {children}
    </button>
  );
}