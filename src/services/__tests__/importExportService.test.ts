import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Group, ImportExportPayload, UsageLogEvent } from "@/types"
import type { Rule } from "@/rules/types"

vi.mock("@/services/mockData", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import("@/services/mockData")>()
  return {
    ...original,
    isDevMode: () => true,
  }
})

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
    Object.keys(store).forEach((key) => delete store[key])
  },
})

const clearStore = () => {
  Object.keys(store).forEach((key) => delete store[key])
}

const buildGroup = (id: string): Group => ({
  id,
  name: `Group ${id}`,
  color: "#00ffff",
  icon: "folder",
  extensionIds: [`ext-${id}`],
  createdAt: 100,
  updatedAt: 200,
  isExpanded: true,
  order: 0,
})

const buildRule = (id: string): Rule => ({
  id,
  name: `Rule ${id}`,
  enabled: true,
  conditionGroups: [
    {
      id: `condition-${id}`,
      domains: ["example.com"],
      matchMode: "contains",
      schedule: null,
    },
  ],
  conditionOperator: "AND",
  actions: [{ type: "enableExtension", targetId: "ext-1" }],
  priority: 1,
  createdAt: 100,
  updatedAt: 200,
  triggerCount: 0,
})

const buildUsageEvent = (id: string, timestamp: number): UsageLogEvent => ({
  id,
  extensionId: `ext-${id}`,
  extensionName: `Extension ${id}`,
  action: "enabled",
  timestamp,
  source: "popup",
})

describe("importExportService", () => {
  beforeEach(() => {
    vi.resetModules()
    clearStore()
  })

  it("normal: builds a versioned export payload and only includes selected domains", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    const { rulesRepo } = await import("@/services/rulesRepo")
    const { preferencesRepo } = await import("@/services/preferencesRepo")
    const { usageLogRepo } = await import("@/services/usageLogRepo")
    const { createExportPayload } = await import("@/services/importExportService")

    await groupsRepo.saveAll([buildGroup("one")])
    await rulesRepo.saveAll([buildRule("one")])
    await preferencesRepo.save({ theme: "dark", compactMode: true, showDisabled: false })
    await usageLogRepo.replaceAll([buildUsageEvent("one", 1000)])

    const payload = await createExportPayload({
      domains: ["groups", "rules", "preferences"],
      now: () => new Date("2026-05-21T12:00:00.000Z"),
    })

    expect(payload).toMatchObject({
      schemaVersion: 1,
      exportedAt: "2026-05-21T12:00:00.000Z",
      data: {
        groups: [{ id: "one" }],
        rules: [{ id: "one" }],
        preferences: { theme: "dark", compactMode: true, showDisabled: false },
      },
    })
    expect(payload.data).not.toHaveProperty("usageLog")
  })

  it("normal: previews valid payloads without writing to repositories", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    const { parseImportPayload } = await import("@/services/importExportService")

    await groupsRepo.saveAll([buildGroup("local")])

    const payload: ImportExportPayload = {
      schemaVersion: 1,
      exportedAt: "2026-05-21T12:00:00.000Z",
      data: {
        groups: [buildGroup("incoming")],
        preferences: { theme: "light", compactMode: false, showDisabled: true },
      },
    }

    const parsed = parseImportPayload(JSON.stringify(payload))

    expect(parsed.preview.compatible).toBe(true)
    expect(parsed.preview.exportedAt).toBe("2026-05-21T12:00:00.000Z")
    expect(parsed.preview.domains).toEqual([
      { domain: "groups", label: "Groups", count: 1, selected: true },
      { domain: "preferences", label: "Preferences", count: 3, selected: true },
    ])
    expect((await groupsRepo.fetchAll()).map((group) => group.id)).toEqual(["local"])
  })

  it("edge: rejects invalid JSON, incompatible versions, and malformed payload data", async () => {
    const { parseImportPayload } = await import("@/services/importExportService")

    expect(() => parseImportPayload("{")).toThrow(/valid JSON/i)
    expect(() =>
      parseImportPayload(
        JSON.stringify({
          schemaVersion: 99,
          exportedAt: "2026-05-21T12:00:00.000Z",
          data: {},
        })
      )
    ).toThrow(/version/i)
    expect(() =>
      parseImportPayload(
        JSON.stringify({
          schemaVersion: 1,
          exportedAt: "2026-05-21T12:00:00.000Z",
          data: { groups: [{ id: "missing-fields" }] },
        })
      )
    ).toThrow(/groups/i)
  })

  it("normal: imports only confirmed domains", async () => {
    const { groupsRepo } = await import("@/services/groupsRepo")
    const { rulesRepo } = await import("@/services/rulesRepo")
    const { preferencesRepo } = await import("@/services/preferencesRepo")
    const { usageLogRepo } = await import("@/services/usageLogRepo")
    const { importSelectedDomains } = await import("@/services/importExportService")

    await groupsRepo.saveAll([buildGroup("local")])
    await rulesRepo.saveAll([buildRule("local")])
    await preferencesRepo.save({ theme: "dark", compactMode: true, showDisabled: false })
    await usageLogRepo.replaceAll([buildUsageEvent("local", 1000)])

    await importSelectedDomains(
      {
        schemaVersion: 1,
        exportedAt: "2026-05-21T12:00:00.000Z",
        data: {
          groups: [buildGroup("incoming")],
          rules: [buildRule("incoming")],
          preferences: { theme: "light", compactMode: false, showDisabled: true },
          usageLog: [buildUsageEvent("incoming", 2000)],
        },
      },
      ["groups", "usageLog"]
    )

    expect((await groupsRepo.fetchAll()).map((group) => group.id)).toEqual(["incoming"])
    expect((await rulesRepo.fetchAll()).map((rule) => rule.id)).toEqual(["local"])
    expect(await preferencesRepo.fetch()).toMatchObject({
      theme: "dark",
      compactMode: true,
      showDisabled: false,
    })
    expect((await usageLogRepo.fetchAll()).map((event) => event.id)).toEqual(["incoming"])
  })
})
