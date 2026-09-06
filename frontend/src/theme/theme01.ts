// FILE: frontend/src/theme/theme01.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const sandstoneTheme: Theme = {
  id: "sandstone",
  name: "Sandstone",
  label: "Sandstone",
  icon: "🏜️",
  isDark: false,
  colors: {
    // Logo is teal; palette is warm sand/terracotta
    brand: BRAND_HEX,

    background: "#f5f1ea",
    backgroundAlt: "#ebe3d9",
    surface: "#ffffff",
    surfaceAlt: "#f2ece2",

    border: "#d4c8b9",
    borderStrong: "#aa9d8a",

    text: "#1e2524",
    textMuted: "#6c706b",
    textOnBrand: "#ffffff",

    primary: "#c46b47",      // terracotta
    primarySoft: "#e07a5f",
    primarySubtle: "#fbe1d4",

    accent1: "#e5a04f",      // muted golden
    accent2: "#32556b",      // muted blue
    accent3: "#8b6b56",      // warm brown

    // sidebar selected item – dark bg + white text
    menuSelectedBg: "#8c3a20",
    menuSelectedText: "#ffffff",

    ...sharedStatusColors,
  },
};

export default sandstoneTheme;
