import * as React from "react"
import { create } from "zustand"
import type { BisectSession, ExtensionStore, FilterType, SortType } from "@/types"
import { extensionsRepo } from "@/services/extensionsRepo"
import {
  createIdleBisectSession,
  splitCandidateIds,
  buildBisectExtensions,
  isBisectSessionConsistent,
} from "@/stores/bisectUtils"
import type { ExtensionSnapshot } from "@/stores/bisectUtils"
import { useGroupStore } from "@/stores/groupStore"
import {
  cloneExtensions,
  buildHistoryMeta,
  withHistoryCleared,
  setPendingHistoryMeta,
} from "@/stores/extensionStoreUtils"

interface ExtensionStoreState extends ExtensionStore {
  history: ExtensionSnapshot[]
  future: ExtensionSnapshot[]
}

const initialState = {
  extensions: [],
  loading: false,
  error: null,
  filter: "all" as FilterType,
  searchQuery: "",
  sortBy: "name" as SortType,
  ...buildHistoryMeta([], []),
  bisectSession: createIdleBisectSession(),
}

export const useExtensionStore = create<ExtensionStoreState>((set, get) => ({
  ...initialState,

  fetchExtensions: async () => {
    set({ loading: true, error: null })

    try {
      const extensions = await extensionsRepo.fetchAll()
      const persistedBisectSession = await extensionsRepo.loadBisectSession()
      const bisectSession =
        persistedBisectSession && isBisectSessionConsistent(persistedBisectSession, extensions)
          ? persistedBisectSession
          : createIdleBisectSession()

      if (persistedBisectSession && !bisectSession.active) {
        await extensionsRepo.clearBisectSession()
      }

      set({
        ...withHistoryCleared(extensions),
        bisectSession,
        loading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load extensions",
        loading: false,
      })
    }
  },

  toggleExtension: async (id: string) => {
    const state = get()
    if (state.bisectSession.active) return

    const currentExtension = state.extensions.find((extension) => extension.id === id)
    if (!currentExtension) return

    const previousExtensions = cloneExtensions(state.extensions)
    const nextExtensions = state.extensions.map((extension) =>
      extension.id === id ? { ...extension, enabled: !extension.enabled } : extension
    )

    set({
      extensions: nextExtensions,
      error: null,
      ...setPendingHistoryMeta(state.history),
    })

    try {
      await extensionsRepo.setEnabled(id, !currentExtension.enabled)
      set((currentState) => ({
        ...buildHistoryMeta([...currentState.history, previousExtensions], []),
        extensions: currentState.extensions,
      }))
    } catch (error) {
      set({
        extensions: previousExtensions,
        error: error instanceof Error ? error.message : "Failed to toggle extension",
        ...buildHistoryMeta(state.history, state.future),
      })
    }
  },

  removeExtension: async (id: string) => {
    const state = get()
    if (state.bisectSession.active) return
    if (!state.extensions.some((extension) => extension.id === id)) return

    const previousExtensions = cloneExtensions(state.extensions)
    const nextExtensions = state.extensions.filter((extension) => extension.id !== id)

    set({
      extensions: nextExtensions,
      error: null,
      ...setPendingHistoryMeta(state.history),
    })

    try {
      await extensionsRepo.remove(id)
      set((currentState) => ({
        ...buildHistoryMeta([...currentState.history, previousExtensions], []),
        extensions: currentState.extensions,
      }))
    } catch (error) {
      set({
        extensions: previousExtensions,
        error: error instanceof Error ? error.message : "Failed to remove extension",
        ...buildHistoryMeta(state.history, state.future),
      })
    }
  },

  setExtensionsEnabled: async (ids: string[], enabled: boolean) => {
    const state = get()
    if (state.bisectSession.active) return

    const targetIds = new Set(ids)
    if (targetIds.size === 0) return

    const hasChanges = state.extensions.some(
      (extension) => targetIds.has(extension.id) && extension.enabled !== enabled
    )
    if (!hasChanges) return

    const previousExtensions = cloneExtensions(state.extensions)
    const nextExtensions = state.extensions.map((extension) =>
      targetIds.has(extension.id) ? { ...extension, enabled } : extension
    )

    set({
      extensions: nextExtensions,
      error: null,
      ...setPendingHistoryMeta(state.history),
    })

    try {
      await extensionsRepo.applySnapshot(previousExtensions, nextExtensions)
      set((currentState) => ({
        ...buildHistoryMeta([...currentState.history, previousExtensions], []),
        extensions: currentState.extensions,
      }))
    } catch (error) {
      set({
        extensions: previousExtensions,
        error: error instanceof Error ? error.message : "Failed to update extensions",
        ...buildHistoryMeta(state.history, state.future),
      })
    }
  },

  undoExtensions: async () => {
    const state = get()
    if (state.bisectSession.active || state.history.length === 0) return

    const previousExtensions = state.history[state.history.length - 1]
    const currentExtensions = cloneExtensions(state.extensions)
    const nextHistory = state.history.slice(0, -1)
    const nextFuture = [...state.future, currentExtensions]

    set({
      extensions: previousExtensions,
      error: null,
      ...buildHistoryMeta(nextHistory, nextFuture),
    })

    try {
      await extensionsRepo.applySnapshot(currentExtensions, previousExtensions)
    } catch (error) {
      set({
        extensions: currentExtensions,
        error: error instanceof Error ? error.message : "Failed to undo extension changes",
        ...buildHistoryMeta(state.history, state.future),
      })
    }
  },

  redoExtensions: async () => {
    const state = get()
    if (state.bisectSession.active || state.future.length === 0) return

    const nextExtensions = state.future[state.future.length - 1]
    const currentExtensions = cloneExtensions(state.extensions)
    const nextHistory = [...state.history, currentExtensions]
    const nextFuture = state.future.slice(0, -1)

    set({
      extensions: nextExtensions,
      error: null,
      ...buildHistoryMeta(nextHistory, nextFuture),
    })

    try {
      await extensionsRepo.applySnapshot(currentExtensions, nextExtensions)
    } catch (error) {
      set({
        extensions: currentExtensions,
        error: error instanceof Error ? error.message : "Failed to redo extension changes",
        ...buildHistoryMeta(state.history, state.future),
      })
    }
  },

  startBisect: async () => {
    const state = get()
    if (state.bisectSession.active) return

    const baselineExtensions = cloneExtensions(state.extensions)
    const candidateIds = baselineExtensions
      .filter((extension) => extension.enabled)
      .map((extension) => extension.id)

    if (candidateIds.length < 2) {
      set({ error: "Need at least two enabled extensions to start bisect" })
      return
    }

    const { currentTestIds, parkedIds } = splitCandidateIds(candidateIds)
    const bisectSession: BisectSession = {
      active: true,
      phase: "running",
      baselineExtensions,
      allCandidateIds: candidateIds,
      candidateIds,
      currentTestIds,
      parkedIds,
      step: 1,
    }
    const nextExtensions = buildBisectExtensions(
      baselineExtensions,
      bisectSession.allCandidateIds,
      bisectSession.currentTestIds
    )

    set({
      extensions: nextExtensions,
      bisectSession,
      error: null,
    })

    try {
      await extensionsRepo.applySnapshot(state.extensions, nextExtensions)
      await extensionsRepo.saveBisectSession(bisectSession)
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: state.bisectSession,
        error: error instanceof Error ? error.message : "Failed to start bisect",
      })
      await extensionsRepo.clearBisectSession()
    }
  },

  markBisectGood: async () => {
    const state = get()
    const session = state.bisectSession
    if (!session.active || session.phase !== "running") return

    const candidateIds = session.parkedIds
    if (candidateIds.length === 0) {
      set({ error: "Bisect could not determine a remaining candidate" })
      return
    }

    const { currentTestIds, parkedIds } = splitCandidateIds(candidateIds)
    const nextSession: BisectSession = {
      ...session,
      phase: candidateIds.length === 1 ? "resolved" : "running",
      candidateIds,
      currentTestIds,
      parkedIds,
      step: session.step + 1,
      resultId: candidateIds.length === 1 ? candidateIds[0] : undefined,
      resultIds: candidateIds.length > 1 ? candidateIds : undefined,
    }
    const nextExtensions = buildBisectExtensions(
      session.baselineExtensions,
      session.allCandidateIds,
      nextSession.currentTestIds
    )

    set({
      extensions: nextExtensions,
      bisectSession: nextSession,
      error: null,
    })

    try {
      await extensionsRepo.applySnapshot(state.extensions, nextExtensions)
      await extensionsRepo.saveBisectSession(nextSession)
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: session,
        error: error instanceof Error ? error.message : "Failed to apply bisect result",
      })
    }
  },

  markBisectBad: async () => {
    const state = get()
    const session = state.bisectSession
    if (!session.active || session.phase !== "running") return

    const candidateIds = session.currentTestIds
    if (candidateIds.length === 0) {
      set({ error: "Bisect could not determine a remaining candidate" })
      return
    }

    const { currentTestIds, parkedIds } = splitCandidateIds(candidateIds)
    const nextSession: BisectSession = {
      ...session,
      phase: candidateIds.length === 1 ? "resolved" : "running",
      candidateIds,
      currentTestIds,
      parkedIds,
      step: session.step + 1,
      resultId: candidateIds.length === 1 ? candidateIds[0] : undefined,
      resultIds: candidateIds.length > 1 ? candidateIds : undefined,
    }
    const nextExtensions = buildBisectExtensions(
      session.baselineExtensions,
      session.allCandidateIds,
      nextSession.currentTestIds
    )

    set({
      extensions: nextExtensions,
      bisectSession: nextSession,
      error: null,
    })

    try {
      await extensionsRepo.applySnapshot(state.extensions, nextExtensions)
      await extensionsRepo.saveBisectSession(nextSession)
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: session,
        error: error instanceof Error ? error.message : "Failed to apply bisect result",
      })
    }
  },

  cancelBisect: async () => {
    const state = get()
    const session = state.bisectSession
    if (!session.active) return

    const restoredExtensions = cloneExtensions(session.baselineExtensions)
    set({ extensions: restoredExtensions, bisectSession: createIdleBisectSession(), error: null })

    try {
      await extensionsRepo.applySnapshot(state.extensions, restoredExtensions)
      await extensionsRepo.clearBisectSession()
    } catch (error) {
      set({
        extensions: state.extensions,
        bisectSession: session,
        error: error instanceof Error ? error.message : "Failed to cancel bisect",
      })
    }
  },

  finishBisectRestore: async () => {
    await get().cancelBisect()
  },

  setFilter: (filter: FilterType) => set({ filter }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSortBy: (sortBy: SortType) => set({ sortBy }),
}))

export const useFilteredExtensions = () => {
  const extensions = useExtensionStore((s) => s.extensions)
  const filter = useExtensionStore((s) => s.filter)
  const searchQuery = useExtensionStore((s) => s.searchQuery)
  const sortBy = useExtensionStore((s) => s.sortBy)
  const groups = useGroupStore((s) => s.groups)

  return React.useMemo(() => {
    const groupedIds =
      filter === "in-group" || filter === "not-in-group"
        ? new Set(groups.flatMap((g) => g.extensionIds))
        : null

    const filtered = extensions
      .filter((extension) => {
        if (filter === "enabled") return extension.enabled
        if (filter === "disabled") return !extension.enabled
        if (filter === "in-group") return groupedIds!.has(extension.id)
        if (filter === "not-in-group") return !groupedIds!.has(extension.id)
        return true
      })
      .filter((extension) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
          extension.name.toLowerCase().includes(query) ||
          extension.description.toLowerCase().includes(query)
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
  }, [extensions, filter, searchQuery, sortBy, groups])
}
