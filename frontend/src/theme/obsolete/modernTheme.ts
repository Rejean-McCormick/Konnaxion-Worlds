// FILE: frontend/src/theme/obsolete/modernTheme.ts
import { BRAND_HEX, sharedStatusColors, Theme } from './types';

export const modernTheme: Theme = {
  id: 'modern',
  name: 'Modern',
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: '#f2f5f5',
    backgroundAlt: '#e6eeee',
    surface: '#ffffff',
    surfaceAlt: '#eef4f4',

    border: '#c7d7d6',
    borderStrong: '#9fb8b6',

    text: '#101919',
    textMuted: '#5e6f6f',
    textOnBrand: '#ffffff',

    primary: BRAND_HEX,
    primarySoft: '#41918b',
    primarySubtle: '#d0e4e2',

    // SaaS-style accent stack
    accent1: '#2563eb', // main call-to-action
    accent2: '#7c3aed', // secondary
    accent3: '#f97373', // destructive / error
    accent4: '#facc15', // warning / highlight

    ...sharedStatusColors,
  },
};

export default modernTheme;
