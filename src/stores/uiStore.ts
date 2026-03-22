import { create } from "zustand"
import type { UIStore, ViewMode } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"

const STORAGE_KEY = "ext-helper-preferences"

const getPrefs = async () => {
  if (isDevMode()) {
    return devStorage.getPreferences()
  }
  return browserAdapter.getStorage(STORAGE_KEY)
}

const setPrefs = async (prefs: Partial<{ theme: string; compactMode: boolean; showDisabled: boolean; viewMode: string }>) => {
  if (isDevMode()) {
    devStorage.setPreferences(prefs)
    return
  }
  const current = await browserAdapter.getStorage(STORAGE_KEY) || {}
  await browserAdapter.setStorage(STORAGE_KEY, { ...current, ...prefs })
}

export const useUIStore = create<UIStore>((set, get) => ({
  theme: "system",
  compactMode: false,
  showDisabled: true,
  viewMode: "compact",
  lastUpdate: Date.now(),

  setTheme: async (theme: "light" | "dark" | "system") => {
    set({ theme, lastUpdate: Date.now() })

    // Apply theme
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.classList.toggle("dark", isDark)
    }

    // Save to storage
    try {
      await setPrefs({ theme })
    } catch (error) {
      console.error("Failed to save theme preference:", error)
    }
  },

  toggleCompactMode: async () => {
    const { compactMode } = get()
    set({ compactMode: !compactMode, lastUpdate: Date.now() })

    try {
      await setPrefs({ compactMode: !compactMode })
    } catch (error) {
      console.error("Failed to save compact mode preference:", error)
    }
  },

  toggleShowDisabled: async () => {
    const { showDisabled } = get()
    set({ showDisabled: !showDisabled, lastUpdate: Date.now() })

    try {
      await setPrefs({ showDisabled: !showDisabled })
    } catch (error) {
      console.error("Failed to save show disabled preference:", error)
    }
  },

  setViewMode: async (viewMode: ViewMode) => {
    set({ viewMode, lastUpdate: Date.now() })

    try {
      await setPrefs({ viewMode })
    } catch (error) {
      console.error("Failed to save view mode preference:", error)
    }
  }
}))

// Initialize theme on load
export async function initializeUIStore() {
  try {
    const prefs = await getPrefs()
    if (prefs) {
      const { setTheme, toggleCompactMode, toggleShowDisabled, setViewMode } = useUIStore.getState()

      if (prefs.theme) setTheme(prefs.theme as "light" | "dark" | "system")
      if (prefs.compactMode !== undefined && prefs.compactMode) toggleCompactMode()
      if (prefs.showDisabled !== undefined && !prefs.showDisabled) toggleShowDisabled()
      if (prefs.viewMode) setViewMode(prefs.viewMode as ViewMode)
    }
  } catch (error) {
    console.error("Failed to initialize UI store:", error)
  }
}
