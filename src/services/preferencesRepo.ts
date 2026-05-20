import type { Preferences, ViewMode } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"

const PREFERENCES_STORAGE_KEY = "ext-helper-preferences"
const SYNC_PREFERENCES_KEY = "ext_helper_preferences"
const SYNC_MIGRATION_FLAG = "ext_helper_sync_migrated_preferences_v1"

let preferencesMigrated = false

type StoredPreferences = Partial<{
  theme: Preferences["theme"]
  compactMode: boolean
  showDisabled: boolean
  viewMode: ViewMode
}>

async function migratePreferencesToSync(): Promise<void> {
  if (preferencesMigrated) return
  const migrated = await browserAdapter.getStorage(SYNC_MIGRATION_FLAG)
  if (migrated) {
    preferencesMigrated = true
    return
  }

  const localPreferences =
    ((await browserAdapter.getStorage(PREFERENCES_STORAGE_KEY)) as StoredPreferences | undefined) ||
    {}
  const syncPreferences =
    ((await browserAdapter.getSyncStorage(SYNC_PREFERENCES_KEY)) as
      | StoredPreferences
      | undefined) || {}

  if (Object.keys(localPreferences).length > 0 && Object.keys(syncPreferences).length === 0) {
    await browserAdapter.setSyncStorage(SYNC_PREFERENCES_KEY, localPreferences)
  }

  await browserAdapter.setStorage(SYNC_MIGRATION_FLAG, true)
  preferencesMigrated = true
}

export const preferencesRepo = {
  async fetch(): Promise<StoredPreferences> {
    if (isDevMode()) {
      return devStorage.getPreferences() as StoredPreferences
    }

    await migratePreferencesToSync()
    return (await browserAdapter.getSyncStorage(SYNC_PREFERENCES_KEY)) || {}
  },

  async save(updates: StoredPreferences): Promise<void> {
    if (isDevMode()) {
      devStorage.setPreferences(updates)
      return
    }

    await migratePreferencesToSync()
    const current = ((await browserAdapter.getSyncStorage(SYNC_PREFERENCES_KEY)) ||
      {}) as StoredPreferences
    // First release syncs preferences through the browser account's native storage.sync only.
    await browserAdapter.setSyncStorage(SYNC_PREFERENCES_KEY, { ...current, ...updates })
  },
}
