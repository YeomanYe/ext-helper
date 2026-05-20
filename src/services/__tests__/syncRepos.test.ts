import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Group } from "@/types"
import type { Rule } from "@/rules/types"

const runtimeMode = vi.hoisted(() => ({
  dev: false,
}))

const browserLocal = vi.hoisted(() => ({}) as Record<string, unknown>)
const browserSync = vi.hoisted(() => ({}) as Record<string, unknown>)

const adapter = vi.hoisted(() => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  getSyncStorage: vi.fn(),
  setSyncStorage: vi.fn(),
  removeSyncStorage: vi.fn(),
}))

vi.mock("@/services/mockData", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import("@/services/mockData")>()
  return {
    ...original,
    isDevMode: () => runtimeMode.dev,
  }
})

vi.mock("@/services/browser/adapter", () => ({
  browserAdapter: adapter,
}))

const localStore: Record<string, string> = {}

vi.stubGlobal("localStorage", {
  getItem: (key: string) => localStore[key] ?? null,
  setItem: (key: string, value: string) => {
    localStore[key] = value
  },
  removeItem: (key: string) => {
    delete localStore[key]
  },
  clear: () => {
    Object.keys(localStore).forEach((key) => delete localStore[key])
  },
})

function clearRecord(record: Record<string, unknown>) {
  Object.keys(record).forEach((key) => delete record[key])
}

function makeGroup(id: string): Group {
  return {
    id,
    name: `Group ${id}`,
    color: "#ff0000",
    icon: "box",
    extensionIds: [`ext-${id}`],
    createdAt: 1,
    updatedAt: 2,
    isExpanded: true,
    order: 0,
  }
}

function makeRule(id: string): Rule {
  return {
    id,
    name: `Rule ${id}`,
    enabled: true,
    conditionGroups: [
      {
        id: `condition-${id}`,
        domains: ["example.com"],
        matchMode: "exact",
        schedule: null,
      },
    ],
    conditionOperator: "AND",
    actions: [{ type: "enableExtension", targetId: `ext-${id}` }],
    priority: 1,
    createdAt: 1,
    updatedAt: 2,
    triggerCount: 0,
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  runtimeMode.dev = false
  clearRecord(browserLocal)
  clearRecord(browserSync)
  clearRecord(localStore)

  adapter.getStorage.mockImplementation(async (key: string) => browserLocal[key])
  adapter.setStorage.mockImplementation(async (key: string, value: unknown) => {
    browserLocal[key] = value
  })
  adapter.getSyncStorage.mockImplementation(async (key: string) => browserSync[key])
  adapter.setSyncStorage.mockImplementation(async (key: string, value: unknown) => {
    browserSync[key] = value
  })
  adapter.removeSyncStorage.mockImplementation(async (keys: string[]) => {
    keys.forEach((key) => delete browserSync[key])
  })
})

describe("extension-mode sync repositories", () => {
  it("migrates local preferences to sync on first fetch and marks migration complete", async () => {
    browserLocal["ext-helper-preferences"] = { theme: "dark", compactMode: true }

    const { preferencesRepo } = await import("@/services/preferencesRepo")

    await expect(preferencesRepo.fetch()).resolves.toEqual({
      theme: "dark",
      compactMode: true,
    })
    expect(browserSync["ext_helper_preferences"]).toEqual({ theme: "dark", compactMode: true })
    expect(browserLocal["ext_helper_sync_migrated_preferences_v1"]).toBe(true)
  })

  it("saves preferences by merging existing sync preferences", async () => {
    browserLocal["ext_helper_sync_migrated_preferences_v1"] = true
    browserSync["ext_helper_preferences"] = { theme: "light", compactMode: false }

    const { preferencesRepo } = await import("@/services/preferencesRepo")

    await preferencesRepo.save({ compactMode: true, viewMode: "detail" })

    expect(browserSync["ext_helper_preferences"]).toEqual({
      theme: "light",
      compactMode: true,
      viewMode: "detail",
    })
    await expect(preferencesRepo.fetch()).resolves.toEqual({
      theme: "light",
      compactMode: true,
      viewMode: "detail",
    })
  })

  it("keeps dev:web preferences on devStorage without using browser sync", async () => {
    runtimeMode.dev = true

    const { preferencesRepo } = await import("@/services/preferencesRepo")

    await preferencesRepo.save({ theme: "dark" })
    await expect(preferencesRepo.fetch()).resolves.toEqual({ theme: "dark" })
    expect(adapter.getSyncStorage).not.toHaveBeenCalled()
    expect(adapter.setSyncStorage).not.toHaveBeenCalled()
  })

  it("reads groups from sync index and removes stale item keys when clearing groups", async () => {
    browserLocal["ext_helper_sync_migrated_groups_v1"] = true
    browserSync["ext_helper_groups_index"] = ["a", "b"]
    browserSync["ext_helper_group_a"] = makeGroup("a")
    browserSync["ext_helper_group_b"] = makeGroup("b")

    const { groupsRepo } = await import("@/services/groupsRepo")

    await expect(groupsRepo.fetchAll()).resolves.toEqual([makeGroup("a"), makeGroup("b")])

    await groupsRepo.saveAll([])

    expect(browserSync["ext_helper_groups_index"]).toEqual([])
    expect(browserSync["ext_helper_group_a"]).toBeUndefined()
    expect(browserSync["ext_helper_group_b"]).toBeUndefined()
    expect(adapter.removeSyncStorage).toHaveBeenCalledWith([
      "ext_helper_group_a",
      "ext_helper_group_b",
    ])
  })

  it("reads rules from sync index and removes stale item keys when deleting rules", async () => {
    browserLocal["ext_helper_sync_migrated_rules_v1"] = true
    browserSync["ext_helper_rules_index"] = ["a", "b"]
    browserSync["ext_helper_rule_a"] = makeRule("a")
    browserSync["ext_helper_rule_b"] = makeRule("b")

    const { rulesRepo } = await import("@/services/rulesRepo")

    await expect(rulesRepo.fetchAll()).resolves.toEqual([makeRule("a"), makeRule("b")])

    await rulesRepo.saveAll([makeRule("a")])

    expect(browserSync["ext_helper_rules_index"]).toEqual(["a"])
    expect(browserSync["ext_helper_rule_a"]).toEqual(makeRule("a"))
    expect(browserSync["ext_helper_rule_b"]).toBeUndefined()
    expect(adapter.removeSyncStorage).toHaveBeenCalledWith(["ext_helper_rule_b"])
  })
})
