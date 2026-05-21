import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UsageLogEvent, UsageLogStats } from "@/types"

const repo = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  getStats: vi.fn(),
  clear: vi.fn(),
}))

vi.mock("@/services/usageLogRepo", () => ({
  usageLogRepo: repo,
  createEmptyUsageLogStats: () => ({
    total: 0,
    byAction: {
      enabled: 0,
      disabled: 0,
      installed: 0,
      uninstalled: 0,
    },
    byExtension: {},
  }),
}))

const event: UsageLogEvent = {
  id: "event-1",
  extensionId: "ext-1",
  extensionName: "Extension One",
  action: "enabled",
  timestamp: 1000,
  source: "popup",
}

const stats: UsageLogStats = {
  total: 1,
  byAction: {
    enabled: 1,
    disabled: 0,
    installed: 0,
    uninstalled: 0,
  },
  byExtension: {
    "ext-1": {
      extensionName: "Extension One",
      enabled: 1,
      disabled: 0,
      installed: 0,
      uninstalled: 0,
      total: 1,
      lastEventAt: 1000,
    },
  },
}

describe("usageLogStore", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    repo.fetchAll.mockResolvedValue([event])
    repo.getStats.mockResolvedValue(stats)
    repo.clear.mockResolvedValue(undefined)
  })

  it("normal: fetchUsageLog loads events and stats", async () => {
    const { useUsageLogStore } = await import("../usageLogStore")

    await useUsageLogStore.getState().fetchUsageLog()

    expect(useUsageLogStore.getState().events).toEqual([event])
    expect(useUsageLogStore.getState().stats).toEqual(stats)
    expect(useUsageLogStore.getState().loading).toBe(false)
    expect(useUsageLogStore.getState().error).toBeNull()
  })

  it("normal: clearUsageLog clears persisted log and refreshes derived state", async () => {
    repo.fetchAll.mockResolvedValueOnce([event]).mockResolvedValueOnce([])
    repo.getStats.mockResolvedValueOnce(stats).mockResolvedValueOnce({
      total: 0,
      byAction: {
        enabled: 0,
        disabled: 0,
        installed: 0,
        uninstalled: 0,
      },
      byExtension: {},
    })
    const { useUsageLogStore } = await import("../usageLogStore")

    await useUsageLogStore.getState().fetchUsageLog()
    await useUsageLogStore.getState().clearUsageLog()

    expect(repo.clear).toHaveBeenCalledOnce()
    expect(useUsageLogStore.getState().events).toEqual([])
    expect(useUsageLogStore.getState().stats.total).toBe(0)
  })

  it("abnormal: fetchUsageLog stores a readable error", async () => {
    repo.fetchAll.mockRejectedValue(new Error("load failed"))
    const { useUsageLogStore } = await import("../usageLogStore")

    await useUsageLogStore.getState().fetchUsageLog()

    expect(useUsageLogStore.getState().events).toEqual([])
    expect(useUsageLogStore.getState().error).toBe("load failed")
    expect(useUsageLogStore.getState().loading).toBe(false)
  })
})
