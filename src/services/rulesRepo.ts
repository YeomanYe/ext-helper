import type { Rule } from "@/rules/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"
import { RULES_STORAGE_KEY } from "@/rules/constants"

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

export const rulesRepo = {
  generateId,

  async fetchAll(): Promise<Rule[]> {
    if (isDevMode()) {
      return cloneRules(devStorage.getRules())
    }

    return cloneRules((await browserAdapter.getStorage(RULES_STORAGE_KEY)) || [])
  },

  async saveAll(rules: Rule[]): Promise<void> {
    const snapshot = cloneRules(rules)

    if (isDevMode()) {
      devStorage.setRules(snapshot)
      return
    }

    await browserAdapter.setStorage(RULES_STORAGE_KEY, snapshot)
  },
}
