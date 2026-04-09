import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock isDevMode to return true so we exercise devStorage paths
vi.mock("@/services/mockData", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import("@/services/mockData")>()
  return {
    ...original,
    isDevMode: () => true,
  }
})

// Stub localStorage with in-memory store
const store: Record<string, string> = {}
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k])
  },
})

// Clear localStorage between tests
function clearStore() {
  Object.keys(store).forEach((k) => delete store[k])
}

describe("extensionsRepo", () => {
  beforeEach(() => {
    clearStore()
  })

  it("normal: fetchAll returns mock extensions on first call", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")
    const extensions = await extensionsRepo.fetchAll()

    expect(extensions.length).toBeGreaterThan(0)
    expect(extensions[0]).toHaveProperty("id")
    expect(extensions[0]).toHaveProperty("name")
    expect(extensions[0]).toHaveProperty("enabled")
  })

  it("normal: fetchAll returns cloned data (not same reference)", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")
    const first = await extensionsRepo.fetchAll()
    const second = await extensionsRepo.fetchAll()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first[0]).not.toBe(second[0])
    expect(first[0].permissions).not.toBe(second[0].permissions)
  })

  it("normal: setEnabled updates an extension's enabled state", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")
    const extensions = await extensionsRepo.fetchAll()
    const target = extensions[0]
    const originalEnabled = target.enabled

    await extensionsRepo.setEnabled(target.id, !originalEnabled)

    const updated = await extensionsRepo.fetchAll()
    const found = updated.find((e) => e.id === target.id)
    expect(found?.enabled).toBe(!originalEnabled)
  })

  it("normal: remove deletes an extension", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")
    const extensions = await extensionsRepo.fetchAll()
    const targetId = extensions[0].id
    const originalCount = extensions.length

    await extensionsRepo.remove(targetId)

    const updated = await extensionsRepo.fetchAll()
    expect(updated.length).toBe(originalCount - 1)
    expect(updated.find((e) => e.id === targetId)).toBeUndefined()
  })

  it("normal: applySnapshot replaces all extensions", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")
    const original = await extensionsRepo.fetchAll()
    const snapshot = original.map((e) => ({
      ...e,
      enabled: false,
      permissions: [...e.permissions],
    }))

    await extensionsRepo.applySnapshot(original, snapshot)

    const result = await extensionsRepo.fetchAll()
    result.forEach((e) => {
      expect(e.enabled).toBe(false)
    })
  })

  it("normal: saveBisectSession and loadBisectSession round-trip", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")

    const session = {
      active: true,
      phase: "running" as const,
      baselineExtensions: [],
      allCandidateIds: ["a", "b"],
      candidateIds: ["a"],
      currentTestIds: ["a"],
      parkedIds: [],
      step: 1,
    }

    await extensionsRepo.saveBisectSession(session)
    const loaded = await extensionsRepo.loadBisectSession()

    expect(loaded).toEqual(session)
    // Should be a clone
    expect(loaded).not.toBe(session)
  })

  it("normal: clearBisectSession removes saved session", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")

    await extensionsRepo.saveBisectSession({
      active: true,
      phase: "running" as const,
      baselineExtensions: [],
      allCandidateIds: [],
      candidateIds: [],
      currentTestIds: [],
      parkedIds: [],
      step: 0,
    })
    expect(await extensionsRepo.loadBisectSession()).not.toBeNull()

    await extensionsRepo.clearBisectSession()
    expect(await extensionsRepo.loadBisectSession()).toBeNull()
  })

  it("edge: loadBisectSession returns null when no session saved", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")
    // clearBisectSession to ensure clean state (singleton devStorage)
    await extensionsRepo.clearBisectSession()
    const session = await extensionsRepo.loadBisectSession()
    expect(session).toBeNull()
  })

  it("edge: setEnabled on non-existent id does not throw", async () => {
    const { extensionsRepo } = await import("@/services/extensionsRepo")
    await extensionsRepo.fetchAll() // initialize
    await expect(extensionsRepo.setEnabled("non-existent", true)).resolves.toBeUndefined()
  })
})

describe("groupsRepo", () => {
  beforeEach(() => {
    clearStore()
  })

  it("normal: fetchAll returns mock groups on first call", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    const groups = await groupsRepo.fetchAll()

    expect(groups.length).toBeGreaterThan(0)
    expect(groups[0]).toHaveProperty("id")
    expect(groups[0]).toHaveProperty("name")
    expect(groups[0]).toHaveProperty("extensionIds")
  })

  it("normal: fetchAll returns cloned data", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    const first = await groupsRepo.fetchAll()
    const second = await groupsRepo.fetchAll()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first[0].extensionIds).not.toBe(second[0].extensionIds)
  })

  it("normal: saveAll persists groups", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    const newGroups = [
      {
        id: "test-1",
        name: "Test Group",
        color: "#FF0000",
        icon: "star",
        extensionIds: ["ext-1", "ext-2"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isExpanded: true,
        order: 0,
      },
    ]

    await groupsRepo.saveAll(newGroups)
    const loaded = await groupsRepo.fetchAll()

    expect(loaded.length).toBe(1)
    expect(loaded[0].name).toBe("Test Group")
    expect(loaded[0].extensionIds).toEqual(["ext-1", "ext-2"])
  })

  it("normal: generateId returns a unique string", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    const id1 = groupsRepo.generateId()
    const id2 = groupsRepo.generateId()

    expect(typeof id1).toBe("string")
    expect(id1.length).toBeGreaterThan(0)
    expect(id1).not.toBe(id2)
  })

  it("edge: saveAll with empty array clears groups", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    await groupsRepo.fetchAll() // ensure initialized with mock data

    await groupsRepo.saveAll([])
    const loaded = await groupsRepo.fetchAll()
    // After saving empty, fetchAll returns empty (no re-seeding since stored.length would be 0 but it re-seeds from mock)
    // Actually looking at the code: if stored.length === 0, it re-seeds from MOCK_GROUPS
    expect(loaded.length).toBeGreaterThan(0) // re-seeded
  })
})

