// FILE: frontend/src/theme/obsolete/cyberTheme.ts
import { BRAND_HEX, Theme } from './types';

export const cyberTheme: Theme = {
  id: 'cyber',
  name: 'Cyber',
  isDark: true,
  colors: {
    brand: BRAND_HEX,

    background: '#04040a',
    backgroundAlt: '#050713',
    surface: '#070b1a',
    surfaceAlt: '#090f24',

    border: '#1b2345',
    borderStrong: '#2b3560',

    text: '#e8efff',
    textMuted: '#9ba3d6',
    textOnBrand: '#ffffff',

    primary: BRAND_HEX,
    primarySoft: '#35a79f',
    primarySubtle: '#062626',

    // Neon stack
    accent1: '#22f6ff', // cyan
    accent2: '#ff2ce3', // magenta
    accent3: '#b6ff3b', // lime
    accent4: '#ff8a3b', // orange

    focusRing: 'rgba(34, 246, 255, 0.5)',

    success: '#54ff9e',
    warning: '#ffd763',
    danger: '#ff4f73',
    info: '#3bd4ff',
  },
};

export default cyberTheme;
