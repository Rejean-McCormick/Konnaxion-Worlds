// FILE: frontend/src/theme/types.ts
export type ThemeId =
  | "sandstone"
  | "blueCanvas"
  | "midnightHarbor"
  | "deepCurrent"
  | "sunburst"
  | "neonCircuit"
  | "candyCarnival"
  | "mauveAurora";

export interface ThemeColors {
  // Brand + primary
  brand: string;
  primary: string;
  primarySoft: string;
  primarySubtle: string;

  // Surfaces
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;

  // Borders
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textMuted: string;
  textOnBrand: string;

  // Accents
  accent1?: string;
  accent2?: string;
  accent3?: string;
  accent4?: string;
  accent5?: string;

  // Sidebar/menu selection helpers
  menuSelectedBg?: string;
  menuSelectedText?: string;

  // Optional extras
  brandAccent?: string;
  focusRing?: string;

  // Status colors
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface Theme {
  id: ThemeId;
  name: string;   // internal / free use
  label: string;  // what you show in ThemeSwitcher
  icon: string;   // emoji/icon for ThemeSwitcher
  isDark: boolean;
  colors: ThemeColors;
}

export const BRAND_HEX = "#1e6864";

export const sharedStatusColors: Pick<
  ThemeColors,
  "success" | "warning" | "danger" | "info"
> = {
  success: "#2f9e63", // muted green
  warning: "#e39b27", // muted amber
  danger: "#d14444",  // muted red
  info: "#3b8a86",    // teal-ish info
};