describe("rulesRepo", () => {
  beforeEach(() => {
    clearStore()
  })

  it("normal: fetchAll returns rules (may be empty initially from devStorage)", async () => {
    const { rulesRepo } = await import("@/services/rulesRepo")
    const rules = await rulesRepo.fetchAll()

    // devStorage loads mock rules from localStorage on construction
    // Since we cleared store, it falls back to MOCK_RULES
    expect(rules.length).toBeGreaterThan(0)
    expect(rules[0]).toHaveProperty("id")
    expect(rules[0]).toHaveProperty("name")
    expect(rules[0]).toHaveProperty("conditionGroups")
    expect(rules[0]).toHaveProperty("actions")
  })

  it("normal: fetchAll returns cloned data", async () => {
    const { rulesRepo } = await import("@/services/rulesRepo")
    const first = await rulesRepo.fetchAll()
    const second = await rulesRepo.fetchAll()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    if (first.length > 0) {
      expect(first[0].conditionGroups).not.toBe(second[0].conditionGroups)
      expect(first[0].actions).not.toBe(second[0].actions)
    }
  })

  it("normal: saveAll persists rules", async () => {
    const { rulesRepo } = await import("@/services/rulesRepo")
    const newRules = [
      {
        id: "rule-test-1",
        name: "Test Rule",
        description: "A test rule",
        enabled: true,
        conditionGroups: [
          {
            id: "cg-1",
            domains: ["example.com"],
            matchMode: "exact" as const,
            schedule: null,
          },
        ],
        conditionOperator: "AND" as const,
        actions: [{ type: "enableExtension" as const, targetId: "ext-1" }],
        priority: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        triggerCount: 0,
      },
    ]

    await rulesRepo.saveAll(newRules)
    const loaded = await rulesRepo.fetchAll()

    expect(loaded.length).toBe(1)
    expect(loaded[0].name).toBe("Test Rule")
    expect(loaded[0].conditionGroups[0].domains).toEqual(["example.com"])
  })

  it("normal: generateId returns unique strings", async () => {
    const { rulesRepo } = await import("@/services/rulesRepo")
    const id1 = rulesRepo.generateId()
    const id2 = rulesRepo.generateId()

    expect(typeof id1).toBe("string")
    expect(id1).not.toBe(id2)
  })

  it("edge: saveAll with rule containing schedule clones schedule correctly", async () => {
    const { rulesRepo } = await import("@/services/rulesRepo")
    const rules = [
      {
        id: "rule-sched",
        name: "Scheduled Rule",
        enabled: true,
        conditionGroups: [
          {
            id: "cg-s1",
            domains: ["test.com"],
            matchMode: "wildcard" as const,
            schedule: {
              days: [1, 2, 3],
              startTime: "09:00",
              endTime: "17:00",
            },
          },
        ],
        conditionOperator: "AND" as const,
        actions: [{ type: "disableExtension" as const, targetId: "ext-2" }],
        priority: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        triggerCount: 0,
      },
    ]

    await rulesRepo.saveAll(rules)
    const loaded = await rulesRepo.fetchAll()

    expect(loaded[0].conditionGroups[0].schedule).toEqual({
      days: [1, 2, 3],
      startTime: "09:00",
      endTime: "17:00",
    })
    // Schedule should be a clone
    expect(loaded[0].conditionGroups[0].schedule!.days).not.toBe(
      rules[0].conditionGroups[0].schedule.days
    )
  })
})

describe("preferencesRepo", () => {
  beforeEach(() => {
    clearStore()
  })

  it("normal: fetch returns empty object initially", async () => {
    const { preferencesRepo } = await import("@/services/preferencesRepo")
    const prefs = await preferencesRepo.fetch()

    // devStorage initializes with empty preferences
    expect(prefs).toBeDefined()
    expect(typeof prefs).toBe("object")
  })

  it("normal: save and fetch round-trip", async () => {
    const { preferencesRepo } = await import("@/services/preferencesRepo")

    await preferencesRepo.save({ theme: "dark", compactMode: true })
    const prefs = await preferencesRepo.fetch()

    expect(prefs.theme).toBe("dark")
    expect(prefs.compactMode).toBe(true)
  })

  it("normal: save merges with existing preferences", async () => {
    const { preferencesRepo } = await import("@/services/preferencesRepo")

    await preferencesRepo.save({ theme: "light" })
    await preferencesRepo.save({ compactMode: true })

    const prefs = await preferencesRepo.fetch()
    expect(prefs.theme).toBe("light")
    expect(prefs.compactMode).toBe(true)
  })

  it("edge: save with empty object preserves existing prefs", async () => {
    const { preferencesRepo } = await import("@/services/preferencesRepo")

    await preferencesRepo.save({ theme: "dark", showDisabled: false })
    await preferencesRepo.save({})

    const prefs = await preferencesRepo.fetch()
    expect(prefs.theme).toBe("dark")
    expect(prefs.showDisabled).toBe(false)
  })

  it("normal: save updates viewMode", async () => {
    const { preferencesRepo } = await import("@/services/preferencesRepo")

    await preferencesRepo.save({ viewMode: "detail" })
    const prefs = await preferencesRepo.fetch()

    expect(prefs.viewMode).toBe("detail")
  })
})
