import { create } from "zustand"
import type { Group, GroupStore } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"
import { MOCK_GROUPS } from "@/services/mockData"

const STORAGE_KEY = "ext-helper-groups"

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  activeGroupId: null,
  expandedGroups: new Set<string>(),
  draggedExtensionId: null,

  fetchGroups: async () => {
    try {
      let groups
      if (isDevMode()) {
        const stored = devStorage.getGroups()
        if (stored.length === 0) {
          devStorage.setGroups(MOCK_GROUPS)
        }
        groups = devStorage.getGroups()
      } else {
        groups = (await browserAdapter.getStorage(STORAGE_KEY)) || []
      }
      set({ groups })
    } catch (error) {
      console.error("Failed to fetch groups:", error)
      set({ groups: [] })
    }
  },

  createGroup: async (name: string, color: string = "#6366F1") => {
    const { groups } = get()
    const newGroup: Group = {
      id: devStorage.generateId(),
      name,
      color,
      icon: "folder",
      extensionIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true,
      order: groups.length
    }

    const newGroups = [...groups, newGroup]
    set({ groups: newGroups })

    try {
      if (isDevMode()) {
        devStorage.setGroups(newGroups)
      } else {
        await browserAdapter.setStorage(STORAGE_KEY, newGroups)
      }
    } catch (error) {
      console.error("Failed to save group:", error)
      set({ groups })
    }
  },

  deleteGroup: async (id: string) => {
    const { groups, activeGroupId } = get()
    const newGroups = groups.filter((g) => g.id !== id)
    set({
      groups: newGroups,
      activeGroupId: activeGroupId === id ? null : activeGroupId
    })

    try {
      if (isDevMode()) {
        devStorage.setGroups(newGroups)
      } else {
        await browserAdapter.setStorage(STORAGE_KEY, newGroups)
      }
    } catch (error) {
      console.error("Failed to delete group:", error)
      set({ groups })
    }
  },

  renameGroup: async (id: string, name: string) => {
    const { groups } = get()
    const newGroups = groups.map((g) =>
      g.id === id ? { ...g, name, updatedAt: Date.now() } : g
    )
    set({ groups: newGroups })

    try {
      if (isDevMode()) {
        devStorage.setGroups(newGroups)
      } else {
        await browserAdapter.setStorage(STORAGE_KEY, newGroups)
      }
    } catch (error) {
      console.error("Failed to rename group:", error)
      set({ groups })
    }
  },

  updateGroup: async (id: string, updates: Partial<Pick<Group, "name" | "color" | "icon" | "iconUrl">>) => {
    const { groups } = get()
    const newGroups = groups.map((g) =>
      g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g
    )
    set({ groups: newGroups })

    try {
      if (isDevMode()) {
        devStorage.setGroups(newGroups)
      } else {
        await browserAdapter.setStorage(STORAGE_KEY, newGroups)
      }
    } catch (error) {
      console.error("Failed to update group:", error)
      set({ groups })
    }
  },

  selectGroup: (id: string | null) => set({ activeGroupId: id }),

  toggleGroupExpanded: (id: string) => {
    const { expandedGroups } = get()
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    set({ expandedGroups: newExpanded })
  },

  addToGroup: async (groupId: string, extId: string) => {
    const { groups } = get()
    const newGroups = groups.map((g) => {
      if (g.id === groupId) {
        if (g.extensionIds.includes(extId)) return g
        return {
          ...g,
          extensionIds: [...g.extensionIds, extId],
          updatedAt: Date.now()
        }
      }
      return {
        ...g,
        extensionIds: g.extensionIds.filter((id) => id !== extId),
        updatedAt: Date.now()
      }
    })
    set({ groups: newGroups })

    try {
      if (isDevMode()) {
        devStorage.setGroups(newGroups)
      } else {
        await browserAdapter.setStorage(STORAGE_KEY, newGroups)
      }
    } catch (error) {
      console.error("Failed to add extension to group:", error)
      set({ groups })
    }
  },

  removeFromGroup: async (groupId: string, extId: string) => {
    const { groups } = get()
    const newGroups = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            extensionIds: g.extensionIds.filter((id) => id !== extId),
            updatedAt: Date.now()
          }
        : g
    )
    set({ groups: newGroups })

    try {
      if (isDevMode()) {
        devStorage.setGroups(newGroups)
      } else {
        await browserAdapter.setStorage(STORAGE_KEY, newGroups)
      }
    } catch (error) {
      console.error("Failed to remove extension from group:", error)
      set({ groups })
    }
  },

  setDraggedExtension: (id: string | null) => set({ draggedExtensionId: id })
}))
