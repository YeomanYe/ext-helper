import type { Group } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode, MOCK_GROUPS } from "@/services/mockData"

const GROUPS_STORAGE_KEY = "ext-helper-groups"
const SYNC_GROUPS_INDEX = "ext_helper_groups_index"
const SYNC_GROUP_PREFIX = "ext_helper_group_"
const SYNC_MIGRATION_FLAG = "ext_helper_sync_migrated_groups_v1"

let groupsMigrated = false

const cloneGroups = (groups: Group[]): Group[] =>
  groups.map((group) => ({
    ...group,
    extensionIds: [...group.extensionIds],
  }))

const generateId = () => devStorage.generateId()

async function migrateGroupsToSync(): Promise<void> {
  if (groupsMigrated) return
  const migrated = await browserAdapter.getStorage(SYNC_MIGRATION_FLAG)
  if (migrated) {
    groupsMigrated = true
    return
  }

  const localGroups: Group[] = (await browserAdapter.getStorage(GROUPS_STORAGE_KEY)) || []
  if (localGroups.length > 0) {
    const ids = localGroups.map((g) => g.id)
    await browserAdapter.setSyncStorage(SYNC_GROUPS_INDEX, ids)
    await Promise.all(
      localGroups.map((g) => browserAdapter.setSyncStorage(SYNC_GROUP_PREFIX + g.id, g))
    )
  }

  await browserAdapter.setStorage(SYNC_MIGRATION_FLAG, true)
  groupsMigrated = true
}

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

    await migrateGroupsToSync()

    const ids: string[] = (await browserAdapter.getSyncStorage(SYNC_GROUPS_INDEX)) || []
    if (ids.length === 0) return []

    const groups = await Promise.all(
      ids.map((id) => browserAdapter.getSyncStorage(SYNC_GROUP_PREFIX + id))
    )
    return cloneGroups(groups.filter(Boolean) as Group[])
  },

  async saveAll(groups: Group[]): Promise<void> {
    const snapshot = cloneGroups(groups)

    if (isDevMode()) {
      devStorage.setGroups(snapshot)
      return
    }

    const oldIds: string[] = (await browserAdapter.getSyncStorage(SYNC_GROUPS_INDEX)) || []
    const newIds = snapshot.map((g) => g.id)
    const removedIds = oldIds.filter((id) => !newIds.includes(id))

    await browserAdapter.setSyncStorage(SYNC_GROUPS_INDEX, newIds)
    await Promise.all(
      snapshot.map((g) => browserAdapter.setSyncStorage(SYNC_GROUP_PREFIX + g.id, g))
    )
    if (removedIds.length > 0) {
      await browserAdapter.removeSyncStorage(removedIds.map((id) => SYNC_GROUP_PREFIX + id))
    }
  },
}
