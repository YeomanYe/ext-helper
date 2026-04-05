import { create } from "zustand"
import type { Preferences, UIStore, ViewMode } from "@/types"
import { preferencesRepo } from "@/services/preferencesRepo"

type PreferenceUpdates = Partial<Pick<Preferences, "theme" | "compactMode" | "showDisabled" | "viewMode">>

function applyTheme(theme: Preferences["theme"]) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark")
  } else {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    document.documentElement.classList.toggle("dark", isDark)
  }
}

export const useUIStore = create<UIStore>((set, get) => ({
  theme: "system",
  compactMode: false,
  showDisabled: true,
  viewMode: "compact",
  lastUpdate: Date.now(),

  setTheme: async (theme: Preferences["theme"]) => {
    set({ theme, lastUpdate: Date.now() })
    applyTheme(theme)
    try {
      await preferencesRepo.save({ theme })
    } catch (error) {
      console.error("Failed to save theme preference:", error)
    }
  },

  toggleCompactMode: async () => {
    const { compactMode } = get()
    set({ compactMode: !compactMode, lastUpdate: Date.now() })

    try {
      await preferencesRepo.save({ compactMode: !compactMode })
    } catch (error) {
      console.error("Failed to save compact mode preference:", error)
    }
  },

  toggleShowDisabled: async () => {
    const { showDisabled } = get()
    set({ showDisabled: !showDisabled, lastUpdate: Date.now() })

    try {
      await preferencesRepo.save({ showDisabled: !showDisabled })
    } catch (error) {
      console.error("Failed to save show disabled preference:", error)
    }
  },

  setViewMode: async (viewMode: ViewMode) => {
    set({ viewMode, lastUpdate: Date.now() })

    try {
      await preferencesRepo.save({ viewMode })
    } catch (error) {
      console.error("Failed to save view mode preference:", error)
    }
  }
}))

// Initialize theme on load
export async function initializeUIStore() {
  try {
    const prefs = await preferencesRepo.fetch()
    if (prefs) {
      const nextState: PreferenceUpdates & { lastUpdate: number } = {
        lastUpdate: Date.now()
      }

      if (prefs.theme) {
        nextState.theme = prefs.theme
      }
      if (prefs.compactMode !== undefined) {
        nextState.compactMode = prefs.compactMode
      }
      if (prefs.showDisabled !== undefined) {
        nextState.showDisabled = prefs.showDisabled
      }
      if (prefs.viewMode) {
        nextState.viewMode = prefs.viewMode as ViewMode
      }

      useUIStore.setState(nextState)
      applyTheme(nextState.theme ?? useUIStore.getState().theme)
    }
  } catch (error) {
    console.error("Failed to initialize UI store:", error)
  }
}
