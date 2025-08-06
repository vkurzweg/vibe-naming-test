/**
 * This file serves as an alias for react/jsx-runtime to help resolve module resolution issues
 * with Material UI, Framer Motion, and other ESM packages.
 */
import * as jsxRuntime from 'react/jsx-runtime';

export const jsx = jsxRuntime.jsx;
export const jsxs = jsxRuntime.jsxs;
export const Fragment = jsxRuntime.Fragment;

// Export the entire module as default
export default jsxRuntime;
