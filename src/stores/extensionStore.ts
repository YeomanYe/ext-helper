import { create } from "zustand"
import type { BisectSession, ExtensionStore, FilterType, SortType } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"
import { MOCK_EXTENSIONS } from "@/services/mockData"

const cloneExtensions = (extensions: typeof MOCK_EXTENSIONS) =>
  extensions.map((extension) => ({
    ...extension,
    permissions: [...extension.permissions]
  }))

const createIdleBisectSession = (): BisectSession => ({
  active: false,
  phase: "idle",
  baselineExtensions: [],
  allCandidateIds: [],
  candidateIds: [],
  currentTestIds: [],
  parkedIds: [],
  step: 0
})

const splitCandidateIds = (candidateIds: string[]) => {
  const midpoint = Math.ceil(candidateIds.length / 2)
  return {
    currentTestIds: candidateIds.slice(0, midpoint),
    parkedIds: candidateIds.slice(midpoint)
  }
}

const buildBisectExtensions = (
  baselineExtensions: typeof MOCK_EXTENSIONS,
  allCandidateIds: string[],
  currentTestIds: string[]
) => {
  const allCandidates = new Set(allCandidateIds)
  const currentTests = new Set(currentTestIds)

  return baselineExtensions.map((extension) => {
    if (!allCandidates.has(extension.id)) {
      return { ...extension, permissions: [...extension.permissions] }
    }

    return {
      ...extension,
      permissions: [...extension.permissions],
      enabled: currentTests.has(extension.id)
    }
  })
}

const applyExtensionsState = async (
  previousExtensions: typeof MOCK_EXTENSIONS,
  nextExtensions: typeof MOCK_EXTENSIONS
) => {
  if (isDevMode()) {
    devStorage.setExtensions(nextExtensions)
    return
  }

  const previousById = new Map(previousExtensions.map((extension) => [extension.id, extension.enabled]))
  await Promise.all(
    nextExtensions
      .filter((extension) => previousById.get(extension.id) !== extension.enabled)
      .map((extension) => browserAdapter.setExtensionEnabled(extension.id, extension.enabled))
  )
}

const withHistoryCleared = (extensions: typeof MOCK_EXTENSIONS) => ({
  extensions,
  canUndo: false,
  canRedo: false,
  undoCount: 0,
  redoCount: 0,
  bisectSession: createIdleBisectSession(),
  history: [],
  future: []
})

