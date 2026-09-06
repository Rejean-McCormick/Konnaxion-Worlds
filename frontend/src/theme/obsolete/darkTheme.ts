// FILE: frontend/src/theme/obsolete/darkTheme.ts
import { BRAND_HEX, Theme } from './types';

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  isDark: true,
  colors: {
    brand: BRAND_HEX,

    background: '#050a0a',
    backgroundAlt: '#071011',
    surface: '#0d1718',
    surfaceAlt: '#131f21',

    border: '#283638',
    borderStrong: '#3f5254',

    text: '#f3f7f7',
    textMuted: '#9bb0b2',
    textOnBrand: '#ffffff',

    primary: BRAND_HEX,
    primarySoft: '#2c807a',
    primarySubtle: '#102627',

    accent1: '#35b1a7', // teal-bright
    accent2: '#f2b451', // warm amber
    accent3: '#a98ef5', // violet

    success: '#3fbf7c',
    warning: '#fbbf4c',
    danger: '#ff6b6b',
    info: '#5bc7ff',
  },
};

export default darkTheme;
