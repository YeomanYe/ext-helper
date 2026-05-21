import { create } from "zustand"
import type { UsageLogStore } from "@/types"
import { createEmptyUsageLogStats, usageLogRepo } from "@/services/usageLogRepo"

export const useUsageLogStore = create<UsageLogStore>((set) => ({
  events: [],
  stats: createEmptyUsageLogStats(),
  loading: false,
  error: null,

  fetchUsageLog: async () => {
    set({ loading: true, error: null })

    try {
      const [events, stats] = await Promise.all([usageLogRepo.fetchAll(), usageLogRepo.getStats()])
      set({ events, stats, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load usage log",
      })
    }
  },

  clearUsageLog: async () => {
    set({ loading: true, error: null })

    try {
      await usageLogRepo.clear()
      const [events, stats] = await Promise.all([usageLogRepo.fetchAll(), usageLogRepo.getStats()])
      set({ events, stats, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to clear usage log",
      })
    }
  },
}))
