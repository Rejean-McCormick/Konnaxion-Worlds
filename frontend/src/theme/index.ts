// FILE: frontend/src/theme/index.ts

import sandstoneTheme from "./theme01";
import blueCanvasTheme from "./theme02";
import midnightHarborTheme from "./theme03";
import deepCurrentTheme from "./theme04";
import sunburstTheme from "./theme05";
import neonCircuitTheme from "./theme06";
import candyCarnivalTheme from "./theme07";
import mauveAuroraTheme from "./theme08";
import type { Theme, ThemeId } from "./types";

export const allThemes: Theme[] = [
  sandstoneTheme,
  blueCanvasTheme,
  midnightHarborTheme,
  deepCurrentTheme,
  sunburstTheme,
  neonCircuitTheme,
  candyCarnivalTheme,
  mauveAuroraTheme,
];

export const defaultTheme = sandstoneTheme;

export const themeById: Record<ThemeId, Theme> = {
  sandstone: sandstoneTheme,
  blueCanvas: blueCanvasTheme,
  midnightHarbor: midnightHarborTheme,
  deepCurrent: deepCurrentTheme,
  sunburst: sunburstTheme,
  neonCircuit: neonCircuitTheme,
  candyCarnival: candyCarnivalTheme,
  mauveAurora: mauveAuroraTheme,
};

export {
  sandstoneTheme,
  blueCanvasTheme,
  midnightHarborTheme,
  deepCurrentTheme,
  sunburstTheme,
  neonCircuitTheme,
  candyCarnivalTheme,
  mauveAuroraTheme,
};
