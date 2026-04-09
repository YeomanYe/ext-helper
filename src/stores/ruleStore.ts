// ============================================================
// 规则状态管理
// ============================================================

import { create } from "zustand"
import type { Rule, RuleStore } from "@/rules/types"
import { rulesRepo } from "@/services/rulesRepo"
import { runOptimisticMutation } from "@/stores/optimistic"

export const useRuleStore = create<RuleStore>((set, get) => ({
  rules: [],
  loading: false,
  error: null,

  fetchRules: async () => {
    set({ loading: true, error: null })
    try {
      set({ rules: await rulesRepo.fetchAll(), loading: false })
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
      id: rulesRepo.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      triggerCount: 0,
    }

    const newRules = [...rules, newRule]
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.rules,
      apply: () => ({ rules: newRules, error: null }),
      persist: () => rulesRepo.saveAll(newRules),
      rollback: (snapshot) => ({ rules: snapshot }),
      onError: (error) => {
        console.error("Failed to save rule:", error)
        return { error: "Failed to save rule" }
      },
    })
  },

  updateRule: async (id, updates) => {
    const { rules } = get()
    const newRules = rules.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
    )
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.rules,
      apply: () => ({ rules: newRules, error: null }),
      persist: () => rulesRepo.saveAll(newRules),
      rollback: (snapshot) => ({ rules: snapshot }),
      onError: (error) => {
        console.error("Failed to update rule:", error)
        return { error: "Failed to update rule" }
      },
    })
  },

  deleteRule: async (id) => {
    const { rules } = get()
    const newRules = rules.filter((r) => r.id !== id)
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.rules,
      apply: () => ({ rules: newRules, error: null }),
      persist: () => rulesRepo.saveAll(newRules),
      rollback: (snapshot) => ({ rules: snapshot }),
      onError: (error) => {
        console.error("Failed to delete rule:", error)
        return { error: "Failed to delete rule" }
      },
    })
  },

  toggleRule: async (id) => {
    const { rules } = get()
    const rule = rules.find((r) => r.id === id)
    if (!rule) return

    const newRules = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r
    )
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.rules,
      apply: () => ({ rules: newRules, error: null }),
      persist: () => rulesRepo.saveAll(newRules),
      rollback: (snapshot) => ({ rules: snapshot }),
      onError: (error) => {
        console.error("Failed to toggle rule:", error)
        return { error: "Failed to toggle rule" }
      },
    })
  },

  duplicateRule: async (id) => {
    const { rules } = get()
    const rule = rules.find((r) => r.id === id)
    if (!rule) return

    const newRule: Rule = {
      ...rule,
      id: rulesRepo.generateId(),
      name: `${rule.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      triggerCount: 0,
      lastTriggeredAt: undefined,
    }

    const newRules = [...rules, newRule]
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.rules,
      apply: () => ({ rules: newRules, error: null }),
      persist: () => rulesRepo.saveAll(newRules),
      rollback: (snapshot) => ({ rules: snapshot }),
      onError: (error) => {
        console.error("Failed to duplicate rule:", error)
        return { error: "Failed to duplicate rule" }
      },
    })
  },
}))
