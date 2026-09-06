// FILE: frontend/src/theme/theme03.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const midnightHarborTheme: Theme = {
  id: "midnightHarbor",
  name: "Midnight Harbor",
  label: "Midnight Harbor",
  icon: "🌌",
  isDark: true,
  colors: {
    brand: BRAND_HEX,

    background: "#020617",
    backgroundAlt: "#020b16",
    surface: "#020b16",
    surfaceAlt: "#111827",

    border: "#1f2937",
    borderStrong: "#374151",

    text: "#e5e7eb",
    textMuted: "#9ca3af",
    textOnBrand: "#ffffff",

    primary: "#1d4ed8",      // indigo
    primarySoft: "#3b82f6",
    primarySubtle: "#1e293b",

    accent1: "#f97316",      // orange
    accent2: "#facc15",      // yellow
    accent3: "#22c55e",      // green

    menuSelectedBg: "#1d4ed8",
    menuSelectedText: "#ffffff",

    ...sharedStatusColors,
  },
};

export default midnightHarborTheme;
