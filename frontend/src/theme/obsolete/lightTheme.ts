// FILE: frontend/src/theme/obsolete/lightTheme.ts
import { BRAND_HEX, sharedStatusColors, Theme } from './types';

export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: '#f5f7f7',
    backgroundAlt: '#edf2f2',
    surface: '#ffffff',
    surfaceAlt: '#f3f6f6',

    border: '#d1dcdb',
    borderStrong: '#aabcbc',

    text: '#111b1b',
    textMuted: '#657373',
    textOnBrand: '#ffffff',

    primary: BRAND_HEX,
    primarySoft: '#3e8b86',
    primarySubtle: '#d6e7e5',

    accent1: '#2563eb', // action blue
    accent2: '#f97316', // highlight orange
    accent3: '#22c55e', // positive / CTA green

    ...sharedStatusColors,
  },
};

export default lightTheme;