export const useExtensionStore = create<ExtensionStore>((set, get) => ({
  extensions: [],
  loading: false,
  error: null,
  filter: "all",
  searchQuery: "",
  sortBy: "name",
  canUndo: false,
  canRedo: false,
  undoCount: 0,
  redoCount: 0,
  bisectSession: createIdleBisectSession(),

  fetchExtensions: async () => {
    set({ loading: true, error: null })
    try {
      let extensions
      if (isDevMode()) {
        // Initialize dev storage with mock data if empty
        const stored = devStorage.getExtensions()
        if (stored.length === 0) {
          devStorage.setExtensions(MOCK_EXTENSIONS)
        }
        extensions = devStorage.getExtensions()
      } else {
        extensions = await browserAdapter.getExtensions()
      }
      set({ ...withHistoryCleared(extensions), loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load extensions",
        loading: false
      })
    }
  },

  toggleExtension: async (id: string) => {
    if (get().bisectSession.active) return

    const { extensions } = get()
    const ext = extensions.find((e) => e.id === id)
    if (!ext) return

    const newEnabled = !ext.enabled
    const newExtensions = extensions.map((e) =>
      e.id === id ? { ...e, enabled: newEnabled } : e
    )
    const previousExtensions = cloneExtensions(extensions)
    set({
      extensions: newExtensions,
      canUndo: true,
      canRedo: false,
      undoCount: ((get() as any).history || []).length + 1,
      redoCount: 0
    })

    try {
      if (isDevMode()) {
        devStorage.updateExtension(id, { enabled: newEnabled })
      } else {
        await browserAdapter.setExtensionEnabled(id, newEnabled)
      }
      set((state: any) => ({
        history: [...(state.history || []), previousExtensions],
        future: []
      }))
    } catch (error) {
      set({ extensions })
      set({
        error: error instanceof Error ? error.message : "Failed to toggle extension",
        canUndo: ((get() as any).history || []).length > 0,
        canRedo: ((get() as any).future || []).length > 0,
        undoCount: ((get() as any).history || []).length,
        redoCount: ((get() as any).future || []).length
      })
    }
  },

  removeExtension: async (id: string) => {
    if (get().bisectSession.active) return

    const { extensions } = get()
    const exists = extensions.some((extension) => extension.id === id)
    if (!exists) return

    const previousExtensions = cloneExtensions(extensions)
    const nextExtensions = extensions.filter((extension) => extension.id !== id)

    set({
      extensions: nextExtensions,
      canUndo: true,
      canRedo: false,
      undoCount: ((get() as any).history || []).length + 1,
      redoCount: 0
    })

    try {
      if (isDevMode()) {
        devStorage.removeExtension(id)
        set((state: any) => ({
          history: [...(state.history || []), previousExtensions],
          future: []
        }))
      } else {
        await browserAdapter.uninstallExtension(id)
      }
    } catch (error) {
      set({ extensions })
      set({
        error: error instanceof Error ? error.message : "Failed to remove extension",
        canUndo: ((get() as any).history || []).length > 0,
        canRedo: ((get() as any).future || []).length > 0,
        undoCount: ((get() as any).history || []).length,
        redoCount: ((get() as any).future || []).length
      })
    }
  },

  setExtensionsEnabled: async (ids: string[], enabled: boolean) => {
    if (get().bisectSession.active) return

    const uniqueIds = Array.from(new Set(ids))
    if (uniqueIds.length === 0) return

    const { extensions } = get()
    const targetSet = new Set(uniqueIds)
    const hasChanges = extensions.some(
      (extension) => targetSet.has(extension.id) && extension.enabled !== enabled
    )
    if (!hasChanges) return

    const previousExtensions = cloneExtensions(extensions)
    const nextExtensions = extensions.map((extension) =>
      targetSet.has(extension.id) ? { ...extension, enabled } : extension
    )

    set({
      extensions: nextExtensions,
      canUndo: true,
      canRedo: false,
      undoCount: ((get() as any).history || []).length + 1,
      redoCount: 0
    })

    try {
      if (isDevMode()) {
        devStorage.setExtensions(nextExtensions)
      } else {
        await Promise.all(
          nextExtensions
            .filter((extension, index) => extension.enabled !== extensions[index].enabled)
            .map((extension) =>
              browserAdapter.setExtensionEnabled(extension.id, extension.enabled)
            )
        )
      }

      set((state: any) => ({
        history: [...(state.history || []), previousExtensions],
        future: []
      }))
    } catch (error) {
      set({ extensions })
      set({
        error: error instanceof Error ? error.message : "Failed to update extensions",
        canUndo: ((get() as any).history || []).length > 0,
        canRedo: ((get() as any).future || []).length > 0,
        undoCount: ((get() as any).history || []).length,
        redoCount: ((get() as any).future || []).length
      })
    }
  },

  undoExtensions: async () => {
    if (get().bisectSession.active) return

    const state = get() as any
    const history = state.history || []
    if (history.length === 0) return

    const previousExtensions = history[history.length - 1]
    const currentExtensions = cloneExtensions(state.extensions)

    set({
      extensions: previousExtensions,
      canUndo: history.length > 1,
      canRedo: true,
      undoCount: history.length - 1,
      redoCount: (state.future || []).length + 1
    })

    try {
      if (isDevMode()) {
        devStorage.setExtensions(previousExtensions)
      } else {
        await Promise.all(
          previousExtensions
            .filter((extension: any, index: number) => extension.enabled !== state.extensions[index]?.enabled)
            .map((extension: any) =>
              browserAdapter.setExtensionEnabled(extension.id, extension.enabled)
            )
        )
      }

      set({
        history: history.slice(0, -1),
        future: [...(state.future || []), currentExtensions],
        canUndo: history.length > 1,
        canRedo: true,
        undoCount: history.length - 1,
        redoCount: (state.future || []).length + 1
      } as any)
    } catch (error) {
      set({ extensions: state.extensions })
      set({
        error: error instanceof Error ? error.message : "Failed to undo extension changes"
      })
    }
  },

  redoExtensions: async () => {
    if (get().bisectSession.active) return

    const state = get() as any
    const future = state.future || []
    if (future.length === 0) return

    const nextExtensions = future[future.length - 1]
    const currentExtensions = cloneExtensions(state.extensions)

    set({
      extensions: nextExtensions,
      canUndo: true,
      canRedo: future.length > 1,
      undoCount: (state.history || []).length + 1,
      redoCount: future.length - 1
    })

    try {
      if (isDevMode()) {
        devStorage.setExtensions(nextExtensions)
      } else {
        await Promise.all(
          nextExtensions
            .filter((extension: any, index: number) => extension.enabled !== state.extensions[index]?.enabled)
            .map((extension: any) =>
              browserAdapter.setExtensionEnabled(extension.id, extension.enabled)
            )
        )
      }

      set({
        history: [...(state.history || []), currentExtensions],
        future: future.slice(0, -1),
        canUndo: true,
        canRedo: future.length > 1,
        undoCount: (state.history || []).length + 1,
        redoCount: future.length - 1
      } as any)
    } catch (error) {
      set({ extensions: state.extensions })
      set({
        error: error instanceof Error ? error.message : "Failed to redo extension changes"
      })
    }
  },

  startBisect: async () => {
    const state = get()
    if (state.bisectSession.active) return

    const baselineExtensions = cloneExtensions(state.extensions)
    const allCandidateIds = baselineExtensions
      .filter((extension) => extension.enabled)
      .map((extension) => extension.id)

    if (allCandidateIds.length < 2) {
      set({ error: "Need at least two enabled extensions to start bisect" })
      return
    }

    const { currentTestIds, parkedIds } = splitCandidateIds(allCandidateIds)
    const nextExtensions = buildBisectExtensions(
      baselineExtensions,
      allCandidateIds,
      currentTestIds
    )

    set({
      error: null,
      extensions: nextExtensions,
      bisectSession: {
        active: true,
        phase: "running",
        baselineExtensions,
        allCandidateIds,
        candidateIds: allCandidateIds,
        currentTestIds,
        parkedIds,
        step: 1
      }
    })

    try {
      await applyExtensionsState(baselineExtensions, nextExtensions)
    } catch (error) {
      set({
        extensions: baselineExtensions,
        bisectSession: createIdleBisectSession(),
        error: error instanceof Error ? error.message : "Failed to start bisect"
      })
    }
  },

  markBisectGood: async () => {
    const state = get()
    const session = state.bisectSession
    if (!session.active || session.phase !== "running") return

    const nextCandidateIds = session.parkedIds
    if (nextCandidateIds.length === 0) {
      set({ error: "Bisect could not determine a remaining candidate" })
      return
    }

    const { currentTestIds, parkedIds } = splitCandidateIds(nextCandidateIds)
    const nextPhase = nextCandidateIds.length === 1 ? "resolved" : "running"
    const nextExtensions = buildBisectExtensions(
      session.baselineExtensions,
      session.allCandidateIds,
      currentTestIds
    )

    set({
      error: null,
      extensions: nextExtensions,
      bisectSession: {
        ...session,
        phase: nextPhase,
        candidateIds: nextCandidateIds,
        currentTestIds,
        parkedIds,
        step: session.step + 1,
        resultId: nextCandidateIds.length === 1 ? nextCandidateIds[0] : undefined,
        resultIds: nextCandidateIds.length > 1 ? nextCandidateIds : undefined
      }
    })

    try {
      await applyExtensionsState(state.extensions, nextExtensions)
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: session,
        error: error instanceof Error ? error.message : "Failed to apply bisect result"
      })
    }
  },

  markBisectBad: async () => {
    const state = get()
    const session = state.bisectSession
    if (!session.active || session.phase !== "running") return

    const nextCandidateIds = session.currentTestIds
    if (nextCandidateIds.length === 0) {
      set({ error: "Bisect could not determine a remaining candidate" })
      return
    }

    const { currentTestIds, parkedIds } = splitCandidateIds(nextCandidateIds)
    const nextPhase = nextCandidateIds.length === 1 ? "resolved" : "running"
    const nextExtensions = buildBisectExtensions(
      session.baselineExtensions,
      session.allCandidateIds,
      currentTestIds
    )

    set({
      error: null,
      extensions: nextExtensions,
      bisectSession: {
        ...session,
        phase: nextPhase,
        candidateIds: nextCandidateIds,
        currentTestIds,
        parkedIds,
        step: session.step + 1,
        resultId: nextCandidateIds.length === 1 ? nextCandidateIds[0] : undefined,
        resultIds: nextCandidateIds.length > 1 ? nextCandidateIds : undefined
      }
    })

    try {
      await applyExtensionsState(state.extensions, nextExtensions)
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: session,
        error: error instanceof Error ? error.message : "Failed to apply bisect result"
      })
    }
  },

  cancelBisect: async () => {
    const state = get()
    const session = state.bisectSession
    if (!session.active) return

    const baselineExtensions = cloneExtensions(session.baselineExtensions)
    set({
      error: null,
      extensions: baselineExtensions,
      bisectSession: createIdleBisectSession()
    })

    try {
      await applyExtensionsState(state.extensions, baselineExtensions)
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: session,
        error: error instanceof Error ? error.message : "Failed to cancel bisect"
      })
    }
  },

  finishBisectRestore: async () => {
    const state = get()
    const session = state.bisectSession
    if (!session.active) return

    const baselineExtensions = cloneExtensions(session.baselineExtensions)
    set({
      error: null,
      extensions: baselineExtensions,
      bisectSession: createIdleBisectSession()
    })

    try {
      await applyExtensionsState(state.extensions, baselineExtensions)
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: session,
        error: error instanceof Error ? error.message : "Failed to restore bisect baseline"
      })
    }
  },

  finishBisectKeepCurrent: () => {
    const state = get()
    if (!state.bisectSession.active) return

    set({
      error: null,
      bisectSession: createIdleBisectSession()
    })
  },

  setFilter: (filter: FilterType) => set({ filter }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSortBy: (sortBy: SortType) => set({ sortBy })
}) as ExtensionStore & { history?: typeof MOCK_EXTENSIONS[]; future?: typeof MOCK_EXTENSIONS[] })

// Selector for filtered extensions
export const useFilteredExtensions = () => {
  const { extensions, filter, searchQuery, sortBy } = useExtensionStore()

  let filtered = [...extensions]

  // Filter by status
  if (filter === "enabled") {
    filtered = filtered.filter((e) => e.enabled)
  } else if (filter === "disabled") {
    filtered = filtered.filter((e) => !e.enabled)
  }

  // Filter by search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
    )
  }

  // Sort
  filtered.sort((a, b) => {
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

  return filtered
}
