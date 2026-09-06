// FILE: frontend/src/theme/obsolete/types.ts
export type ThemeId =
  | 'light'
  | 'modern'
  | 'dark'
  | 'ocean'
  | 'sunset'
  | 'cyber'
  | 'funky'
  | 'mauveRainbow';

export interface ThemeColors {
  // Brand + primary stack
  brand: string;
  primary: string;
  primarySoft: string;
  primarySubtle: string;

  // Surfaces
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;

  // Borders
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textMuted: string;
  textOnBrand: string;

  // Accents
  accent1?: string;
  accent2?: string;
  accent3?: string;
  accent4?: string;
  accent5?: string;

  // Optional extras
  brandAccent?: string;
  focusRing?: string;

  // Status colors
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const BRAND_HEX = '#1e6864';

export const sharedStatusColors: Pick<
  ThemeColors,
  'success' | 'warning' | 'danger' | 'info'
> = {
  success: '#2f9e63',
  warning: '#e39b27',
  danger: '#d14444',
  info: '#3b8a86',
};
