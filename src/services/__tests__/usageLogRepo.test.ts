import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UsageLogEvent } from "@/types"

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

const buildEvent = (overrides: Partial<UsageLogEvent> = {}): UsageLogEvent => ({
  id: `event-${overrides.timestamp ?? Date.now()}`,
  extensionId: "ext-1",
  extensionName: "Extension One",
  action: "enabled",
  timestamp: 1000,
  source: "popup",
  ...overrides,
})

describe("usageLogRepo", () => {
  beforeEach(() => {
    vi.resetModules()
    clearStore()
  })

  it("normal: append persists usage events newest first", async () => {
    const { usageLogRepo } = await import("@/services/usageLogRepo")
    await usageLogRepo.clear()

    await usageLogRepo.append(buildEvent({ id: "older", action: "disabled", timestamp: 1000 }), {
      dedupe: false,
    })
    await usageLogRepo.append(buildEvent({ id: "newer", action: "enabled", timestamp: 2000 }), {
      dedupe: false,
    })

    const events = await usageLogRepo.fetchAll()
    expect(events.map((event) => event.id)).toEqual(["newer", "older"])
  })

  it("normal: trims old events after the max event count", async () => {
    const { usageLogRepo } = await import("@/services/usageLogRepo")
    await usageLogRepo.clear()

    for (let index = 0; index < 505; index += 1) {
      await usageLogRepo.append(
        buildEvent({
          id: `event-${index}`,
          extensionId: `ext-${index}`,
          timestamp: index,
        }),
        { dedupe: false }
      )
    }

    const events = await usageLogRepo.fetchAll()
    expect(events).toHaveLength(500)
    expect(events[0].id).toBe("event-504")
    expect(events.at(-1)?.id).toBe("event-5")
  })

  it("normal: aggregates stats by action and extension", async () => {
    const { usageLogRepo } = await import("@/services/usageLogRepo")
    await usageLogRepo.clear()

    await usageLogRepo.append(buildEvent({ id: "a", action: "enabled" }), { dedupe: false })
    await usageLogRepo.append(buildEvent({ id: "b", action: "disabled" }), { dedupe: false })
    await usageLogRepo.append(buildEvent({ id: "c", action: "enabled" }), { dedupe: false })

    const stats = await usageLogRepo.getStats()
    expect(stats.total).toBe(3)
    expect(stats.byAction.enabled).toBe(2)
    expect(stats.byAction.disabled).toBe(1)
    expect(stats.byExtension["ext-1"]).toMatchObject({
      extensionName: "Extension One",
      enabled: 2,
      disabled: 1,
      total: 3,
    })
  })

  it("normal: clear removes events and resets stats", async () => {
    const { usageLogRepo } = await import("@/services/usageLogRepo")
    await usageLogRepo.clear()

    await usageLogRepo.append(buildEvent(), { dedupe: false })
    await usageLogRepo.clear()

    expect(await usageLogRepo.fetchAll()).toEqual([])
    expect(await usageLogRepo.getStats()).toMatchObject({
      total: 0,
      byAction: {
        enabled: 0,
        disabled: 0,
        installed: 0,
        uninstalled: 0,
      },
      byExtension: {},
    })
  })

  it("normal: dedupes matching enable events inside the duplicate window", async () => {
    const { usageLogRepo } = await import("@/services/usageLogRepo")
    await usageLogRepo.clear()

    await usageLogRepo.append(
      buildEvent({ id: "popup", action: "enabled", timestamp: 1000, source: "popup" })
    )
    await usageLogRepo.append(
      buildEvent({ id: "browser", action: "enabled", timestamp: 1500, source: "browser" })
    )

    const events = await usageLogRepo.fetchAll()
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe("popup")
  })

  it("normal: createUsageLogEvent preserves extension iconUrl", async () => {
    const { createUsageLogEvent } = await import("@/services/usageLogRepo")

    const event = createUsageLogEvent(
      { id: "ext-with-icon", name: "Extension With Icon", iconUrl: "chrome://icon.png" },
      "enabled",
      "popup"
    )

    expect(event).toMatchObject({
      extensionId: "ext-with-icon",
      extensionName: "Extension With Icon",
      iconUrl: "chrome://icon.png",
      action: "enabled",
      source: "popup",
    })
  })
})
