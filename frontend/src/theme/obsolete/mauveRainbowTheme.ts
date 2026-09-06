// FILE: frontend/src/theme/obsolete/mauveRainbowTheme.ts
import { BRAND_HEX, Theme } from './types';

export const mauveRainbowTheme: Theme = {
  id: 'mauveRainbow',
  name: 'Mauve Rainbow',
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: '#faf7ff',
    backgroundAlt: '#f5f0ff',
    surface: '#ffffff',
    surfaceAlt: '#f8f4ff',

    border: '#e0d4ff',
    borderStrong: '#c6b4f5',

    text: '#23182e',
    textMuted: '#726381',
    textOnBrand: '#ffffff',

    primary: '#7b4ae2', // mauve-violet
    primarySoft: '#a27af0',
    primarySubtle: '#ebe1ff',

    brandAccent: BRAND_HEX, // teal as secondary brand anchor

    accent1: BRAND_HEX, // teal
    accent2: '#ff7a88', // coral
    accent3: '#f4c94b', // gold
    accent4: '#4fb8ff', // sky blue
    accent5: '#81e26a', // lime

    success: '#4bbf83',
    warning: '#f0c25b',
    danger: '#e65a7b',
    info: '#5ba9ff',
  },
};

export default mauveRainbowTheme;
