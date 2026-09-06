// FILE: frontend/src/theme/theme05.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const sunburstTheme: Theme = {
  id: "sunburst",
  name: "Sunburst",
  label: "Sunburst",
  icon: "🌅",
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: "#fff1eb",   // peach
    backgroundAlt: "#ffe0d5",
    surface: "#ffffff",
    surfaceAlt: "#ffe7dc",

    border: "#f5c1a3",
    borderStrong: "#e58f63",

    text: "#2b1510",
    textMuted: "#8b6155",
    textOnBrand: "#ffffff",

    primary: "#ff7a3c",      // hot orange
    primarySoft: "#ff9f66",
    primarySubtle: "#ffe0cf",

    brandAccent: BRAND_HEX,

    accent1: "#ff5c8a",      // hot pink
    accent2: "#ffb347",      // strong gold
    accent3: "#7c3aed",      // violet
    accent4: "#0f172a",      // deep navy

    menuSelectedBg: "#c2410c", // darker orange for contrast
    menuSelectedText: "#ffffff",

    ...sharedStatusColors,
  },
};

export default sunburstTheme;
