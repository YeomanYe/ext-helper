// ============================================================
// 规则状态管理
// ============================================================

import { create } from "zustand"
import type { Rule, RuleStore } from "@/rules/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"
import { RULES_STORAGE_KEY } from "@/rules/constants"

export const useRuleStore = create<RuleStore>((set, get) => ({
  rules: [],
  loading: false,
  error: null,

  fetchRules: async () => {
    set({ loading: true, error: null })
    try {
      let rules
      if (isDevMode()) {
        rules = devStorage.getRules()
      } else {
        rules = (await browserAdapter.getStorage(RULES_STORAGE_KEY)) || []
      }
      set({ rules, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch rules",
        loading: false,
      })
    }
  },

  createRule: async (ruleData) => {
    const { rules } = get()
    const newRule: Rule = {
      ...ruleData,
      id: devStorage.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      triggerCount: 0,
    }

    const newRules = [...rules, newRule]
    set({ rules: newRules })

    try {
      if (isDevMode()) {
        devStorage.setRules(newRules)
      } else {
        await browserAdapter.setStorage(RULES_STORAGE_KEY, newRules)
      }
    } catch (error) {
      console.error("Failed to save rule:", error)
      set({ rules, error: "Failed to save rule" })
    }
  },

  updateRule: async (id, updates) => {
    const { rules } = get()
    const newRules = rules.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
    )
    set({ rules: newRules })

    try {
      if (isDevMode()) {
        devStorage.setRules(newRules)
      } else {
        await browserAdapter.setStorage(RULES_STORAGE_KEY, newRules)
      }
    } catch (error) {
      console.error("Failed to update rule:", error)
      set({ rules, error: "Failed to update rule" })
    }
  },

  deleteRule: async (id) => {
    const { rules } = get()
    const newRules = rules.filter((r) => r.id !== id)
    set({ rules: newRules })

    try {
      if (isDevMode()) {
        devStorage.setRules(newRules)
      } else {
        await browserAdapter.setStorage(RULES_STORAGE_KEY, newRules)
      }
    } catch (error) {
      console.error("Failed to delete rule:", error)
      set({ rules, error: "Failed to delete rule" })
    }
  },

  toggleRule: async (id) => {
    const { rules } = get()
    const rule = rules.find((r) => r.id === id)
    if (!rule) return

    const newRules = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r
    )
    set({ rules: newRules })

    try {
      if (isDevMode()) {
        devStorage.setRules(newRules)
      } else {
        await browserAdapter.setStorage(RULES_STORAGE_KEY, newRules)
      }
    } catch (error) {
      console.error("Failed to toggle rule:", error)
      set({ rules, error: "Failed to toggle rule" })
    }
  },

  duplicateRule: async (id) => {
    const { rules } = get()
    const rule = rules.find((r) => r.id === id)
    if (!rule) return

    const newRule: Rule = {
      ...rule,
      id: devStorage.generateId(),
      name: `${rule.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      triggerCount: 0,
      lastTriggeredAt: undefined,
    }

    const newRules = [...rules, newRule]
    set({ rules: newRules })

    try {
      if (isDevMode()) {
        devStorage.setRules(newRules)
      } else {
        await browserAdapter.setStorage(RULES_STORAGE_KEY, newRules)
      }
    } catch (error) {
      console.error("Failed to duplicate rule:", error)
      set({ rules, error: "Failed to duplicate rule" })
    }
  },
}))
