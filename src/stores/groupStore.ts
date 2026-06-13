import { create } from "zustand"
import type { Group, GroupDropPosition, GroupStore } from "@/types"
import { groupsRepo } from "@/services/groupsRepo"
import { runOptimisticMutation } from "@/stores/optimistic"
import { logger } from "@/utils/logger"

function sortGroupsByOrder(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => {
    const orderDiff = a.order - b.order
    if (orderDiff !== 0) return orderDiff

    const createdAtDiff = a.createdAt - b.createdAt
    if (createdAtDiff !== 0) return createdAtDiff

    return a.id.localeCompare(b.id)
  })
}

function normalizeGroupOrder(groups: Group[]): Group[] {
  return groups.map((group, index) => (group.order === index ? group : { ...group, order: index }))
}

function reorderGroups(
  groups: Group[],
  sourceGroupId: string,
  targetGroupId: string,
  position: GroupDropPosition
): Group[] | null {
  if (sourceGroupId === targetGroupId) return null

  const orderedGroups = normalizeGroupOrder(sortGroupsByOrder(groups))
  const sourceIndex = orderedGroups.findIndex((group) => group.id === sourceGroupId)
  const targetIndex = orderedGroups.findIndex((group) => group.id === targetGroupId)
  if (sourceIndex === -1 || targetIndex === -1) return null

  const nextGroups = [...orderedGroups]
  const [sourceGroup] = nextGroups.splice(sourceIndex, 1)
  const targetIndexAfterRemoval = nextGroups.findIndex((group) => group.id === targetGroupId)
  const insertIndex = position === "after" ? targetIndexAfterRemoval + 1 : targetIndexAfterRemoval
  nextGroups.splice(insertIndex, 0, sourceGroup)

  if (nextGroups.every((group, index) => group.id === orderedGroups[index]?.id)) {
    return null
  }

  const now = Date.now()
  return nextGroups.map((group, index) =>
    group.order === index ? group : { ...group, order: index, updatedAt: now }
  )
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  activeGroupId: null,
  expandedGroups: new Set<string>(),
  draggedExtensionId: null,

  fetchGroups: async () => {
    try {
      const groups = await groupsRepo.fetchAll()
      set({ groups: normalizeGroupOrder(sortGroupsByOrder(groups)) })
    } catch (error) {
      logger.error("Failed to fetch groups:", error)
      set({ groups: [] })
    }
  },

  createGroup: async (name: string, color: string = "#6366F1", extensionIds: string[] = []) => {
    const { groups } = get()
    const orderedGroups = normalizeGroupOrder(sortGroupsByOrder(groups))
    const newGroup: Group = {
      id: groupsRepo.generateId(),
      name,
      color,
      icon: "folder",
      extensionIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true,
      order: orderedGroups.length,
    }

    const newGroups = [...orderedGroups, newGroup]
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        logger.error("Failed to save group:", error)
        return {}
      },
    })
  },

  deleteGroup: async (id: string) => {
    const { groups, activeGroupId } = get()
    const newGroups = normalizeGroupOrder(sortGroupsByOrder(groups).filter((g) => g.id !== id))
    await runOptimisticMutation(set, get, {
      snapshot: (state) => ({
        groups: state.groups,
        activeGroupId: state.activeGroupId,
      }),
      apply: () => ({
        groups: newGroups,
        activeGroupId: activeGroupId === id ? null : activeGroupId,
      }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({
        groups: snapshot.groups,
        activeGroupId: snapshot.activeGroupId,
      }),
      onError: (error) => {
        logger.error("Failed to delete group:", error)
        return {}
      },
    })
  },

  renameGroup: async (id: string, name: string) => {
    const { groups } = get()
    const newGroups = groups.map((g) => (g.id === id ? { ...g, name, updatedAt: Date.now() } : g))
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        logger.error("Failed to rename group:", error)
        return {}
      },
    })
  },

  updateGroup: async (
    id: string,
    updates: Partial<Pick<Group, "name" | "color" | "icon" | "iconUrl">>
  ) => {
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
        logger.error("Failed to update group:", error)
        return {}
      },
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
          updatedAt: Date.now(),
        }
      }
      return {
        ...g,
        extensionIds: g.extensionIds.filter((id) => id !== extId),
        updatedAt: Date.now(),
      }
    })
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        logger.error("Failed to add extension to group:", error)
        return {}
      },
    })
  },

  removeFromGroup: async (groupId: string, extId: string) => {
    const { groups } = get()
    const newGroups = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            extensionIds: g.extensionIds.filter((id) => id !== extId),
            updatedAt: Date.now(),
          }
        : g
    )
    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        logger.error("Failed to remove extension from group:", error)
        return {}
      },
    })
  },

  reorderGroup: async (
    sourceGroupId: string,
    targetGroupId: string,
    position: GroupDropPosition = "before"
  ) => {
    const { groups } = get()
    const newGroups = reorderGroups(groups, sourceGroupId, targetGroupId, position)
    if (!newGroups) return

    await runOptimisticMutation(set, get, {
      snapshot: (state) => state.groups,
      apply: () => ({ groups: newGroups }),
      persist: () => groupsRepo.saveAll(newGroups),
      rollback: (snapshot) => ({ groups: snapshot }),
      onError: (error) => {
        logger.error("Failed to reorder group:", error)
        return {}
      },
    })
  },

  setDraggedExtension: (id: string | null) => set({ draggedExtensionId: id }),
}))
