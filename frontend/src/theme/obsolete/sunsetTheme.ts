// FILE: frontend/src/theme/obsolete/sunsetTheme.ts
import { BRAND_HEX, Theme } from './types';

export const sunsetTheme: Theme = {
  id: 'sunset',
  name: 'Sunset',
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: '#fff6f0',
    backgroundAlt: '#ffe8d8',
    surface: '#ffffff',
    surfaceAlt: '#ffe1d2',

    border: '#f3c3a4',
    borderStrong: '#e49d75',

    text: '#2b130d',
    textMuted: '#8b5f56',
    textOnBrand: '#ffffff',

    primary: '#e5673a', // warm primary
    primarySoft: '#f79a72',
    primarySubtle: '#ffe0d1',

    brandAccent: BRAND_HEX, // teal when you want “on-brand”

    accent1: '#e43e6f', // hot rose
    accent2: '#f2b93d', // golden highlight
    accent3: '#7a3b7f', // plum
    accent4: BRAND_HEX, // teal controls

    success: '#3b9466',
    warning: '#e39b27',
    danger: '#d94352',
    info: '#3f8f8a',
  },
};

export default sunsetTheme;
