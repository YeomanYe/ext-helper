import type { Rule } from "@/rules/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"
import { RULES_STORAGE_KEY } from "@/rules/constants"

export const SYNC_RULES_INDEX = "ext_helper_rules_index"
export const SYNC_RULE_PREFIX = "ext_helper_rule_"
const SYNC_MIGRATION_FLAG = "ext_helper_sync_migrated_rules_v1"

const cloneRules = (rules: Rule[]): Rule[] =>
  rules.map((rule) => ({
    ...rule,
    conditionGroups: rule.conditionGroups.map((group) => ({
      ...group,
      domains: [...group.domains],
      schedule: group.schedule
        ? {
            days: [...group.schedule.days],
            startTime: group.schedule.startTime,
            endTime: group.schedule.endTime,
          }
        : null,
    })),
    actions: rule.actions.map((action) => ({ ...action })),
  }))

const generateId = () => devStorage.generateId()

async function migrateRulesToSync(): Promise<void> {
  const migrated = await browserAdapter.getStorage(SYNC_MIGRATION_FLAG)
  if (migrated) return

  const localRules: Rule[] = (await browserAdapter.getStorage(RULES_STORAGE_KEY)) || []
  if (localRules.length > 0) {
    const ids = localRules.map((r) => r.id)
    await browserAdapter.setSyncStorage(SYNC_RULES_INDEX, ids)
    await Promise.all(
      localRules.map((r) => browserAdapter.setSyncStorage(SYNC_RULE_PREFIX + r.id, r))
    )
  }

  await browserAdapter.setStorage(SYNC_MIGRATION_FLAG, true)
}

export const rulesRepo = {
  generateId,

  async fetchAll(): Promise<Rule[]> {
    if (isDevMode()) {
      return cloneRules(devStorage.getRules())
    }

    await migrateRulesToSync()

    const ids: string[] = (await browserAdapter.getSyncStorage(SYNC_RULES_INDEX)) || []
    if (ids.length === 0) return []

    const rules = await Promise.all(
      ids.map((id) => browserAdapter.getSyncStorage(SYNC_RULE_PREFIX + id))
    )
    return cloneRules(rules.filter(Boolean) as Rule[])
  },

  async saveAll(rules: Rule[]): Promise<void> {
    const snapshot = cloneRules(rules)

    if (isDevMode()) {
      devStorage.setRules(snapshot)
      return
    }

    const oldIds: string[] = (await browserAdapter.getSyncStorage(SYNC_RULES_INDEX)) || []
    const newIds = snapshot.map((r) => r.id)
    const removedIds = oldIds.filter((id) => !newIds.includes(id))

    await browserAdapter.setSyncStorage(SYNC_RULES_INDEX, newIds)
    await Promise.all(
      snapshot.map((r) => browserAdapter.setSyncStorage(SYNC_RULE_PREFIX + r.id, r))
    )
    if (removedIds.length > 0) {
      await browserAdapter.removeSyncStorage(removedIds.map((id) => SYNC_RULE_PREFIX + id))
    }
  },
}
