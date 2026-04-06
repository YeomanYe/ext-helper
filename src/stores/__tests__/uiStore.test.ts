import { beforeEach, describe, expect, it, vi } from "vitest"

const repo = vi.hoisted(() => ({
  fetch: vi.fn(),
  save: vi.fn()
}))

vi.mock("@/services/preferencesRepo", () => ({
  preferencesRepo: repo
}))

describe("uiStore", () => {
  let addFn: ReturnType<typeof vi.fn>
  let removeFn: ReturnType<typeof vi.fn>
  let toggleFn: ReturnType<typeof vi.fn>

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

    addFn = vi.fn()
    removeFn = vi.fn()
    toggleFn = vi.fn()

    Object.defineProperty(globalThis, "document", {
      value: {
        documentElement: {
          classList: {
            add: addFn,
            remove: removeFn,
            toggle: toggleFn
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

  // ----------------------------------------------------------------
  // setTheme
  // ----------------------------------------------------------------
  describe("setTheme", () => {
    it("normal: should set dark theme and add dark class", async () => {
      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setTheme("dark")

      expect(useUIStore.getState().theme).toBe("dark")
      expect(addFn).toHaveBeenCalledWith("dark")
      expect(repo.save).toHaveBeenCalledWith({ theme: "dark" })
    })

    it("normal: should set light theme and remove dark class", async () => {
      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setTheme("light")

      expect(useUIStore.getState().theme).toBe("light")
      expect(removeFn).toHaveBeenCalledWith("dark")
      expect(repo.save).toHaveBeenCalledWith({ theme: "light" })
    })

    it("normal: should set system theme and toggle dark class based on media query", async () => {
      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setTheme("system")

      expect(useUIStore.getState().theme).toBe("system")
      expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)")
      expect(toggleFn).toHaveBeenCalledWith("dark", true)
      expect(repo.save).toHaveBeenCalledWith({ theme: "system" })
    })

    it("abnormal: should handle save failure gracefully", async () => {
      repo.save.mockRejectedValueOnce(new Error("storage full"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setTheme("dark")

      // State should still be updated even though save failed
      expect(useUIStore.getState().theme).toBe("dark")
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save theme preference:",
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  // ----------------------------------------------------------------
  // toggleCompactMode
  // ----------------------------------------------------------------
  describe("toggleCompactMode", () => {
    it("normal: should toggle compact mode from false to true", async () => {
      const { useUIStore } = await import("../uiStore")
      expect(useUIStore.getState().compactMode).toBe(false)

      await useUIStore.getState().toggleCompactMode()

      expect(useUIStore.getState().compactMode).toBe(true)
      expect(repo.save).toHaveBeenCalledWith({ compactMode: true })
    })

    it("normal: should toggle compact mode from true to false", async () => {
      const { useUIStore } = await import("../uiStore")
      useUIStore.setState({ compactMode: true })

      await useUIStore.getState().toggleCompactMode()

      expect(useUIStore.getState().compactMode).toBe(false)
      expect(repo.save).toHaveBeenCalledWith({ compactMode: false })
    })

    it("abnormal: should handle save failure gracefully", async () => {
      repo.save.mockRejectedValueOnce(new Error("save error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().toggleCompactMode()

      expect(useUIStore.getState().compactMode).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save compact mode preference:",
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  // ----------------------------------------------------------------
  // toggleShowDisabled
  // ----------------------------------------------------------------
  describe("toggleShowDisabled", () => {
    it("normal: should toggle showDisabled from true to false", async () => {
      const { useUIStore } = await import("../uiStore")
      expect(useUIStore.getState().showDisabled).toBe(true)

      await useUIStore.getState().toggleShowDisabled()

      expect(useUIStore.getState().showDisabled).toBe(false)
      expect(repo.save).toHaveBeenCalledWith({ showDisabled: false })
    })

    it("normal: should toggle showDisabled from false to true", async () => {
      const { useUIStore } = await import("../uiStore")
      useUIStore.setState({ showDisabled: false })

      await useUIStore.getState().toggleShowDisabled()

      expect(useUIStore.getState().showDisabled).toBe(true)
      expect(repo.save).toHaveBeenCalledWith({ showDisabled: true })
    })

    it("abnormal: should handle save failure gracefully", async () => {
      repo.save.mockRejectedValueOnce(new Error("save error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().toggleShowDisabled()

      expect(useUIStore.getState().showDisabled).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save show disabled preference:",
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  // ----------------------------------------------------------------
  // setViewMode
  // ----------------------------------------------------------------
  describe("setViewMode", () => {
    it("normal: should set view mode to detail", async () => {
      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setViewMode("detail")

      expect(useUIStore.getState().viewMode).toBe("detail")
      expect(repo.save).toHaveBeenCalledWith({ viewMode: "detail" })
    })

    it("normal: should set view mode to card", async () => {
      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setViewMode("card")

      expect(useUIStore.getState().viewMode).toBe("card")
      expect(repo.save).toHaveBeenCalledWith({ viewMode: "card" })
    })

    it("normal: should set view mode to compact", async () => {
      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setViewMode("compact")

      expect(useUIStore.getState().viewMode).toBe("compact")
      expect(repo.save).toHaveBeenCalledWith({ viewMode: "compact" })
    })

    it("abnormal: should handle save failure gracefully", async () => {
      repo.save.mockRejectedValueOnce(new Error("save error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const { useUIStore } = await import("../uiStore")
      await useUIStore.getState().setViewMode("detail")

      expect(useUIStore.getState().viewMode).toBe("detail")
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save view mode preference:",
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  // ----------------------------------------------------------------
  // initializeUIStore
  // ----------------------------------------------------------------
  describe("initializeUIStore", () => {
    it("normal: should load preferences and apply dark theme", async () => {
      const { initializeUIStore, useUIStore } = await import("../uiStore")
      await initializeUIStore()

      const state = useUIStore.getState()
      expect(state.theme).toBe("dark")
      expect(state.compactMode).toBe(true)
      expect(state.showDisabled).toBe(false)
      expect(state.viewMode).toBe("detail")
      expect(addFn).toHaveBeenCalledWith("dark")
    })

    it("normal: should apply light theme from preferences", async () => {
      repo.fetch.mockResolvedValueOnce({
        theme: "light",
        compactMode: false,
        showDisabled: true,
        viewMode: "compact"
      })

      const { initializeUIStore, useUIStore } = await import("../uiStore")
      await initializeUIStore()

      const state = useUIStore.getState()
      expect(state.theme).toBe("light")
      expect(removeFn).toHaveBeenCalledWith("dark")
    })

    it("normal: should apply system theme from preferences", async () => {
      repo.fetch.mockResolvedValueOnce({
        theme: "system",
        compactMode: false,
        showDisabled: true,
        viewMode: "compact"
      })

      const { initializeUIStore } = await import("../uiStore")
      await initializeUIStore()

      expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)")
      expect(toggleFn).toHaveBeenCalledWith("dark", true)
    })

    it("edge: should handle missing/empty preferences", async () => {
      repo.fetch.mockResolvedValueOnce(null)

      const { initializeUIStore, useUIStore } = await import("../uiStore")
      await initializeUIStore()

      // Should keep defaults
      const state = useUIStore.getState()
      expect(state.theme).toBe("system")
      expect(state.compactMode).toBe(false)
      expect(state.showDisabled).toBe(true)
      expect(state.viewMode).toBe("compact")
    })

    it("edge: should handle partial preferences (only theme set)", async () => {
      repo.fetch.mockResolvedValueOnce({ theme: "light" })

      const { initializeUIStore, useUIStore } = await import("../uiStore")
      await initializeUIStore()

      const state = useUIStore.getState()
      expect(state.theme).toBe("light")
      // Defaults preserved for unset fields
      expect(state.compactMode).toBe(false)
      expect(state.showDisabled).toBe(true)
      expect(state.viewMode).toBe("compact")
    })

    it("abnormal: should handle fetch failure gracefully", async () => {
      repo.fetch.mockRejectedValueOnce(new Error("network error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const { initializeUIStore, useUIStore } = await import("../uiStore")
      await initializeUIStore()

      // Should keep defaults
      const state = useUIStore.getState()
      expect(state.theme).toBe("system")
      expect(state.compactMode).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to initialize UI store:",
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })
})
