import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BisectSession, Extension } from "@/types"

const repo = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  setEnabled: vi.fn(),
  applySnapshot: vi.fn(),
  remove: vi.fn(),
  loadBisectSession: vi.fn(),
  saveBisectSession: vi.fn(),
  clearBisectSession: vi.fn(),
}))

vi.mock("@/services/extensionsRepo", () => ({
  extensionsRepo: repo,
}))

const makeExtension = (overrides: Partial<Extension> = {}): Extension => ({
  id: "x",
  name: "ExtX",
  description: "desc",
  version: "1.0.0",
  enabled: true,
  iconUrl: null,
  permissions: [],
  installType: "normal",
  optionsUrl: null,
  homepageUrl: null,
  ...overrides,
})

const sampleExtensions: Extension[] = [
  makeExtension({ id: "a", name: "Alpha", description: "" }),
  makeExtension({ id: "b", name: "Beta", description: "" }),
]

async function createStore(extensions?: Extension[]) {
  const { useExtensionStore } = await import("../extensionStore")
  repo.fetchAll.mockResolvedValue(extensions ?? sampleExtensions)
  await useExtensionStore.getState().fetchExtensions()
  return useExtensionStore
}

describe("extensionStore", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    repo.fetchAll.mockResolvedValue(sampleExtensions)
    repo.loadBisectSession.mockResolvedValue(null)
    repo.applySnapshot.mockResolvedValue(undefined)
    repo.setEnabled.mockResolvedValue(undefined)
    repo.remove.mockResolvedValue(undefined)
    repo.saveBisectSession.mockResolvedValue(undefined)
    repo.clearBisectSession.mockResolvedValue(undefined)
  })

  it("tracks undo/redo with typed history", async () => {
    const { useExtensionStore } = await import("../extensionStore")
    await useExtensionStore.getState().fetchExtensions()

    await useExtensionStore.getState().toggleExtension("a")
    expect(useExtensionStore.getState().extensions[0].enabled).toBe(false)
    expect(useExtensionStore.getState().undoCount).toBe(1)

    await useExtensionStore.getState().undoExtensions()
    expect(useExtensionStore.getState().extensions[0].enabled).toBe(true)
    expect(useExtensionStore.getState().redoCount).toBe(1)

    await useExtensionStore.getState().redoExtensions()
    expect(useExtensionStore.getState().extensions[0].enabled).toBe(false)
  })

  it("starts and persists bisect session", async () => {
    const { useExtensionStore } = await import("../extensionStore")
    await useExtensionStore.getState().fetchExtensions()

    await useExtensionStore.getState().startBisect()

    expect(useExtensionStore.getState().bisectSession.active).toBe(true)
    expect(repo.saveBisectSession).toHaveBeenCalledTimes(1)
  })

  it("restores a consistent persisted bisect session on fetch", async () => {
    const persistedSession: BisectSession = {
      active: true,
      phase: "running",
      baselineExtensions: sampleExtensions,
      allCandidateIds: ["a", "b"],
      candidateIds: ["a", "b"],
      currentTestIds: ["a"],
      parkedIds: ["b"],
      step: 1,
    }

    repo.fetchAll.mockResolvedValue([
      { ...sampleExtensions[0], enabled: true },
      { ...sampleExtensions[1], enabled: false },
    ])
    repo.loadBisectSession.mockResolvedValue(persistedSession)

    const { useExtensionStore } = await import("../extensionStore")
    await useExtensionStore.getState().fetchExtensions()

    expect(useExtensionStore.getState().bisectSession.active).toBe(true)
    expect(useExtensionStore.getState().bisectSession.currentTestIds).toEqual(["a"])
  })

  // ── toggleExtension ──────────────────────────────────────────────────

  describe("toggleExtension", () => {
    it("normal: should toggle an enabled extension to disabled", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")

      expect(store.getState().extensions[0].enabled).toBe(false)
      expect(repo.setEnabled).toHaveBeenCalledWith("a", false)
    })

    it("normal: should toggle a disabled extension to enabled", async () => {
      const exts = [
        makeExtension({ id: "a", name: "Alpha", enabled: false }),
        makeExtension({ id: "b", name: "Beta" }),
      ]
      const store = await createStore(exts)
      await store.getState().toggleExtension("a")

      expect(store.getState().extensions[0].enabled).toBe(true)
      expect(repo.setEnabled).toHaveBeenCalledWith("a", true)
    })

    it("normal: should push to history and clear future after toggle", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")

      expect(store.getState().undoCount).toBe(1)
      expect(store.getState().redoCount).toBe(0)
      expect(store.getState().canUndo).toBe(true)
      expect(store.getState().canRedo).toBe(false)
    })

    it("edge: should do nothing when bisect is active", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      const before = store.getState().extensions[0].enabled

      await store.getState().toggleExtension("a")
      expect(store.getState().extensions[0].enabled).toBe(before)
    })

    it("edge: should do nothing for a non-existent id", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("nonexistent")

      expect(repo.setEnabled).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await createStore()
      repo.setEnabled.mockRejectedValueOnce(new Error("network error"))

      await store.getState().toggleExtension("a")

      expect(store.getState().extensions[0].enabled).toBe(true)
      expect(store.getState().error).toBe("network error")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      repo.setEnabled.mockRejectedValueOnce("raw string")

      await store.getState().toggleExtension("a")

      expect(store.getState().extensions[0].enabled).toBe(true)
      expect(store.getState().error).toBe("Failed to toggle extension")
    })
  })

  // ── removeExtension ──────────────────────────────────────────────────

  describe("removeExtension", () => {
    it("normal: should remove an extension by id", async () => {
      const store = await createStore()
      await store.getState().removeExtension("a")

      expect(store.getState().extensions).toHaveLength(1)
      expect(store.getState().extensions[0].id).toBe("b")
      expect(repo.remove).toHaveBeenCalledWith("a")
    })

    it("normal: should push to history after removal", async () => {
      const store = await createStore()
      await store.getState().removeExtension("a")

      expect(store.getState().undoCount).toBe(1)
      expect(store.getState().canUndo).toBe(true)
    })

    it("edge: should do nothing when bisect is active", async () => {
      const store = await createStore()
      await store.getState().startBisect()

      await store.getState().removeExtension("a")
      expect(repo.remove).not.toHaveBeenCalled()
    })

    it("edge: should do nothing for a non-existent id", async () => {
      const store = await createStore()
      await store.getState().removeExtension("nonexistent")

      expect(repo.remove).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await createStore()
      repo.remove.mockRejectedValueOnce(new Error("remove failed"))

      await store.getState().removeExtension("a")

      expect(store.getState().extensions).toHaveLength(2)
      expect(store.getState().error).toBe("remove failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      repo.remove.mockRejectedValueOnce(42)

      await store.getState().removeExtension("a")

      expect(store.getState().extensions).toHaveLength(2)
      expect(store.getState().error).toBe("Failed to remove extension")
    })
  })

  // ── setExtensionsEnabled ─────────────────────────────────────────────

  describe("setExtensionsEnabled", () => {
    it("normal: should batch-disable multiple extensions", async () => {
      const store = await createStore()
      await store.getState().setExtensionsEnabled(["a", "b"], false)

      expect(store.getState().extensions.every((e) => !e.enabled)).toBe(true)
      expect(repo.applySnapshot).toHaveBeenCalledTimes(1)
    })

    it("normal: should batch-enable extensions that are disabled", async () => {
      const exts = [
        makeExtension({ id: "a", enabled: false }),
        makeExtension({ id: "b", enabled: false }),
      ]
      const store = await createStore(exts)
      await store.getState().setExtensionsEnabled(["a", "b"], true)

      expect(store.getState().extensions.every((e) => e.enabled)).toBe(true)
    })

    it("normal: should push to history after batch change", async () => {
      const store = await createStore()
      await store.getState().setExtensionsEnabled(["a"], false)

      expect(store.getState().undoCount).toBe(1)
    })

    it("edge: should do nothing when bisect is active", async () => {
      const store = await createStore()
      await store.getState().startBisect()

      await store.getState().setExtensionsEnabled(["a"], false)
      // applySnapshot called once for startBisect, not again for setExtensionsEnabled
      expect(repo.applySnapshot).toHaveBeenCalledTimes(1)
    })

    it("edge: should do nothing with empty ids array", async () => {
      const store = await createStore()
      await store.getState().setExtensionsEnabled([], false)

      expect(repo.applySnapshot).not.toHaveBeenCalled()
    })

    it("edge: should do nothing when no state change needed", async () => {
      const store = await createStore()
      // All are already enabled
      await store.getState().setExtensionsEnabled(["a", "b"], true)

      expect(repo.applySnapshot).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await createStore()
      repo.applySnapshot.mockRejectedValueOnce(new Error("batch failed"))

      await store.getState().setExtensionsEnabled(["a", "b"], false)

      expect(store.getState().extensions.every((e) => e.enabled)).toBe(true)
      expect(store.getState().error).toBe("batch failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      repo.applySnapshot.mockRejectedValueOnce(null)

      await store.getState().setExtensionsEnabled(["a", "b"], false)

      expect(store.getState().error).toBe("Failed to update extensions")
    })
  })

  // ── undoExtensions ───────────────────────────────────────────────────

  describe("undoExtensions", () => {
    it("normal: should undo the last change", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      expect(store.getState().extensions[0].enabled).toBe(false)

      await store.getState().undoExtensions()
      expect(store.getState().extensions[0].enabled).toBe(true)
      expect(store.getState().undoCount).toBe(0)
      expect(store.getState().redoCount).toBe(1)
    })

    it("normal: should undo multiple stacked changes", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      await store.getState().toggleExtension("b")

      await store.getState().undoExtensions()
      expect(store.getState().extensions[1].enabled).toBe(true)
      expect(store.getState().undoCount).toBe(1)

      await store.getState().undoExtensions()
      expect(store.getState().extensions[0].enabled).toBe(true)
      expect(store.getState().undoCount).toBe(0)
    })

    it("normal: should call applySnapshot to persist the undo", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      repo.applySnapshot.mockClear()

      await store.getState().undoExtensions()
      expect(repo.applySnapshot).toHaveBeenCalledTimes(1)
    })

    it("edge: should do nothing when history is empty", async () => {
      const store = await createStore()
      await store.getState().undoExtensions()

      expect(repo.applySnapshot).not.toHaveBeenCalled()
    })

    it("edge: should do nothing when bisect is active", async () => {
      const store = await createStore()
      // Start bisect first (both a and b are enabled)
      await store.getState().startBisect()
      expect(store.getState().bisectSession.active).toBe(true)
      repo.applySnapshot.mockClear()

      await store.getState().undoExtensions()
      // Should not call applySnapshot since bisect is active
      expect(repo.applySnapshot).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      repo.applySnapshot.mockRejectedValueOnce(new Error("undo failed"))

      await store.getState().undoExtensions()

      // Should revert to the toggled state (extension disabled)
      expect(store.getState().extensions[0].enabled).toBe(false)
      expect(store.getState().error).toBe("undo failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      repo.applySnapshot.mockRejectedValueOnce(undefined)

      await store.getState().undoExtensions()

      expect(store.getState().error).toBe("Failed to undo extension changes")
    })
  })

  // ── redoExtensions ───────────────────────────────────────────────────

  describe("redoExtensions", () => {
    it("normal: should redo an undone change", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      await store.getState().undoExtensions()
      repo.applySnapshot.mockClear()

      await store.getState().redoExtensions()
      expect(store.getState().extensions[0].enabled).toBe(false)
      expect(store.getState().undoCount).toBe(1)
      expect(store.getState().redoCount).toBe(0)
    })

    it("normal: should call applySnapshot to persist the redo", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      await store.getState().undoExtensions()
      repo.applySnapshot.mockClear()

      await store.getState().redoExtensions()
      expect(repo.applySnapshot).toHaveBeenCalledTimes(1)
    })

    it("normal: should redo multiple stacked undos", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      await store.getState().toggleExtension("b")
      await store.getState().undoExtensions()
      await store.getState().undoExtensions()

      await store.getState().redoExtensions()
      expect(store.getState().extensions[0].enabled).toBe(false)

      await store.getState().redoExtensions()
      expect(store.getState().extensions[1].enabled).toBe(false)
    })

    it("edge: should do nothing when future is empty", async () => {
      const store = await createStore()
      repo.applySnapshot.mockClear()

      await store.getState().redoExtensions()
      expect(repo.applySnapshot).not.toHaveBeenCalled()
    })

    it("edge: should do nothing when bisect is active", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      await store.getState().undoExtensions()
      await store.getState().startBisect()
      repo.applySnapshot.mockClear()

      await store.getState().redoExtensions()
      expect(repo.applySnapshot).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      await store.getState().undoExtensions()
      repo.applySnapshot.mockRejectedValueOnce(new Error("redo failed"))

      await store.getState().redoExtensions()

      // Should revert to the undone state (extension enabled)
      expect(store.getState().extensions[0].enabled).toBe(true)
      expect(store.getState().error).toBe("redo failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      await store.getState().toggleExtension("a")
      await store.getState().undoExtensions()
      repo.applySnapshot.mockRejectedValueOnce(false)

      await store.getState().redoExtensions()

      expect(store.getState().error).toBe("Failed to redo extension changes")
    })
  })

  // ── startBisect ──────────────────────────────────────────────────────

  describe("startBisect", () => {
    it("normal: should start bisect and split candidates", async () => {
      const store = await createStore()
      await store.getState().startBisect()

      const session = store.getState().bisectSession
      expect(session.active).toBe(true)
      expect(session.phase).toBe("running")
      expect(session.step).toBe(1)
      expect(session.allCandidateIds).toEqual(["a", "b"])
      expect(session.currentTestIds.length + session.parkedIds.length).toBe(2)
    })

    it("normal: should save bisect session to repo", async () => {
      const store = await createStore()
      await store.getState().startBisect()

      expect(repo.saveBisectSession).toHaveBeenCalledTimes(1)
      expect(repo.applySnapshot).toHaveBeenCalled()
    })

    it("normal: should set extensions according to bisect split", async () => {
      const store = await createStore()
      await store.getState().startBisect()

      const session = store.getState().bisectSession
      const testSet = new Set(session.currentTestIds)
      for (const ext of store.getState().extensions) {
        if (session.allCandidateIds.includes(ext.id)) {
          expect(ext.enabled).toBe(testSet.has(ext.id))
        }
      }
    })

    it("edge: should do nothing when bisect is already active", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.saveBisectSession.mockClear()

      await store.getState().startBisect()
      expect(repo.saveBisectSession).not.toHaveBeenCalled()
    })

    it("edge: should set error when fewer than 2 enabled extensions", async () => {
      const exts = [makeExtension({ id: "a", enabled: true })]
      const store = await createStore(exts)
      await store.getState().startBisect()

      expect(store.getState().bisectSession.active).toBe(false)
      expect(store.getState().error).toBe("Need at least two enabled extensions to start bisect")
    })

    it("edge: should set error when zero enabled extensions", async () => {
      const exts = [
        makeExtension({ id: "a", enabled: false }),
        makeExtension({ id: "b", enabled: false }),
      ]
      const store = await createStore(exts)
      await store.getState().startBisect()

      expect(store.getState().bisectSession.active).toBe(false)
      expect(store.getState().error).toBe("Need at least two enabled extensions to start bisect")
    })

    it("abnormal: should rollback on repo failure and clear bisect session", async () => {
      const store = await createStore()
      repo.applySnapshot.mockRejectedValueOnce(new Error("start failed"))

      await store.getState().startBisect()

      expect(store.getState().bisectSession.active).toBe(false)
      expect(store.getState().error).toBe("start failed")
      expect(repo.clearBisectSession).toHaveBeenCalled()
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      repo.applySnapshot.mockRejectedValueOnce("oops")

      await store.getState().startBisect()

      expect(store.getState().error).toBe("Failed to start bisect")
    })
  })

  // ── markBisectGood ───────────────────────────────────────────────────

  describe("markBisectGood", () => {
    async function startBisectSession(extCount = 4) {
      const exts = Array.from({ length: extCount }, (_, i) =>
        makeExtension({ id: `ext${i}`, name: `Ext${i}` })
      )
      const store = await createStore(exts)
      await store.getState().startBisect()
      return store
    }

    it("normal: should narrow candidates to parked ids", async () => {
      const store = await startBisectSession()
      const sessionBefore = store.getState().bisectSession
      const parkedBefore = sessionBefore.parkedIds

      await store.getState().markBisectGood()

      const sessionAfter = store.getState().bisectSession
      expect(sessionAfter.candidateIds).toEqual(parkedBefore)
      expect(sessionAfter.step).toBe(sessionBefore.step + 1)
    })

    it("normal: should persist the new session", async () => {
      const store = await startBisectSession()
      repo.saveBisectSession.mockClear()

      await store.getState().markBisectGood()
      expect(repo.saveBisectSession).toHaveBeenCalledTimes(1)
    })

    it("normal: should resolve when only 1 candidate remains", async () => {
      // With 2 extensions: split into [ext0] and [ext1]
      // markBisectGood => candidates = parkedIds = [ext1], length=1 => resolved
      const exts = [
        makeExtension({ id: "ext0", name: "Ext0" }),
        makeExtension({ id: "ext1", name: "Ext1" }),
      ]
      const store = await createStore(exts)
      await store.getState().startBisect()

      await store.getState().markBisectGood()

      const session = store.getState().bisectSession
      expect(session.phase).toBe("resolved")
      expect(session.resultId).toBeDefined()
    })

    it("edge: should do nothing when bisect is not active", async () => {
      const store = await createStore()
      repo.saveBisectSession.mockClear()

      await store.getState().markBisectGood()
      expect(repo.saveBisectSession).not.toHaveBeenCalled()
    })

    it("edge: should do nothing when phase is not running", async () => {
      const exts = [makeExtension({ id: "ext0" }), makeExtension({ id: "ext1" })]
      const store = await createStore(exts)
      await store.getState().startBisect()
      // Resolve it first
      await store.getState().markBisectGood()
      expect(store.getState().bisectSession.phase).toBe("resolved")
      repo.saveBisectSession.mockClear()

      // Now calling markBisectGood again should do nothing
      await store.getState().markBisectGood()
      expect(repo.saveBisectSession).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await startBisectSession()
      const sessionBefore = store.getState().bisectSession
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(new Error("good failed"))

      await store.getState().markBisectGood()

      expect(store.getState().bisectSession).toEqual(sessionBefore)
      expect(store.getState().error).toBe("good failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await startBisectSession()
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(123)

      await store.getState().markBisectGood()

      expect(store.getState().error).toBe("Failed to apply bisect result")
    })
  })

  // ── markBisectBad ────────────────────────────────────────────────────

  describe("markBisectBad", () => {
    async function startBisectSession(extCount = 4) {
      const exts = Array.from({ length: extCount }, (_, i) =>
        makeExtension({ id: `ext${i}`, name: `Ext${i}` })
      )
      const store = await createStore(exts)
      await store.getState().startBisect()
      return store
    }

    it("normal: should narrow candidates to currentTestIds", async () => {
      const store = await startBisectSession()
      const sessionBefore = store.getState().bisectSession
      const testIdsBefore = sessionBefore.currentTestIds

      await store.getState().markBisectBad()

      const sessionAfter = store.getState().bisectSession
      expect(sessionAfter.candidateIds).toEqual(testIdsBefore)
      expect(sessionAfter.step).toBe(sessionBefore.step + 1)
    })

    it("normal: should persist the new session", async () => {
      const store = await startBisectSession()
      repo.saveBisectSession.mockClear()

      await store.getState().markBisectBad()
      expect(repo.saveBisectSession).toHaveBeenCalledTimes(1)
    })

    it("normal: should resolve when only 1 candidate remains", async () => {
      // With 2 extensions: split into [ext0] and [ext1]
      // markBisectBad => candidates = currentTestIds = [ext0], length=1 => resolved
      const exts = [
        makeExtension({ id: "ext0", name: "Ext0" }),
        makeExtension({ id: "ext1", name: "Ext1" }),
      ]
      const store = await createStore(exts)
      await store.getState().startBisect()

      await store.getState().markBisectBad()

      const session = store.getState().bisectSession
      expect(session.phase).toBe("resolved")
      expect(session.resultId).toBeDefined()
    })

    it("edge: should do nothing when bisect is not active", async () => {
      const store = await createStore()
      repo.saveBisectSession.mockClear()

      await store.getState().markBisectBad()
      expect(repo.saveBisectSession).not.toHaveBeenCalled()
    })

    it("edge: should do nothing when phase is not running", async () => {
      const exts = [makeExtension({ id: "ext0" }), makeExtension({ id: "ext1" })]
      const store = await createStore(exts)
      await store.getState().startBisect()
      await store.getState().markBisectBad()
      expect(store.getState().bisectSession.phase).toBe("resolved")
      repo.saveBisectSession.mockClear()

      await store.getState().markBisectBad()
      expect(repo.saveBisectSession).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await startBisectSession()
      const sessionBefore = store.getState().bisectSession
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(new Error("bad failed"))

      await store.getState().markBisectBad()

      expect(store.getState().bisectSession).toEqual(sessionBefore)
      expect(store.getState().error).toBe("bad failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await startBisectSession()
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(null)

      await store.getState().markBisectBad()

      expect(store.getState().error).toBe("Failed to apply bisect result")
    })
  })

  // ── cancelBisect ─────────────────────────────────────────────────────

  describe("cancelBisect", () => {
    it("normal: should restore baseline extensions and deactivate", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      const baseline = store.getState().bisectSession.baselineExtensions

      await store.getState().cancelBisect()

      expect(store.getState().bisectSession.active).toBe(false)
      expect(store.getState().extensions.map((e) => e.id)).toEqual(baseline.map((e) => e.id))
      expect(store.getState().extensions.every((e) => e.enabled)).toBe(true)
    })

    it("normal: should clear bisect session in repo", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.clearBisectSession.mockClear()

      await store.getState().cancelBisect()
      expect(repo.clearBisectSession).toHaveBeenCalledTimes(1)
    })

    it("normal: should apply snapshot to persist the restore", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.applySnapshot.mockClear()

      await store.getState().cancelBisect()
      expect(repo.applySnapshot).toHaveBeenCalledTimes(1)
    })

    it("edge: should do nothing when bisect is not active", async () => {
      const store = await createStore()
      repo.applySnapshot.mockClear()
      repo.clearBisectSession.mockClear()

      await store.getState().cancelBisect()
      expect(repo.applySnapshot).not.toHaveBeenCalled()
      expect(repo.clearBisectSession).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(new Error("cancel failed"))

      await store.getState().cancelBisect()

      expect(store.getState().bisectSession.active).toBe(true)
      expect(store.getState().error).toBe("cancel failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(undefined)

      await store.getState().cancelBisect()

      expect(store.getState().error).toBe("Failed to cancel bisect")
    })
  })

  // ── finishBisectRestore ──────────────────────────────────────────────

  describe("finishBisectRestore", () => {
    it("normal: should restore baseline extensions and deactivate", async () => {
      const store = await createStore()
      await store.getState().startBisect()

      await store.getState().finishBisectRestore()

      expect(store.getState().bisectSession.active).toBe(false)
      expect(store.getState().extensions.every((e) => e.enabled)).toBe(true)
    })

    it("normal: should clear bisect session in repo", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.clearBisectSession.mockClear()

      await store.getState().finishBisectRestore()
      expect(repo.clearBisectSession).toHaveBeenCalledTimes(1)
    })

    it("normal: should apply snapshot to persist", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.applySnapshot.mockClear()

      await store.getState().finishBisectRestore()
      expect(repo.applySnapshot).toHaveBeenCalledTimes(1)
    })

    it("edge: should do nothing when bisect is not active", async () => {
      const store = await createStore()
      repo.applySnapshot.mockClear()

      await store.getState().finishBisectRestore()
      expect(repo.applySnapshot).not.toHaveBeenCalled()
    })

    it("abnormal: should rollback on repo failure", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(new Error("restore failed"))

      await store.getState().finishBisectRestore()

      expect(store.getState().bisectSession.active).toBe(true)
      expect(store.getState().error).toBe("restore failed")
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      const store = await createStore()
      await store.getState().startBisect()
      repo.applySnapshot.mockClear()
      repo.applySnapshot.mockRejectedValueOnce(0)

      await store.getState().finishBisectRestore()

      expect(store.getState().error).toBe("Failed to restore bisect baseline")
    })
  })

  // ── fetchExtensions ──────────────────────────────────────────────────

  describe("fetchExtensions", () => {
    it("normal: should load extensions and set loading states", async () => {
      const { useExtensionStore } = await import("../extensionStore")
      await useExtensionStore.getState().fetchExtensions()

      expect(useExtensionStore.getState().extensions).toHaveLength(2)
      expect(useExtensionStore.getState().loading).toBe(false)
      expect(useExtensionStore.getState().error).toBeNull()
    })

    it("normal: should clear inconsistent persisted bisect session", async () => {
      const inconsistentSession: BisectSession = {
        active: true,
        phase: "running",
        baselineExtensions: sampleExtensions,
        allCandidateIds: ["a", "b"],
        candidateIds: ["a", "b"],
        currentTestIds: ["a"],
        parkedIds: ["b"],
        step: 1,
      }
      // Extensions don't match expected bisect state (both enabled)
      repo.loadBisectSession.mockResolvedValue(inconsistentSession)

      const { useExtensionStore } = await import("../extensionStore")
      await useExtensionStore.getState().fetchExtensions()

      expect(useExtensionStore.getState().bisectSession.active).toBe(false)
      expect(repo.clearBisectSession).toHaveBeenCalled()
    })

    it("normal: should clear history on fetch", async () => {
      const { useExtensionStore } = await import("../extensionStore")
      await useExtensionStore.getState().fetchExtensions()
      await useExtensionStore.getState().toggleExtension("a")
      expect(useExtensionStore.getState().undoCount).toBe(1)

      await useExtensionStore.getState().fetchExtensions()
      expect(useExtensionStore.getState().undoCount).toBe(0)
      expect(useExtensionStore.getState().redoCount).toBe(0)
    })

    it("abnormal: should set error on fetch failure", async () => {
      repo.fetchAll.mockRejectedValue(new Error("fetch failed"))

      const { useExtensionStore } = await import("../extensionStore")
      await useExtensionStore.getState().fetchExtensions()

      expect(useExtensionStore.getState().error).toBe("fetch failed")
      expect(useExtensionStore.getState().loading).toBe(false)
    })

    it("abnormal: should use fallback message for non-Error throw", async () => {
      repo.fetchAll.mockRejectedValue(42)

      const { useExtensionStore } = await import("../extensionStore")
      await useExtensionStore.getState().fetchExtensions()

      expect(useExtensionStore.getState().error).toBe("Failed to load extensions")
    })
  })

  // ── setFilter / setSearchQuery / setSortBy ───────────────────────────

  describe("setFilter / setSearchQuery / setSortBy", () => {
    it("normal: should set filter", async () => {
      const store = await createStore()
      store.getState().setFilter("enabled")
      expect(store.getState().filter).toBe("enabled")
    })

    it("normal: should set searchQuery", async () => {
      const store = await createStore()
      store.getState().setSearchQuery("hello")
      expect(store.getState().searchQuery).toBe("hello")
    })

    it("normal: should set sortBy", async () => {
      const store = await createStore()
      store.getState().setSortBy("enabled")
      expect(store.getState().sortBy).toBe("enabled")
    })
  })

  // ── useFilteredExtensions (logic test via store selectors) ───────────

  describe("useFilteredExtensions logic", () => {
    // Since useFilteredExtensions is a React hook, we test the filtering/sorting logic directly
    // by reproducing it without the hook wrapper.

    function applyFilterAndSort(
      extensions: Extension[],
      filter: "all" | "enabled" | "disabled",
      searchQuery: string,
      sortBy: "name" | "enabled" | "recentlyUsed"
    ) {
      const filtered = extensions
        .filter((ext) => {
          if (filter === "enabled") return ext.enabled
          if (filter === "disabled") return !ext.enabled
          return true
        })
        .filter((ext) => {
          if (!searchQuery.trim()) return true
          const query = searchQuery.toLowerCase()
          return (
            ext.name.toLowerCase().includes(query) || ext.description.toLowerCase().includes(query)
          )
        })

      return [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name)
          case "enabled":
            return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0)
          case "recentlyUsed":
          default:
            return 0
        }
      })
    }

    const exts: Extension[] = [
      makeExtension({ id: "z", name: "Zebra", description: "animal plugin", enabled: true }),
      makeExtension({ id: "a", name: "Apple", description: "fruit plugin", enabled: false }),
      makeExtension({ id: "m", name: "Mango", description: "fruit plugin", enabled: true }),
    ]

    it("normal: should return all extensions sorted by name with filter=all", () => {
      const result = applyFilterAndSort(exts, "all", "", "name")
      expect(result.map((e) => e.name)).toEqual(["Apple", "Mango", "Zebra"])
    })

    it("normal: should filter enabled only", () => {
      const result = applyFilterAndSort(exts, "enabled", "", "name")
      expect(result.map((e) => e.name)).toEqual(["Mango", "Zebra"])
    })

    it("normal: should filter disabled only", () => {
      const result = applyFilterAndSort(exts, "disabled", "", "name")
      expect(result.map((e) => e.name)).toEqual(["Apple"])
    })

    it("normal: should search by name", () => {
      const result = applyFilterAndSort(exts, "all", "mango", "name")
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Mango")
    })

    it("normal: should search by description", () => {
      const result = applyFilterAndSort(exts, "all", "fruit", "name")
      expect(result.map((e) => e.name)).toEqual(["Apple", "Mango"])
    })

    it("normal: should sort by enabled status (enabled first)", () => {
      const result = applyFilterAndSort(exts, "all", "", "enabled")
      expect(result[0].enabled).toBe(true)
      expect(result[result.length - 1].enabled).toBe(false)
    })

    it("normal: should preserve order with recentlyUsed sort", () => {
      const result = applyFilterAndSort(exts, "all", "", "recentlyUsed")
      expect(result.map((e) => e.id)).toEqual(["z", "a", "m"])
    })

    it("edge: should handle empty search query with whitespace", () => {
      const result = applyFilterAndSort(exts, "all", "   ", "name")
      expect(result).toHaveLength(3)
    })

    it("edge: should handle case-insensitive search", () => {
      const result = applyFilterAndSort(exts, "all", "ZEBRA", "name")
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Zebra")
    })

    it("edge: should return empty when no matches", () => {
      const result = applyFilterAndSort(exts, "all", "nonexistent", "name")
      expect(result).toHaveLength(0)
    })

    it("edge: should combine filter and search", () => {
      const result = applyFilterAndSort(exts, "enabled", "fruit", "name")
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Mango")
    })
  })
})
