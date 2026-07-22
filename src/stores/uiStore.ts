import { create } from "zustand"
import type { AccentColor, Preferences, UIStore, ViewMode } from "@/types"
import { preferencesRepo } from "@/services/preferencesRepo"
import { applyAccentColorDom, applyThemeDom, DEFAULT_ACCENT } from "@/utils/theme"
import { logger } from "@/utils/logger"

type PreferenceUpdates = Partial<
  Pick<
    Preferences,
    "theme" | "accentColor" | "compactMode" | "showDisabled" | "viewMode" | "bisectWhitelist"
  >
>

export const useUIStore = create<UIStore>((set, get) => ({
  theme: "system",
  accentColor: DEFAULT_ACCENT,
  compactMode: false,
  showDisabled: true,
  viewMode: "compact",
  bisectWhitelist: [],
  lastUpdate: Date.now(),

  setTheme: async (theme: Preferences["theme"]) => {
    set({ theme, lastUpdate: Date.now() })
    applyThemeDom(theme)
    try {
      await preferencesRepo.save({ theme })
    } catch (error) {
      logger.error("Failed to save theme preference:", error)
    }
  },

  setAccentColor: async (accentColor: AccentColor) => {
    set({ accentColor, lastUpdate: Date.now() })
    applyAccentColorDom(accentColor)
    try {
      await preferencesRepo.save({ accentColor })
    } catch (error) {
      logger.error("Failed to save accent color preference:", error)
    }
  },

  toggleCompactMode: async () => {
    const { compactMode } = get()
    set({ compactMode: !compactMode, lastUpdate: Date.now() })

    try {
      await preferencesRepo.save({ compactMode: !compactMode })
    } catch (error) {
      logger.error("Failed to save compact mode preference:", error)
    }
  },

  toggleShowDisabled: async () => {
    const { showDisabled } = get()
    set({ showDisabled: !showDisabled, lastUpdate: Date.now() })

    try {
      await preferencesRepo.save({ showDisabled: !showDisabled })
    } catch (error) {
      logger.error("Failed to save show disabled preference:", error)
    }
  },

  setViewMode: async (viewMode: ViewMode) => {
    set({ viewMode, lastUpdate: Date.now() })

    try {
      await preferencesRepo.save({ viewMode })
    } catch (error) {
      logger.error("Failed to save view mode preference:", error)
    }
  },

  setBisectWhitelist: async (ids: string[]) => {
    set({ bisectWhitelist: ids, lastUpdate: Date.now() })
    try {
      await preferencesRepo.save({ bisectWhitelist: ids })
    } catch (error) {
      logger.error("Failed to save bisect whitelist preference:", error)
    }
  },
}))

// Initialize theme on load
export async function initializeUIStore() {
  try {
    const prefs = await preferencesRepo.fetch()
    if (prefs) {
      const nextState: PreferenceUpdates & { lastUpdate: number } = {
        lastUpdate: Date.now(),
      }

      if (prefs.theme) {
        nextState.theme = prefs.theme
      }
      if (prefs.accentColor) {
        nextState.accentColor = prefs.accentColor
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
      if (Array.isArray(prefs.bisectWhitelist)) {
        nextState.bisectWhitelist = prefs.bisectWhitelist
      }

      useUIStore.setState(nextState)
      applyThemeDom(nextState.theme ?? useUIStore.getState().theme)
      applyAccentColorDom(nextState.accentColor ?? useUIStore.getState().accentColor)
    } else {
      applyThemeDom(useUIStore.getState().theme)
      applyAccentColorDom(useUIStore.getState().accentColor)
    }
  } catch (error) {
    logger.error("Failed to initialize UI store:", error)
  }
}
