import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Rule } from "@/rules/types"

const repo = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  saveAll: vi.fn(),
  generateId: vi.fn()
}))

vi.mock("@/services/rulesRepo", () => ({
  rulesRepo: repo
}))

const baseRule: Rule = {
  id: "r1",
  name: "Rule 1",
  enabled: true,
  conditionGroups: [],
  conditionOperator: "AND",
  actions: [{ type: "enableExtension", targetId: "ext-1" }],
  priority: 1,
  createdAt: 1,
  updatedAt: 1,
  triggerCount: 5
}

const secondRule: Rule = {
  id: "r2",
  name: "Rule 2",
  enabled: false,
  conditionGroups: [],
  conditionOperator: "OR",
  actions: [],
  priority: 2,
  createdAt: 2,
  updatedAt: 2,
  triggerCount: 0
}

describe("ruleStore", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    repo.fetchAll.mockResolvedValue([baseRule, secondRule])
    repo.saveAll.mockResolvedValue(undefined)
    repo.generateId.mockReturnValue("r-new")
  })

  // ============================================================
  // createRule
  // ============================================================
  describe("createRule", () => {
    it("normal: should create a rule with generated id and timestamps", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      const ruleData = {
        name: "New Rule",
        enabled: true,
        conditionGroups: [],
        conditionOperator: "AND" as const,
        actions: [{ type: "disableExtension" as const, targetId: "ext-2" }],
        priority: 3
      }

      await useRuleStore.getState().createRule(ruleData)

      const rules = useRuleStore.getState().rules
      expect(rules).toHaveLength(3)
      const created = rules[2]
      expect(created.id).toBe("r-new")
      expect(created.name).toBe("New Rule")
      expect(created.triggerCount).toBe(0)
      expect(created.createdAt).toBeGreaterThan(1)
      expect(created.updatedAt).toBeGreaterThan(1)
      expect(repo.saveAll).toHaveBeenCalledOnce()
    })

    it("normal: should clear error on successful create", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().createRule({
        name: "Test",
        enabled: true,
        conditionGroups: [],
        conditionOperator: "AND",
        actions: [],
        priority: 1
      })

      expect(useRuleStore.getState().error).toBeNull()
    })

    it("abnormal: should rollback and set error on failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("save failed"))
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().createRule({
        name: "Fail",
        enabled: true,
        conditionGroups: [],
        conditionOperator: "AND",
        actions: [],
        priority: 1
      })

      expect(useRuleStore.getState().rules).toHaveLength(2)
      expect(useRuleStore.getState().error).toBe("Failed to save rule")
    })
  })

  // ============================================================
  // updateRule
  // ============================================================
  describe("updateRule", () => {
    it("normal: should update rule fields and updatedAt", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().updateRule("r1", { name: "Updated Rule" })

      const updated = useRuleStore.getState().rules[0]
      expect(updated.name).toBe("Updated Rule")
      expect(updated.updatedAt).toBeGreaterThan(1)
      expect(repo.saveAll).toHaveBeenCalledOnce()
    })

    it("normal: should update multiple fields at once", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().updateRule("r1", { name: "New Name", priority: 10, enabled: false })

      const updated = useRuleStore.getState().rules[0]
      expect(updated.name).toBe("New Name")
      expect(updated.priority).toBe(10)
      expect(updated.enabled).toBe(false)
    })

    it("abnormal: should rollback on update failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("update failed"))
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().updateRule("r1", { name: "Updated" })

      expect(useRuleStore.getState().rules[0].name).toBe("Rule 1")
      expect(useRuleStore.getState().error).toBe("Failed to update rule")
    })
  })

  // ============================================================
  // deleteRule
  // ============================================================
  describe("deleteRule", () => {
    it("normal: should delete a rule by id", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().deleteRule("r1")

      const rules = useRuleStore.getState().rules
      expect(rules).toHaveLength(1)
      expect(rules[0].id).toBe("r2")
      expect(repo.saveAll).toHaveBeenCalledOnce()
    })

    it("normal: should handle deleting the last rule", async () => {
      repo.fetchAll.mockResolvedValue([baseRule])
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().deleteRule("r1")

      expect(useRuleStore.getState().rules).toHaveLength(0)
    })

    it("abnormal: should rollback on delete failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("delete failed"))
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().deleteRule("r1")

      expect(useRuleStore.getState().rules).toHaveLength(2)
      expect(useRuleStore.getState().error).toBe("Failed to delete rule")
    })
  })

  // ============================================================
  // toggleRule
  // ============================================================
  describe("toggleRule", () => {
    it("normal: should toggle enabled rule to disabled", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().toggleRule("r1")

      const toggled = useRuleStore.getState().rules[0]
      expect(toggled.enabled).toBe(false)
      expect(toggled.updatedAt).toBeGreaterThan(1)
    })

    it("normal: should toggle disabled rule to enabled", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().toggleRule("r2")

      expect(useRuleStore.getState().rules[1].enabled).toBe(true)
    })

    it("edge: should do nothing for non-existent rule id", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().toggleRule("non-existent")

      expect(useRuleStore.getState().rules).toHaveLength(2)
      expect(repo.saveAll).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on toggle failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("toggle failed"))
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().toggleRule("r1")

      expect(useRuleStore.getState().rules[0].enabled).toBe(true)
      expect(useRuleStore.getState().error).toBe("Failed to toggle rule")
    })
  })

  // ============================================================
  // duplicateRule
  // ============================================================
  describe("duplicateRule", () => {
    it("normal: should duplicate a rule with new id and name", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().duplicateRule("r1")

      const rules = useRuleStore.getState().rules
      expect(rules).toHaveLength(3)
      const dup = rules[2]
      expect(dup.id).toBe("r-new")
      expect(dup.name).toBe("Rule 1 (Copy)")
      expect(dup.triggerCount).toBe(0)
      expect(dup.lastTriggeredAt).toBeUndefined()
      expect(dup.createdAt).toBeGreaterThan(1)
      expect(dup.updatedAt).toBeGreaterThan(1)
      expect(dup.actions).toEqual(baseRule.actions)
      expect(dup.conditionOperator).toBe(baseRule.conditionOperator)
    })

    it("normal: should preserve original rule properties in duplicate", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().duplicateRule("r1")

      const dup = useRuleStore.getState().rules[2]
      expect(dup.enabled).toBe(baseRule.enabled)
      expect(dup.priority).toBe(baseRule.priority)
    })

    it("edge: should do nothing for non-existent rule id", async () => {
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().duplicateRule("non-existent")

      expect(useRuleStore.getState().rules).toHaveLength(2)
      expect(repo.saveAll).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on duplicate failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("duplicate failed"))
      const { useRuleStore } = await import("../ruleStore")
      await useRuleStore.getState().fetchRules()

      await useRuleStore.getState().duplicateRule("r1")

      expect(useRuleStore.getState().rules).toHaveLength(2)
      expect(useRuleStore.getState().error).toBe("Failed to duplicate rule")
    })
  })
})
