import React, { useEffect, useRef } from 'react';

const AudioFeedback = () => {
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Initialize Web Audio API context (only if supported)
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play subtle click sound for user actions
  const playClickSound = () => {
    if (!audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Very subtle, short click sound
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContextRef.current.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.05);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.05);
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Audio feedback not available:', error);
    }
  };

  // Play success sound for completed actions
  const playSuccessSound = () => {
    if (!audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Gentle ascending tone for success
      oscillator.frequency.setValueAtTime(523, audioContextRef.current.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, audioContextRef.current.currentTime + 0.1); // E5

      gainNode.gain.setValueAtTime(0.08, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
    } catch (error) {
      console.debug('Audio feedback not available:', error);
    }
  };

  // Expose audio functions globally for other components to use
  useEffect(() => {
    window.audioFeedback = {
      click: playClickSound,
      success: playSuccessSound,
    };

    return () => {
      delete window.audioFeedback;
    };
  }, []);

  // This component renders nothing - it's purely for audio functionality
  return null;
};

export default AudioFeedback;
