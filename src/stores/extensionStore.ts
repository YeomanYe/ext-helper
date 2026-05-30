import * as React from "react"
import { create } from "zustand"
import type { BisectSession, Extension, ExtensionStore, FilterType, SortType } from "@/types"
import { extensionsRepo } from "@/services/extensionsRepo"
import { createUsageLogEvent, usageLogRepo } from "@/services/usageLogRepo"
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
import { runOptimisticMutation } from "@/stores/optimistic"

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

const recordEnabledChanges = async (
  previousExtensions: Extension[],
  nextExtensions: Extension[]
): Promise<void> => {
  const previousById = new Map(previousExtensions.map((extension) => [extension.id, extension]))
  const events = nextExtensions.flatMap((extension) => {
    const previous = previousById.get(extension.id)
    if (!previous || previous.enabled === extension.enabled) return []
    return [createUsageLogEvent(extension, extension.enabled ? "enabled" : "disabled", "popup")]
  })

  if (events.length > 0) {
    await usageLogRepo.appendMany(events)
  }
}

// ─── Snapshot shape used by extension-mutation helpers ──────────────────────
interface ExtensionMutationSnapshot {
  extensions: Extension[]
  history: ExtensionSnapshot[]
  future: ExtensionSnapshot[]
}

const snapshotExtensions = (state: ExtensionStoreState): ExtensionMutationSnapshot => ({
  extensions: cloneExtensions(state.extensions),
  history: state.history,
  future: state.future,
})

const errorPatch = (fallback: string) => (error: unknown) => ({
  error: error instanceof Error ? error.message : fallback,
})

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

    await runOptimisticMutation<ExtensionStoreState, ExtensionMutationSnapshot>(set, get, {
      snapshot: snapshotExtensions,
      apply: (s) => ({
        extensions: s.extensions.map((extension) =>
          extension.id === id ? { ...extension, enabled: !extension.enabled } : extension
        ),
        error: null,
        ...setPendingHistoryMeta(s.history),
      }),
      persist: async (snap, next) => {
        await extensionsRepo.setEnabled(id, !currentExtension.enabled)
        await recordEnabledChanges(snap.extensions, next.extensions)
      },
      commit: (snap, s) => buildHistoryMeta([...s.history, snap.extensions], []),
      rollback: (snap) => ({
        extensions: snap.extensions,
        ...buildHistoryMeta(snap.history, snap.future),
      }),
      onError: errorPatch("Failed to toggle extension"),
    })
  },

  removeExtension: async (id: string) => {
    const state = get()
    if (state.bisectSession.active) return
    if (!state.extensions.some((extension) => extension.id === id)) return

    await runOptimisticMutation<ExtensionStoreState, ExtensionMutationSnapshot>(set, get, {
      snapshot: snapshotExtensions,
      apply: (s) => ({
        extensions: s.extensions.filter((extension) => extension.id !== id),
        error: null,
        ...setPendingHistoryMeta(s.history),
      }),
      persist: () => extensionsRepo.remove(id),
      commit: (snap, s) => buildHistoryMeta([...s.history, snap.extensions], []),
      rollback: (snap) => ({
        extensions: snap.extensions,
        ...buildHistoryMeta(snap.history, snap.future),
      }),
      onError: errorPatch("Failed to remove extension"),
    })
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

    await runOptimisticMutation<ExtensionStoreState, ExtensionMutationSnapshot>(set, get, {
      snapshot: snapshotExtensions,
      apply: (s) => ({
        extensions: s.extensions.map((extension) =>
          targetIds.has(extension.id) ? { ...extension, enabled } : extension
        ),
        error: null,
        ...setPendingHistoryMeta(s.history),
      }),
      persist: async (snap, next) => {
        await extensionsRepo.applySnapshot(snap.extensions, next.extensions)
        await recordEnabledChanges(snap.extensions, next.extensions)
      },
      commit: (snap, s) => buildHistoryMeta([...s.history, snap.extensions], []),
      rollback: (snap) => ({
        extensions: snap.extensions,
        ...buildHistoryMeta(snap.history, snap.future),
      }),
      onError: errorPatch("Failed to update extensions"),
    })
  },

  undoExtensions: async () => {
    const state = get()
    if (state.bisectSession.active || state.history.length === 0) return

    const previousExtensions = state.history[state.history.length - 1]
    const nextHistory = state.history.slice(0, -1)

    await runOptimisticMutation<ExtensionStoreState, ExtensionMutationSnapshot>(set, get, {
      snapshot: snapshotExtensions,
      apply: (s) => ({
        extensions: previousExtensions,
        error: null,
        ...buildHistoryMeta(nextHistory, [...s.future, cloneExtensions(s.extensions)]),
      }),
      persist: async (snap) => {
        await extensionsRepo.applySnapshot(snap.extensions, previousExtensions)
        await recordEnabledChanges(snap.extensions, previousExtensions)
      },
      rollback: (snap) => ({
        extensions: snap.extensions,
        ...buildHistoryMeta(snap.history, snap.future),
      }),
      onError: errorPatch("Failed to undo extension changes"),
    })
  },

  redoExtensions: async () => {
    const state = get()
    if (state.bisectSession.active || state.future.length === 0) return

    const nextExtensions = state.future[state.future.length - 1]
    const nextFuture = state.future.slice(0, -1)

    await runOptimisticMutation<ExtensionStoreState, ExtensionMutationSnapshot>(set, get, {
      snapshot: snapshotExtensions,
      apply: (s) => ({
        extensions: nextExtensions,
        error: null,
        ...buildHistoryMeta([...s.history, cloneExtensions(s.extensions)], nextFuture),
      }),
      persist: async (snap) => {
        await extensionsRepo.applySnapshot(snap.extensions, nextExtensions)
        await recordEnabledChanges(snap.extensions, nextExtensions)
      },
      rollback: (snap) => ({
        extensions: snap.extensions,
        ...buildHistoryMeta(snap.history, snap.future),
      }),
      onError: errorPatch("Failed to redo extension changes"),
    })
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

    interface BisectStartSnapshot {
      extensions: Extension[]
      bisectSession: BisectSession
    }

    await runOptimisticMutation<ExtensionStoreState, BisectStartSnapshot>(set, get, {
      snapshot: (s) => ({ extensions: s.extensions, bisectSession: s.bisectSession }),
      apply: () => ({ extensions: nextExtensions, bisectSession, error: null }),
      persist: async (snap) => {
        await extensionsRepo.applySnapshot(snap.extensions, nextExtensions)
        await extensionsRepo.saveBisectSession(bisectSession)
      },
      rollback: (snap) => ({
        extensions: snap.extensions,
        bisectSession: snap.bisectSession,
      }),
      onError: (error) => {
        // Best-effort clear of any partial persisted session
        void extensionsRepo.clearBisectSession()
        return { error: error instanceof Error ? error.message : "Failed to start bisect" }
      },
    })
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

    await applyBisectStep(set, get, session, candidateIds, "Failed to apply bisect result")
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

    await applyBisectStep(set, get, session, candidateIds, "Failed to apply bisect result")
  },

  cancelBisect: async () => {
    await restoreBisectBaseline(set, get, "Failed to cancel bisect")
  },

  finishBisectRestore: async () => {
    await restoreBisectBaseline(set, get, "Failed to restore bisect baseline")
  },

  setFilter: (filter: FilterType) => set({ filter }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSortBy: (sortBy: SortType) => set({ sortBy }),
}))

