// FILE: frontend/src/theme/obsolete/index.ts

import cyberTheme from './cyberTheme';
import darkTheme from './darkTheme';
import funkyTheme from './funkyTheme';
import lightTheme from './lightTheme';
import mauveRainbowTheme from './mauveRainbowTheme';
import modernTheme from './modernTheme';
import oceanTheme from './oceanTheme';
import sunsetTheme from './sunsetTheme';
import type { Theme, ThemeId } from './types';

export const allThemes: Theme[] = [
  lightTheme,
  modernTheme,
  darkTheme,
  oceanTheme,
  sunsetTheme,
  cyberTheme,
  funkyTheme,
  mauveRainbowTheme,
];

export const defaultTheme = lightTheme;

export const themeById: Record<ThemeId, Theme> = allThemes.reduce(
  (map, theme) => {
    map[theme.id] = theme;
    return map;
  },
  {} as Record<ThemeId, Theme>,
);

export {
  lightTheme,
  modernTheme,
  darkTheme,
  oceanTheme,
  sunsetTheme,
  cyberTheme,
  funkyTheme,
  mauveRainbowTheme,
};
