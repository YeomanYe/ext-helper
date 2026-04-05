import type { Group } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode, MOCK_GROUPS } from "@/services/mockData"

const GROUPS_STORAGE_KEY = "ext-helper-groups"

const cloneGroups = (groups: Group[]): Group[] =>
  groups.map((group) => ({
    ...group,
    extensionIds: [...group.extensionIds]
  }))

const generateId = () => devStorage.generateId()

export const groupsRepo = {
  generateId,

  async fetchAll(): Promise<Group[]> {
    if (isDevMode()) {
      const stored = devStorage.getGroups()
      if (stored.length === 0) {
        devStorage.setGroups(MOCK_GROUPS)
      }
      return cloneGroups(devStorage.getGroups())
    }

    return cloneGroups((await browserAdapter.getStorage(GROUPS_STORAGE_KEY)) || [])
  },

  async saveAll(groups: Group[]): Promise<void> {
    const snapshot = cloneGroups(groups)

    if (isDevMode()) {
      devStorage.setGroups(snapshot)
      return
    }

    await browserAdapter.setStorage(GROUPS_STORAGE_KEY, snapshot)
  }
}
