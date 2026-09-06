// FILE: frontend/context/ThemeContext.tsx
'use client'

import { App as AntdApp, theme as antdTheme, ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'

import { defaultTheme, themeById } from '@/theme'
import type { ThemeColors, ThemeId, Theme as ThemeModel } from '@/theme/types'

/** Theme ids from the registry */
type ThemeType = ThemeId

/** What the rest of the app sees as “tokens” */
type TokenBag = ThemeColors & {
  id: ThemeId
  name: string
  /** UI label used by ThemeSwitcher */
  label: string
  /** Icon/emoji used by ThemeSwitcher */
  icon?: string
  isDark: boolean
  // Convenience fields for CSS vars / layout
  bgMain: string
  bgLight: string
  bgDark: string
  textMain: string
  accent: string
}

/** Custom CSS variables to export on <html> */
const cssVars = ['bgMain', 'bgLight', 'bgDark', 'textMain', 'accent', 'brand', 'brandText'] as const
type CssVarKey = (typeof cssVars)[number]

/** All known theme keys from the registry */
const THEME_KEYS = Object.keys(themeById) as ThemeType[]

interface ThemeContextProps {
  token: Readonly<Partial<TokenBag>>
  themeType: ThemeType
  setThemeType: (t: ThemeType) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextProps | null>(null)

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return ctx
}

/** Strip keys whose value is an empty object */
const pruneEmptyObjects = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v && (typeof v !== 'object' || Object.keys(v).length > 0),
    ),
  ) as T

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  /** Current theme id */
  const [themeType, setThemeType] = useState<ThemeType>(defaultTheme.id)

  /** Restore from localStorage on client */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('themeType') as ThemeType | null
      if (saved && THEME_KEYS.includes(saved)) {
        setThemeType(saved)
      }
    } catch {
      // Storage unavailable: ignore
    }
  }, [])

  /** Current theme from registry */
  const currentTheme: ThemeModel = useMemo(
    () => themeById[themeType] ?? defaultTheme,
    [themeType],
  )

  const colors: ThemeColors = currentTheme.colors

  /** Palette + meta + convenience fields */
  const tokenBag: TokenBag = useMemo(
    () => ({
      id: currentTheme.id,
      name: currentTheme.name,
      label: currentTheme.label ?? currentTheme.name,
      icon: currentTheme.icon,
      isDark: currentTheme.isDark,
      ...colors,
      bgMain: colors.background,
      bgLight: colors.surface,
      bgDark: colors.backgroundAlt ?? colors.surfaceAlt ?? colors.background,
      textMain: colors.text,
      accent: colors.accent1 ?? colors.primary ?? colors.brand,
    }),
    [
      currentTheme.id,
      currentTheme.name,
      currentTheme.label,
      currentTheme.icon,
      currentTheme.isDark,
      colors,
    ],
  )

  /** Frozen token for consumers (includes id/name/label/icon) */
  const safeToken: Readonly<Partial<TokenBag>> = useMemo(
    () => Object.freeze({ ...tokenBag }),
    [tokenBag],
  )

  /** data-theme + CSS classes + CSS variables on <html> */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const html = document.documentElement

    // data-theme attribute
    html.setAttribute('data-theme', themeType)

    // Normalized classes
    THEME_KEYS.forEach(k => html.classList.remove(`theme-${k}`))
    html.classList.add(`theme-${themeType}`)

    // Custom CSS variables
    const cssValues: Record<CssVarKey, string | undefined> = {
      bgMain: tokenBag.bgMain,
      bgLight: tokenBag.bgLight,
      bgDark: tokenBag.bgDark,
      textMain: tokenBag.textMain,
      accent: tokenBag.accent,
      brand: tokenBag.brand,
      brandText: tokenBag.textOnBrand,
    }

    cssVars.forEach(key => {
      const name = `--${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`
      const val = cssValues[key]
      if (val != null) {
        html.style.setProperty(name, String(val))
      } else {
        html.style.removeProperty(name)
      }
    })
  }, [themeType, tokenBag])

  /** Persist current theme id */
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('themeType', themeType)
    } catch {
      // Storage unavailable: ignore
    }
  }, [themeType])

  /** Cycle through themes in THEME_KEYS order */
  const cycleTheme = () => {
    const keys = THEME_KEYS.length > 0 ? THEME_KEYS : ([defaultTheme.id] as ThemeType[])
    const idx = keys.indexOf(themeType)
    const next = keys[(idx + 1) % keys.length] ?? defaultTheme.id
    setThemeType(next)
  }

  /** Light vs dark algorithm for AntD */
  const algorithm =
    currentTheme.isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm

  /** Global AntD token overrides derived from palette */
  const tokenOverrides = useMemo(() => {
    const c = colors
    return {
      // Core semantic colors
      colorPrimary: c.primary ?? c.brand,
      colorInfo: c.accent1 ?? c.primary ?? c.brand,
      colorSuccess: c.success,
      colorWarning: c.warning,
      colorError: c.danger,

      // Backgrounds
      colorBgBase: c.background,
      colorBgLayout: c.background,
      colorBgContainer: c.surface,
      colorBgElevated: c.surfaceAlt ?? c.surface,

      // Text
      colorTextBase: c.text,
      colorText: c.text,
      colorTextSecondary: c.textMuted ?? c.text,
      colorTextTertiary: c.textMuted ?? c.text,
      colorTextPlaceholder: c.textMuted ?? c.text,
      colorTextDisabled: c.textMuted ?? c.text,

      // Borders
      colorBorder: c.border,
      colorSplit: c.borderStrong ?? c.border,
    }
  }, [colors])

  /** Component-level overrides from palette */
  const componentsOverrides = useMemo(
    () =>
      pruneEmptyObjects({
        Layout: {
          siderBg: colors.backgroundAlt ?? colors.background,
        },
        Menu: pruneEmptyObjects({
          itemBg: colors.surface,
          itemColor: colors.textMuted ?? colors.text,
          itemHoverBg: colors.backgroundAlt ?? colors.surfaceAlt ?? colors.surface,
          itemSelectedBg:
            colors.menuSelectedBg ??
            colors.primarySubtle ??
            colors.accent1 ??
            colors.surfaceAlt ??
            colors.surface,
          itemSelectedColor:
            colors.menuSelectedText ??
            colors.textOnBrand ??
            '#ffffff',
        }),
        Dropdown: pruneEmptyObjects({
          colorBgElevated: colors.surfaceAlt ?? colors.surface,
          controlItemBgHover:
            colors.primarySubtle ??
            colors.accent1 ??
            colors.surfaceAlt ??
            colors.surface,
        }),
        Popconfirm: pruneEmptyObjects({
          colorBgElevated: colors.surfaceAlt ?? colors.surface,
        }),
        Table: pruneEmptyObjects({
          headerBg: colors.surfaceAlt ?? colors.surface,
        }),
      }),
    [colors],
  )

  return (
    <ThemeContext.Provider
      value={{ token: safeToken, themeType, setThemeType, cycleTheme }}
    >
      <ConfigProvider
        locale={enUS}
        componentSize="middle"
        theme={{
          algorithm,
          cssVar: true,
          hashed: false,
          token: tokenOverrides,
          components: componentsOverrides,
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
