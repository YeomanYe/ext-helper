import { create } from "zustand"
import type { Group, GroupStore } from "@/types"
import { groupsRepo } from "@/services/groupsRepo"
import { runOptimisticMutation } from "@/stores/optimistic"

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  activeGroupId: null,
  expandedGroups: new Set<string>(),
  draggedExtensionId: null,

  fetchGroups: async () => {
    try {
      set({ groups: await groupsRepo.fetchAll() })
    } catch (error) {
      console.error("Failed to fetch groups:", error)
      set({ groups: [] })
    }
  },

  createGroup: async (name: string, color: string = "#6366F1") => {
    const { groups } = get()
    const newGroup: Group = {
      id: groupsRepo.generateId(),
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
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        console.error("Failed to save group:", error)
        return {}
      }
    })
  },

  deleteGroup: async (id: string) => {
    const { groups, activeGroupId } = get()
    const newGroups = groups.filter((g) => g.id !== id)
    await runOptimisticMutation(set, get, {
      snapshot: (state) => ({
        groups: state.groups,
        activeGroupId: state.activeGroupId
      }),
      apply: () => ({
        groups: newGroups,
        activeGroupId: activeGroupId === id ? null : activeGroupId
      }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({
        groups: snapshot.groups,
        activeGroupId: snapshot.activeGroupId
      }),
      onError: (error) => {
        console.error("Failed to delete group:", error)
        return {}
      }
    })
  },

  renameGroup: async (id: string, name: string) => {
    const { groups } = get()
    const newGroups = groups.map((g) =>
      g.id === id ? { ...g, name, updatedAt: Date.now() } : g
    )
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        console.error("Failed to rename group:", error)
        return {}
      }
    })
  },

  updateGroup: async (id: string, updates: Partial<Pick<Group, "name" | "color" | "icon" | "iconUrl">>) => {
    const { groups } = get()
    const newGroups = groups.map((g) =>
      g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g
    )
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        console.error("Failed to update group:", error)
        return {}
      }
    })
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
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        console.error("Failed to add extension to group:", error)
        return {}
      }
    })
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
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        console.error("Failed to remove extension from group:", error)
        return {}
      }
    })
  },

  setDraggedExtension: (id: string | null) => set({ draggedExtensionId: id })
}))
