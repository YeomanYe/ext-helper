import type { Preferences } from "@/types"

const MEDIA_QUERY = "(prefers-color-scheme: dark)"
const DEV_PREFERENCES_KEY = "dev-preferences"
const EXTENSION_PREFERENCES_KEY = "ext-helper-preferences"

type Theme = Preferences["theme"]
type StoredPreferences = Partial<Pick<Preferences, "theme">>

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
  }

  return theme
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

function parseThemePreference(value: unknown): Theme | null {
  if (!value || typeof value !== "object") return null
  const theme = (value as StoredPreferences).theme
  return isTheme(theme) ? theme : null
}

function readDevThemePreference(): Theme | null {
  try {
    return parseThemePreference(JSON.parse(localStorage.getItem(DEV_PREFERENCES_KEY) || "{}"))
  } catch {
    return null
  }
}

export function applyStoredThemeDom() {
  const devTheme = readDevThemePreference()
  if (devTheme) {
    applyThemeDom(devTheme)
    return
  }

  const chromeStorage = globalThis.chrome?.storage?.local
  if (chromeStorage) {
    chromeStorage.get(EXTENSION_PREFERENCES_KEY, (result) => {
      const theme = parseThemePreference(result?.[EXTENSION_PREFERENCES_KEY])
      if (theme) applyThemeDom(theme)
    })
  }
}
