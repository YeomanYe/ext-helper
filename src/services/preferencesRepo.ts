import type { Preferences, ViewMode } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"

const PREFERENCES_STORAGE_KEY = "ext-helper-preferences"

type StoredPreferences = Partial<{
  theme: Preferences["theme"]
  compactMode: boolean
  showDisabled: boolean
  viewMode: ViewMode
}>

export const preferencesRepo = {
  async fetch(): Promise<StoredPreferences> {
    if (isDevMode()) {
      return devStorage.getPreferences() as StoredPreferences
    }

    return (await browserAdapter.getStorage(PREFERENCES_STORAGE_KEY)) || {}
  },

  async save(updates: StoredPreferences): Promise<void> {
    if (isDevMode()) {
      devStorage.setPreferences(updates)
      return
    }

    const current = ((await browserAdapter.getStorage(PREFERENCES_STORAGE_KEY)) ||
      {}) as StoredPreferences
    await browserAdapter.setStorage(PREFERENCES_STORAGE_KEY, { ...current, ...updates })
  },
}
