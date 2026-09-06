// FILE: frontend/src/theme/theme06.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const neonCircuitTheme: Theme = {
  id: "neonCircuit",
  name: "Neon Circuit",
  label: "Neon Circuit",
  icon: "🎛️",
  isDark: true,
  colors: {
    brand: BRAND_HEX,

    background: "#020316",   // deep indigo
    backgroundAlt: "#050726",
    surface: "#060a2e",
    surfaceAlt: "#080f3a",

    border: "#1b2550",
    borderStrong: "#2f3c7a",

    text: "#ecf3ff",
    textMuted: "#a4b0e0",
    textOnBrand: "#ffffff",

    primary: "#29a39a",      // bright teal-green
    primarySoft: "#5fd4c6",
    primarySubtle: "#043836",

    accent1: "#22f7ff",      // neon cyan
    accent2: "#ff3bf5",      // neon magenta
    accent3: "#c8ff4f",      // bright yellow-lime
    accent4: "#ffc857",      // amber
    accent5: BRAND_HEX,      // brand teal anchor

    focusRing: "rgba(34, 247, 255, 0.7)",

    menuSelectedBg: "#043836",
    menuSelectedText: "#ecf3ff",

    ...sharedStatusColors,
  },
};

export default neonCircuitTheme;