// ─── Bisect step helper (shared by markGood / markBad) ──────────────────────
interface BisectStepSnapshot {
  extensions: Extension[]
  bisectSession: BisectSession
}

async function applyBisectStep(
  set: (patch: Partial<ExtensionStoreState>) => void,
  get: () => ExtensionStoreState,
  session: BisectSession,
  candidateIds: string[],
  errorFallback: string
): Promise<void> {
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

  await runOptimisticMutation<ExtensionStoreState, BisectStepSnapshot>(
    set as never,
    get as never,
    {
      snapshot: (s) => ({ extensions: s.extensions, bisectSession: s.bisectSession }),
      apply: () => ({
        extensions: nextExtensions,
        bisectSession: nextSession,
        error: null,
      }),
      persist: async (snap) => {
        await extensionsRepo.applySnapshot(snap.extensions, nextExtensions)
        await extensionsRepo.saveBisectSession(nextSession)
      },
      rollback: (snap) => ({
        extensions: snap.extensions,
        bisectSession: snap.bisectSession,
      }),
      onError: errorPatch(errorFallback),
    }
  )
}

async function restoreBisectBaseline(
  set: (patch: Partial<ExtensionStoreState>) => void,
  get: () => ExtensionStoreState,
  errorFallback: string
): Promise<void> {
  const state = get()
  const session = state.bisectSession
  if (!session.active) return

  const restoredExtensions = cloneExtensions(session.baselineExtensions)

  await runOptimisticMutation<ExtensionStoreState, BisectStepSnapshot>(
    set as never,
    get as never,
    {
      snapshot: (s) => ({ extensions: s.extensions, bisectSession: s.bisectSession }),
      apply: () => ({
        extensions: restoredExtensions,
        bisectSession: createIdleBisectSession(),
        error: null,
      }),
      persist: async (snap) => {
        await extensionsRepo.applySnapshot(snap.extensions, restoredExtensions)
        await extensionsRepo.clearBisectSession()
      },
      rollback: (snap) => ({
        extensions: snap.extensions,
        bisectSession: snap.bisectSession,
      }),
      onError: errorPatch(errorFallback),
    }
  )
}

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
