// FILE: frontend/src/theme/theme08.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const mauveAuroraTheme: Theme = {
  id: "mauveAurora",
  name: "Mauve Aurora",
  label: "Mauve Aurora",
  icon: "🌌",
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: "#faf3ff",   // pastel lavender
    backgroundAlt: "#f4e5ff",
    surface: "#ffffff",
    surfaceAlt: "#fdf5ff",

    border: "#e1d3ff",
    borderStrong: "#c7b3f5",

    text: "#261832",
    textMuted: "#7a678c",
    textOnBrand: "#ffffff",

    primary: "#b57cff",      // vivid mauve-violet
    primarySoft: "#cfa4ff",
    primarySubtle: "#efe2ff",

    brandAccent: BRAND_HEX,

    accent1: BRAND_HEX,      // teal anchor
    accent2: "#ff6f91",      // coral-rose
    accent3: "#ffd166",      // sunny yellow
    accent4: "#4dabf7",      // sky blue
    accent5: "#51cf66",      // fresh green

    menuSelectedBg: "#7c3aed",
    menuSelectedText: "#ffffff",

    ...sharedStatusColors,
  },
};

export default mauveAuroraTheme;
