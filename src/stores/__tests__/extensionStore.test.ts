import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BisectSession, Extension } from "@/types"

const repo = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  setEnabled: vi.fn(),
  applySnapshot: vi.fn(),
  remove: vi.fn(),
  loadBisectSession: vi.fn(),
  saveBisectSession: vi.fn(),
  clearBisectSession: vi.fn()
}))

vi.mock("@/services/extensionsRepo", () => ({
  extensionsRepo: repo
}))

const sampleExtensions: Extension[] = [
  {
    id: "a",
    name: "Alpha",
    description: "",
    version: "1.0.0",
    enabled: true,
    iconUrl: null,
    permissions: [],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "b",
    name: "Beta",
    description: "",
    version: "1.0.0",
    enabled: true,
    iconUrl: null,
    permissions: [],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  }
]

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
      step: 1
    }

    repo.fetchAll.mockResolvedValue([
      { ...sampleExtensions[0], enabled: true },
      { ...sampleExtensions[1], enabled: false }
    ])
    repo.loadBisectSession.mockResolvedValue(persistedSession)

    const { useExtensionStore } = await import("../extensionStore")
    await useExtensionStore.getState().fetchExtensions()

    expect(useExtensionStore.getState().bisectSession.active).toBe(true)
    expect(useExtensionStore.getState().bisectSession.currentTestIds).toEqual(["a"])
  })
})
