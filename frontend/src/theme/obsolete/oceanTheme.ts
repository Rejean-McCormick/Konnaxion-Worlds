// FILE: frontend/src/theme/obsolete/oceanTheme.ts
import { BRAND_HEX, Theme } from './types';

export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Ocean',
  isDark: true,
  colors: {
    brand: BRAND_HEX,

    background: '#020910',
    backgroundAlt: '#02141f',
    surface: '#041a26',
    surfaceAlt: '#072733',

    border: '#133745',
    borderStrong: '#21556b',

    text: '#e6f4f5',
    textMuted: '#8ba9b1',
    textOnBrand: '#ffffff',

    primary: BRAND_HEX,
    primarySoft: '#2f8b85',
    primarySubtle: '#0c3038',

    accent1: '#1f4f96', // deep ocean blue
    accent2: '#27c5c2', // aqua
    accent3: '#5fa853', // kelp green
    accent4: '#9f7aea', // soft violet

    success: '#3fbf7c',
    warning: '#f1b754',
    danger: '#ff6b7a',
    info: '#35b5ff',
  },
};

export default oceanTheme;
