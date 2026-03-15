import { create } from "zustand"
import type { ExtensionStore, FilterType, SortType } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"

export const useExtensionStore = create<ExtensionStore>((set, get) => ({
  extensions: [],
  loading: false,
  error: null,
  filter: "all",
  searchQuery: "",
  sortBy: "name",

  fetchExtensions: async () => {
    set({ loading: true, error: null })
    try {
      const extensions = await browserAdapter.getExtensions()
      set({ extensions, loading: false })
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

    // Optimistic update
    const newEnabled = !ext.enabled
    set({
      extensions: extensions.map((e) =>
        e.id === id ? { ...e, enabled: newEnabled } : e
      )
    })

    try {
      await browserAdapter.setExtensionEnabled(id, newEnabled)
    } catch (error) {
      // Rollback on error
      set({
        extensions: extensions.map((e) =>
          e.id === id ? { ...e, enabled: ext.enabled } : e
        ),
        error: error instanceof Error ? error.message : "Failed to toggle extension"
      })
    }
  },

  setFilter: (filter: FilterType) => set({ filter }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSortBy: (sortBy: SortType) => set({ sortBy })
}))

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
