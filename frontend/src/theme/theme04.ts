// FILE: frontend/src/theme/theme04.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const deepCurrentTheme: Theme = {
  id: "deepCurrent",
  name: "Deep Current",
  label: "Deep Current",
  icon: "🌊",
  isDark: true,
  colors: {
    brand: BRAND_HEX,

    background: "#041018",
    backgroundAlt: "#031725",
    surface: "#062234",
    surfaceAlt: "#0a2f43",

    border: "#134050",
    borderStrong: "#1f5870",

    text: "#e5f4f5",
    textMuted: "#93aeb5",
    textOnBrand: "#ffffff",

    primary: "#0f766e",      // rich teal
    primarySoft: "#14b8a6",
    primarySubtle: "#022c22",

    accent1: "#1d4ed8",      // blue
    accent2: "#22c55e",      // green
    accent3: "#f97316",      // orange
    accent4: "#e5e7eb",      // light neutral

    menuSelectedBg: "#0f766e",
    menuSelectedText: "#ffffff",

    ...sharedStatusColors,
  },
};

export default deepCurrentTheme;
