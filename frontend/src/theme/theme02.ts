// FILE: frontend/src/theme/theme02.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const blueCanvasTheme: Theme = {
  id: "blueCanvas",
  name: "Blue Canvas",
  label: "Blue Canvas",
  icon: "🖌️",
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: "#f3f6ff",
    backgroundAlt: "#e0e7ff",
    surface: "#ffffff",
    surfaceAlt: "#edf2ff",

    border: "#c7d2fe",
    borderStrong: "#94a3ff",

    text: "#020617",
    textMuted: "#6b7280",
    textOnBrand: "#ffffff",

    primary: "#2563eb",      // vivid blue
    primarySoft: "#60a5fa",
    primarySubtle: "#dbeafe",

    accent1: "#7c3aed",      // violet
    accent2: "#f97316",      // orange
    accent3: "#22c55e",      // green

    menuSelectedBg: "#2563eb",
    menuSelectedText: "#ffffff",

    ...sharedStatusColors,
  },
};

export default blueCanvasTheme;
