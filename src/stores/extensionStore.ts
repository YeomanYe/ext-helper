import { create } from "zustand"
import type { ExtensionStore, FilterType, SortType } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"
import { MOCK_EXTENSIONS } from "@/services/mockData"

const cloneExtensions = (extensions: typeof MOCK_EXTENSIONS) =>
  extensions.map((extension) => ({
    ...extension,
    permissions: [...extension.permissions]
  }))

const withHistoryCleared = (extensions: typeof MOCK_EXTENSIONS) => ({
  extensions,
  canUndo: false,
  canRedo: false,
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
      canRedo: false
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
        canRedo: ((get() as any).future || []).length > 0
      })
    }
  },

  removeExtension: async (id: string) => {
    const { extensions } = get()
    const exists = extensions.some((extension) => extension.id === id)
    if (!exists) return

    const previousExtensions = cloneExtensions(extensions)
    const nextExtensions = extensions.filter((extension) => extension.id !== id)

    set({
      extensions: nextExtensions,
      canUndo: true,
      canRedo: false
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
        canRedo: ((get() as any).future || []).length > 0
      })
    }
  },

  setExtensionsEnabled: async (ids: string[], enabled: boolean) => {
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
      canRedo: false
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
        canRedo: ((get() as any).future || []).length > 0
      })
    }
  },

  undoExtensions: async () => {
    const state = get() as any
    const history = state.history || []
    if (history.length === 0) return

    const previousExtensions = history[history.length - 1]
    const currentExtensions = cloneExtensions(state.extensions)

    set({
      extensions: previousExtensions,
      canUndo: history.length > 1,
      canRedo: true
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
        canRedo: true
      } as any)
    } catch (error) {
      set({ extensions: state.extensions })
      set({
        error: error instanceof Error ? error.message : "Failed to undo extension changes"
      })
    }
  },

  redoExtensions: async () => {
    const state = get() as any
    const future = state.future || []
    if (future.length === 0) return

    const nextExtensions = future[future.length - 1]
    const currentExtensions = cloneExtensions(state.extensions)

    set({
      extensions: nextExtensions,
      canUndo: true,
      canRedo: future.length > 1
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
        canRedo: future.length > 1
      } as any)
    } catch (error) {
      set({ extensions: state.extensions })
      set({
        error: error instanceof Error ? error.message : "Failed to redo extension changes"
      })
    }
  },

  bisectExtensions: async (ids: string[]) => {
    const orderedIds = ids.filter(Boolean)
    if (orderedIds.length < 2) return

    const midpoint = Math.ceil(orderedIds.length / 2)
    const leftIds = new Set(orderedIds.slice(0, midpoint))
    const rightIds = new Set(orderedIds.slice(midpoint))
    const { extensions } = get()

    const nextExtensions = extensions.map((extension) => {
      if (leftIds.has(extension.id)) return { ...extension, enabled: true }
      if (rightIds.has(extension.id)) return { ...extension, enabled: false }
      return extension
    })

    if (nextExtensions.every((extension, index) => extension.enabled === extensions[index].enabled)) {
      return
    }

    const previousExtensions = cloneExtensions(extensions)

    set({
      extensions: nextExtensions,
      canUndo: true,
      canRedo: false
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
        error: error instanceof Error ? error.message : "Failed to bisect extensions",
        canUndo: ((get() as any).history || []).length > 0,
        canRedo: ((get() as any).future || []).length > 0
      })
    }
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
