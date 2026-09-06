// FILE: frontend/src/theme/obsolete/funkyTheme.ts
import { BRAND_HEX, Theme } from './types';

export const funkyTheme: Theme = {
  id: 'funky',
  name: 'Funky',
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: '#fef6ff',
    backgroundAlt: '#ffeefd',
    surface: '#ffffff',
    surfaceAlt: '#ffeaf9',

    border: '#f0c6f1',
    borderStrong: '#e29adf',

    text: '#261425',
    textMuted: '#7a5477',
    textOnBrand: '#ffffff',

    primary: BRAND_HEX,
    primarySoft: '#3c8a83',
    primarySubtle: '#d0ece9',

    accent1: '#ff3e9e', // hot pink
    accent2: '#7b3bff', // violet
    accent3: '#ffdf37', // yellow
    accent4: '#ff8b3d', // orange
    accent5: '#39e2c0', // aqua

    success: '#3bbf7d',
    warning: '#ffbf3f',
    danger: '#ff4c6a',
    info: '#3f9fff',
  },
};

export default funkyTheme;
