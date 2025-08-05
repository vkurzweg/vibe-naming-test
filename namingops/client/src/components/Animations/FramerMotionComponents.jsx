import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@mui/material';

// Animation Variants for consistent motion design
export const fadeInVariants = {
  hidden: { 
    opacity: 0,
    y: 20,
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1], // Material Design easing
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const slideInVariants = {
  hidden: { 
    opacity: 0,
    x: -30,
    scale: 0.95,
  },
  visible: { 
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const scaleInVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    rotateX: -15,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotateX: 15,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const bounceInVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.3,
    rotate: -180,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
      duration: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.3,
    rotate: 180,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Hover animation variants
export const hoverVariants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  },
  hover: { 
    scale: 1.02,
    y: -8,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  tap: { 
    scale: 0.98,
    y: -4,
    transition: {
      duration: 0.1,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Status indicator pulse animation
export const pulseVariants = {
  rest: { 
    scale: 1,
    opacity: 1,
  },
  pulse: { 
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Loading animation variants
export const loadingVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Page transition variants
export const pageTransitionVariants = {
  initial: { 
    opacity: 0,
    scale: 0.95,
    filter: "blur(10px)",
  },
  in: { 
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  out: { 
    opacity: 0,
    scale: 1.05,
    filter: "blur(10px)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Animated Components

// Animated Box wrapper
export const AnimatedBox = motion(Box);

// Fade In Animation Component
export const FadeIn = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={fadeInVariants}
    style={{ width: '100%' }}
    transition={{ delay }}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide In Animation Component
export const SlideIn = ({ children, direction = 'left', delay = 0, ...props }) => {
  const variants = {
    ...slideInVariants,
    hidden: {
      ...slideInVariants.hidden,
      x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
      y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
    },
    exit: {
      ...slideInVariants.exit,
      x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
      y: direction === 'up' ? -30 : direction === 'down' ? 30 : 0,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      style={{ width: '100%' }}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Scale In Animation Component
export const ScaleIn = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={scaleInVariants}
    style={{ width: '100%' }}
    transition={{ delay }}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger Container Component
export const StaggerContainer = ({ children, ...props }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={staggerContainerVariants}
    style={{ width: '100%' }}
    {...props}
  >
    {children}
  </motion.div>
);

// Bounce In Animation Component
export const BounceIn = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={bounceInVariants}
    style={{ width: '100%' }}
    transition={{ delay }}
    {...props}
  >
    {children}
  </motion.div>
);

// Hover Animation Component
export const HoverAnimation = ({ children, ...props }) => (
  <motion.div
    initial="rest"
    whileHover="hover"
    whileTap="tap"
    variants={hoverVariants}
    style={{ width: '100%' }}
    {...props}
  >
    {children}
  </motion.div>
);

// Pulse Animation Component
export const PulseAnimation = ({ children, shouldPulse = false, ...props }) => (
  <motion.div
    initial="rest"
    animate={shouldPulse ? "pulse" : "rest"}
    variants={pulseVariants}
    style={{ width: '100%' }}
    {...props}
  >
    {children}
  </motion.div>
);

// Loading Animation Component
export const LoadingAnimation = ({ children, ...props }) => (
  <motion.div
    animate="animate"
    variants={loadingVariants}
    style={{ 
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Page Transition Component
export const PageTransition = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageTransitionVariants}
    style={{ width: '100%', minHeight: '100vh' }}
    {...props}
  >
    {children}
  </motion.div>
);

// List Animation Component for dynamic lists
export const AnimatedList = ({ children, ...props }) => (
  <AnimatePresence mode="popLayout">
    <motion.div
      layout
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ width: '100%' }}
      {...props}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// Individual List Item Component
export const AnimatedListItem = ({ children, layoutId, ...props }) => (
  <motion.div
    layout
    layoutId={layoutId}
    variants={fadeInVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    style={{ width: '100%' }}
    {...props}
  >
    {children}
  </motion.div>
);

export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  StaggerContainer,
  BounceIn,
  HoverAnimation,
  PulseAnimation,
  LoadingAnimation,
  PageTransition,
  AnimatedList,
  AnimatedListItem,
  AnimatedBox,
};
