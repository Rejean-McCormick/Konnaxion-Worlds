// FILE: frontend/src/theme/theme07.ts
import type { Theme } from "./types";
import { BRAND_HEX, sharedStatusColors } from "./types";

const candyCarnivalTheme: Theme = {
  id: "candyCarnival",
  name: "Candy Carnival",
  label: "Candy Carnival",
  icon: "🎡",
  isDark: false,
  colors: {
    brand: BRAND_HEX,

    background: "#fffdf0",    // pale yellow
    backgroundAlt: "#ffe6ff", // pale magenta
    surface: "#ffffff",
    surfaceAlt: "#fff7f1",

    border: "#ffe4b5",
    borderStrong: "#f9a8d4",

    text: "#26110f",
    textMuted: "#7a5148",
    textOnBrand: "#ffffff",

    primary: "#1e9b8c",       // bright teal-leaning CTA
    primarySoft: "#64d2c4",
    primarySubtle: "#d3f4ef",

    accent1: "#ff4b5c",       // bright red/pink
    accent2: "#ffd93d",       // bright yellow
    accent3: "#2f80ff",       // bright blue
    accent4: "#22c55e",       // bright green
    accent5: BRAND_HEX,       // teal brand anchor

    menuSelectedBg: "#1e9b8c",
    menuSelectedText: "#ffffff",

    ...sharedStatusColors,
  },
};

export default candyCarnivalTheme;
