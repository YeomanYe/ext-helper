import { beforeEach, describe, expect, it, vi } from "vitest"

const repo = vi.hoisted(() => ({
  fetch: vi.fn(),
  save: vi.fn()
}))

vi.mock("@/services/preferencesRepo", () => ({
  preferencesRepo: repo
}))

describe("uiStore", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    repo.fetch.mockResolvedValue({
      theme: "dark",
      compactMode: true,
      showDisabled: false,
      viewMode: "detail"
    })
    repo.save.mockResolvedValue(undefined)

    Object.defineProperty(globalThis, "document", {
      value: {
        documentElement: {
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            toggle: vi.fn()
          }
        }
      },
      configurable: true
    })
    Object.defineProperty(globalThis, "window", {
      value: {
        matchMedia: vi.fn(() => ({ matches: true }))
      },
      configurable: true
    })
  })

  it("hydrates preferences without writing them back", async () => {
    const { initializeUIStore, useUIStore } = await import("../uiStore")
    await initializeUIStore()

    const state = useUIStore.getState()
    expect(state.theme).toBe("dark")
    expect(state.compactMode).toBe(true)
    expect(state.showDisabled).toBe(false)
    expect(state.viewMode).toBe("detail")
    expect(repo.save).not.toHaveBeenCalled()
  })
})
