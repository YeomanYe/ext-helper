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
  actions: [],
  priority: 1,
  createdAt: 1,
  updatedAt: 1,
  triggerCount: 0
}

describe("ruleStore", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    repo.fetchAll.mockResolvedValue([baseRule])
    repo.saveAll.mockResolvedValue(undefined)
    repo.generateId.mockReturnValue("r2")
  })

  it("duplicates a rule with a new id and name", async () => {
    const { useRuleStore } = await import("../ruleStore")
    await useRuleStore.getState().fetchRules()

    await useRuleStore.getState().duplicateRule("r1")

    expect(useRuleStore.getState().rules).toHaveLength(2)
    expect(useRuleStore.getState().rules[1].id).toBe("r2")
    expect(useRuleStore.getState().rules[1].name).toContain("(Copy)")
  })
})
