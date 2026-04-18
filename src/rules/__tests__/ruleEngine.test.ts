import { beforeEach, describe, expect, it, vi } from "vitest"
import { RuleEngine } from "../ruleEngine"
import type { ScheduleCondition, Action } from "../types"

const adapter = vi.hoisted(() => ({
  setExtensionEnabled: vi.fn(),
  getStorage: vi.fn(),
  setStorage: vi.fn(),
}))

const groupsRepoMock = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  saveAll: vi.fn(),
  generateId: vi.fn(),
}))

const rulesRepoMock = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  saveAll: vi.fn(),
  generateId: vi.fn(),
}))

vi.mock("@/services/browser/adapter", () => ({
  browserAdapter: adapter,
}))

vi.mock("@/services/groupsRepo", () => ({
  groupsRepo: groupsRepoMock,
}))

vi.mock("@/services/rulesRepo", () => ({
  rulesRepo: rulesRepoMock,
  SYNC_RULES_INDEX: "ext_helper_rules_index",
  SYNC_RULE_PREFIX: "ext_helper_rule_",
}))

describe("RuleEngine", () => {
  let engine: RuleEngine

  beforeEach(() => {
    engine = new RuleEngine()
    vi.clearAllMocks()
  })

  describe("isWithinTimeRange", () => {
    it("normal: should detect time within normal range", () => {
      const now = new Date()
      const currentH = now.getHours().toString().padStart(2, "0")
      const currentM = now.getMinutes().toString().padStart(2, "0")
      const current = `${currentH}:${currentM}`
      expect(engine.isWithinTimeRange("00:00", "23:59")).toBe(true)
      expect(engine.isWithinTimeRange(current, current)).toBe(true)
    })

    it("normal: should detect time outside normal range", () => {
      const now = new Date()
      const hourBefore = ((now.getHours() + 23) % 24).toString().padStart(2, "0")
      const hourBeforePrev = ((now.getHours() + 22) % 24).toString().padStart(2, "0")
      expect(engine.isWithinTimeRange(`${hourBeforePrev}:00`, `${hourBefore}:00`)).toBe(false)
    })

    it("edge: should handle overnight range (22:00 - 06:00)", () => {
      const result = engine.isWithinTimeRange("22:00", "06:00")
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const expected = currentMinutes >= 22 * 60 || currentMinutes <= 6 * 60
      expect(result).toBe(expected)
    })
  })

  describe("isDayMatch", () => {
    it("normal: should match current day", () => {
      const today = new Date().getDay()
      expect(engine.isDayMatch([today])).toBe(true)
    })

    it("normal: should match when today is in the list", () => {
      expect(engine.isDayMatch([0, 1, 2, 3, 4, 5, 6])).toBe(true)
    })

    it("normal: should not match when today is not in the list", () => {
      const today = new Date().getDay()
      const otherDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== today)
      expect(engine.isDayMatch(otherDays)).toBe(false)
    })

    it("edge: should return false for empty days array", () => {
      expect(engine.isDayMatch([])).toBe(false)
    })
  })

  describe("isScheduleMatch", () => {
    it("normal: should match when day and time both match", () => {
      const today = new Date().getDay()
      const schedule: ScheduleCondition = {
        type: "schedule",
        days: [today],
        startTime: "00:00",
        endTime: "23:59",
      }
      expect(engine.isScheduleMatch(schedule)).toBe(true)
    })

    it("normal: should not match when day doesn't match", () => {
      const today = new Date().getDay()
      const schedule: ScheduleCondition = {
        type: "schedule",
        days: [(today + 1) % 7],
        startTime: "00:00",
        endTime: "23:59",
      }
      expect(engine.isScheduleMatch(schedule)).toBe(false)
    })
  })

  describe("evaluateConditions", () => {
    it("normal: should evaluate domain conditions with URL", () => {
      const conditions: any[] = [{ type: "domain", pattern: "github.com", matchMode: "exact" }]
      expect(engine.evaluateConditions(conditions, "AND", "https://github.com")).toBe(true)
    })

    it("normal: should return false for domain conditions without URL", () => {
      const conditions: any[] = [{ type: "domain", pattern: "github.com", matchMode: "exact" }]
      expect(engine.evaluateConditions(conditions, "AND")).toBe(false)
    })

    it("normal: should combine with AND operator", () => {
      const today = new Date().getDay()
      const conditions: any[] = [
        { type: "domain", pattern: "github.com", matchMode: "exact" },
        { type: "schedule", days: [today], startTime: "00:00", endTime: "23:59" },
      ]
      expect(engine.evaluateConditions(conditions, "AND", "https://github.com")).toBe(true)
    })

    it("normal: should combine with OR operator", () => {
      const today = new Date().getDay()
      const conditions: any[] = [
        { type: "domain", pattern: "nonexistent.com", matchMode: "exact" },
        { type: "schedule", days: [today], startTime: "00:00", endTime: "23:59" },
      ]
      expect(engine.evaluateConditions(conditions, "OR", "https://github.com")).toBe(true)
    })

    it("edge: should return false for empty conditions", () => {
      expect(engine.evaluateConditions([], "AND")).toBe(false)
    })
  })

  describe("evaluateDomainConditions", () => {
    it("normal: should evaluate multiple domain conditions with AND", () => {
      const conditions: any[] = [
        { type: "domain", pattern: "github.com", matchMode: "contains" },
        { type: "domain", pattern: "github", matchMode: "contains" },
      ]
      expect(engine.evaluateDomainConditions(conditions, "AND", "https://github.com")).toBe(true)
    })

    it("normal: should evaluate multiple domain conditions with OR", () => {
      const conditions: any[] = [
        { type: "domain", pattern: "github.com", matchMode: "exact" },
        { type: "domain", pattern: "gitlab.com", matchMode: "exact" },
      ]
      expect(engine.evaluateDomainConditions(conditions, "OR", "https://gitlab.com")).toBe(true)
    })

    it("edge: should return false when no domain conditions exist", () => {
      const conditions: any[] = [
        { type: "schedule", days: [1], startTime: "09:00", endTime: "17:00" },
      ]
      expect(engine.evaluateDomainConditions(conditions, "AND", "https://github.com")).toBe(false)
    })
  })

  describe("executeActions", () => {
    it("normal: should enable/disable extensions", async () => {
      adapter.setExtensionEnabled.mockResolvedValue(undefined)
      const actions: Action[] = [
        { type: "enableExtension", targetId: "ext-1" },
        { type: "disableExtension", targetId: "ext-2" },
      ]
      await engine.executeActions(actions)
      expect(adapter.setExtensionEnabled).toHaveBeenCalledWith("ext-1", true)
      expect(adapter.setExtensionEnabled).toHaveBeenCalledWith("ext-2", false)
    })

    it("normal: should enable/disable groups", async () => {
      groupsRepoMock.fetchAll.mockResolvedValue([
        { id: "group-1", extensionIds: ["ext-1", "ext-2"] },
      ])
      adapter.setExtensionEnabled.mockResolvedValue(undefined)

      const actions: Action[] = [{ type: "enableGroup", targetId: "group-1" }]
      await engine.executeActions(actions)
      expect(adapter.setExtensionEnabled).toHaveBeenCalledWith("ext-1", true)
      expect(adapter.setExtensionEnabled).toHaveBeenCalledWith("ext-2", true)
    })

    it("abnormal: should not throw when action fails", async () => {
      adapter.setExtensionEnabled.mockRejectedValue(new Error("Failed"))
      const actions: Action[] = [{ type: "enableExtension", targetId: "ext-1" }]
      await expect(engine.executeActions(actions)).resolves.toBeUndefined()
    })

    it("edge: should handle empty actions array", async () => {
      await engine.executeActions([])
      expect(adapter.setExtensionEnabled).not.toHaveBeenCalled()
    })

    it("edge: should handle group not found", async () => {
      groupsRepoMock.fetchAll.mockResolvedValue([])
      const actions: Action[] = [{ type: "disableGroup", targetId: "nonexistent" }]
      await engine.executeActions(actions)
      expect(adapter.setExtensionEnabled).not.toHaveBeenCalled()
    })
  })

  describe("recordTrigger", () => {
    it("normal: should update trigger count and timestamp", async () => {
      const existingRules = [
        { id: "rule-1", triggerCount: 5, conditionGroups: [], actions: [] },
        { id: "rule-2", triggerCount: 0, conditionGroups: [], actions: [] },
      ]
      rulesRepoMock.fetchAll.mockResolvedValue(existingRules)
      rulesRepoMock.saveAll.mockResolvedValue(undefined)

      await engine.recordTrigger("rule-1")

      expect(rulesRepoMock.saveAll).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "rule-1", triggerCount: 6 }),
          expect.objectContaining({ id: "rule-2", triggerCount: 0 }),
        ])
      )
    })

    it("edge: should handle rule with no existing triggerCount", async () => {
      rulesRepoMock.fetchAll.mockResolvedValue([{ id: "rule-1", conditionGroups: [], actions: [] }])
      rulesRepoMock.saveAll.mockResolvedValue(undefined)

      await engine.recordTrigger("rule-1")

      expect(rulesRepoMock.saveAll).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "rule-1", triggerCount: 1 })])
      )
    })
  })
})
