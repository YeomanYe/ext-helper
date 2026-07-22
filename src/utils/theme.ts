import type { AccentColor, Preferences } from "@/types"

const MEDIA_QUERY = "(prefers-color-scheme: dark)"
const DEV_PREFERENCES_KEY = "dev-preferences"
const EXTENSION_PREFERENCES_KEY = "ext-helper-preferences"

type Theme = Preferences["theme"]
type StoredPreferences = Partial<Pick<Preferences, "theme" | "accentColor">>

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
  }

  return theme
}

/**
 * 主题强调色预设。`swatch` 是选择器色块用的展示色（等于该预设的 primary）。
 * 覆盖规则定义在 `src/styles/globals.css` 的 `html[data-accent="..."]` 块，
 * 修改这里时需同步更新 CSS。
 */
export const ACCENT_PRESETS: { value: AccentColor; swatch: string }[] = [
  { value: "default", swatch: "#2563eb" },
  { value: "violet", swatch: "#8b5cf6" },
  { value: "cyan", swatch: "#06b6d4" },
  { value: "emerald", swatch: "#10b981" },
  { value: "rose", swatch: "#f43f5e" },
  { value: "amber", swatch: "#f59e0b" },
]

export const ACCENT_VALUES = ACCENT_PRESETS.map((preset) => preset.value)
export const DEFAULT_ACCENT: AccentColor = "default"

function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === "string" && ACCENT_VALUES.includes(value as AccentColor)
}

export function applyThemeDom(theme: Theme) {
  const resolvedTheme = resolveTheme(theme)
  document.documentElement.setAttribute("data-theme", theme)

  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark")
  } else {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark")
  }
}

export function applyAccentColorDom(accent: AccentColor) {
  const root = document.documentElement
  if (accent === DEFAULT_ACCENT) {
    delete root.dataset.accent
  } else {
    root.dataset.accent = accent
  }
}

function parseThemePreference(value: unknown): StoredPreferences {
  if (!value || typeof value !== "object") return {}
  const raw = value as StoredPreferences
  const parsed: StoredPreferences = {}
  if (isTheme(raw.theme)) {
    parsed.theme = raw.theme
  }
  if (isAccentColor(raw.accentColor)) {
    parsed.accentColor = raw.accentColor
  }
  return parsed
}

function readDevThemePreference(): StoredPreferences {
  try {
    return parseThemePreference(JSON.parse(localStorage.getItem(DEV_PREFERENCES_KEY) || "{}"))
  } catch {
    return {}
  }
}

export function applyStoredThemeDom() {
  const devPrefs = readDevThemePreference()
  if (devPrefs.theme) {
    applyThemeDom(devPrefs.theme)
  }
  if (devPrefs.accentColor) {
    applyAccentColorDom(devPrefs.accentColor)
  }

  const chromeStorage = globalThis.chrome?.storage?.local
  if (chromeStorage) {
    chromeStorage.get(EXTENSION_PREFERENCES_KEY, (result) => {
      const parsed = parseThemePreference(result?.[EXTENSION_PREFERENCES_KEY])
      if (parsed.theme && !devPrefs.theme) applyThemeDom(parsed.theme)
      if (parsed.accentColor && !devPrefs.accentColor) applyAccentColorDom(parsed.accentColor)
    })
  }
}
