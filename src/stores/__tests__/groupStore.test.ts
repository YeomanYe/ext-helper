import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Group } from "@/types"

const repo = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  saveAll: vi.fn(),
  generateId: vi.fn(),
}))

vi.mock("@/services/groupsRepo", () => ({
  groupsRepo: repo,
}))

const baseGroups: Group[] = [
  {
    id: "g1",
    name: "One",
    color: "#fff",
    icon: "folder",
    extensionIds: ["a"],
    createdAt: 1,
    updatedAt: 1,
    isExpanded: true,
    order: 0,
  },
  {
    id: "g2",
    name: "Two",
    color: "#000",
    icon: "folder",
    extensionIds: ["b", "c"],
    createdAt: 1,
    updatedAt: 1,
    isExpanded: true,
    order: 1,
  },
]

describe("groupStore", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    repo.fetchAll.mockResolvedValue(baseGroups)
    repo.saveAll.mockResolvedValue(undefined)
    repo.generateId.mockReturnValue("generated")
  })

  // ============================================================
  // createGroup
  // ============================================================
  describe("createGroup", () => {
    it("normal: should create a group with default color", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().createGroup("New Group")

      const groups = useGroupStore.getState().groups
      expect(groups).toHaveLength(3)
      const created = groups[2]
      expect(created.id).toBe("generated")
      expect(created.name).toBe("New Group")
      expect(created.color).toBe("#6366F1")
      expect(created.icon).toBe("folder")
      expect(created.extensionIds).toEqual([])
      expect(created.isExpanded).toBe(true)
      expect(created.order).toBe(2)
      expect(repo.saveAll).toHaveBeenCalledOnce()
    })

    it("normal: should create a group with custom color", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().createGroup("Custom", "#FF0000")

      const created = useGroupStore.getState().groups[2]
      expect(created.color).toBe("#FF0000")
      expect(created.name).toBe("Custom")
    })

    it("abnormal: should rollback on save failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("save failed"))
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().createGroup("Fail")

      expect(useGroupStore.getState().groups).toHaveLength(2)
    })
  })

  // ============================================================
  // deleteGroup
  // ============================================================
  describe("deleteGroup", () => {
    it("normal: should delete a group", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().deleteGroup("g1")

      const groups = useGroupStore.getState().groups
      expect(groups).toHaveLength(1)
      expect(groups[0].id).toBe("g2")
      expect(repo.saveAll).toHaveBeenCalledOnce()
    })

    it("normal: should clear activeGroupId when deleting the active group", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()
      useGroupStore.getState().selectGroup("g1")
      expect(useGroupStore.getState().activeGroupId).toBe("g1")

      await useGroupStore.getState().deleteGroup("g1")

      expect(useGroupStore.getState().activeGroupId).toBeNull()
    })

    it("normal: should keep activeGroupId when deleting a different group", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()
      useGroupStore.getState().selectGroup("g1")

      await useGroupStore.getState().deleteGroup("g2")

      expect(useGroupStore.getState().activeGroupId).toBe("g1")
    })

    it("abnormal: should rollback on delete failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("delete failed"))
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()
      useGroupStore.getState().selectGroup("g1")

      await useGroupStore.getState().deleteGroup("g1")

      expect(useGroupStore.getState().groups).toHaveLength(2)
      expect(useGroupStore.getState().activeGroupId).toBe("g1")
    })
  })

  // ============================================================
  // renameGroup
  // ============================================================
  describe("renameGroup", () => {
    it("normal: should rename a group", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().renameGroup("g1", "Renamed")

      expect(useGroupStore.getState().groups[0].name).toBe("Renamed")
      expect(useGroupStore.getState().groups[0].updatedAt).toBeGreaterThan(1)
      expect(repo.saveAll).toHaveBeenCalledOnce()
    })

    it("abnormal: should rollback on rename failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("rename failed"))
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().renameGroup("g1", "Renamed")

      expect(useGroupStore.getState().groups[0].name).toBe("One")
    })
  })

  // ============================================================
  // updateGroup
  // ============================================================
  describe("updateGroup", () => {
    it("normal: should update group name", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().updateGroup("g1", { name: "Updated" })

      expect(useGroupStore.getState().groups[0].name).toBe("Updated")
    })

    it("normal: should update group color", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().updateGroup("g1", { color: "#00FF00" })

      expect(useGroupStore.getState().groups[0].color).toBe("#00FF00")
    })

    it("normal: should update group icon and iconUrl", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().updateGroup("g1", { icon: "star", iconUrl: "http://icon.png" })

      const group = useGroupStore.getState().groups[0]
      expect(group.icon).toBe("star")
      expect(group.iconUrl).toBe("http://icon.png")
      expect(group.updatedAt).toBeGreaterThan(1)
    })

    it("abnormal: should rollback on update failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("update failed"))
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().updateGroup("g1", { name: "Updated", color: "#FF0000" })

      expect(useGroupStore.getState().groups[0].name).toBe("One")
      expect(useGroupStore.getState().groups[0].color).toBe("#fff")
    })
  })

  // ============================================================
  // selectGroup
  // ============================================================
  describe("selectGroup", () => {
    it("normal: should set activeGroupId", async () => {
      const { useGroupStore } = await import("../groupStore")

      useGroupStore.getState().selectGroup("g1")

      expect(useGroupStore.getState().activeGroupId).toBe("g1")
    })

    it("normal: should clear activeGroupId with null", async () => {
      const { useGroupStore } = await import("../groupStore")
      useGroupStore.getState().selectGroup("g1")

      useGroupStore.getState().selectGroup(null)

      expect(useGroupStore.getState().activeGroupId).toBeNull()
    })
  })

  // ============================================================
  // toggleGroupExpanded
  // ============================================================
  describe("toggleGroupExpanded", () => {
    it("normal: should add group to expanded set", async () => {
      const { useGroupStore } = await import("../groupStore")

      useGroupStore.getState().toggleGroupExpanded("g1")

      expect(useGroupStore.getState().expandedGroups.has("g1")).toBe(true)
    })

    it("normal: should remove group from expanded set when toggled again", async () => {
      const { useGroupStore } = await import("../groupStore")
      useGroupStore.getState().toggleGroupExpanded("g1")
      expect(useGroupStore.getState().expandedGroups.has("g1")).toBe(true)

      useGroupStore.getState().toggleGroupExpanded("g1")

      expect(useGroupStore.getState().expandedGroups.has("g1")).toBe(false)
    })
  })

  // ============================================================
  // addToGroup
  // ============================================================
  describe("addToGroup", () => {
    it("normal: should add an extension to a group", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().addToGroup("g2", "d")

      expect(useGroupStore.getState().groups[1].extensionIds).toContain("d")
    })

    it("normal: should move extension from one group to another", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().addToGroup("g2", "a")

      expect(useGroupStore.getState().groups[0].extensionIds).toEqual([])
      expect(useGroupStore.getState().groups[1].extensionIds).toEqual(["b", "c", "a"])
    })

    it("edge: should not duplicate extension if already in target group", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().addToGroup("g1", "a")

      expect(useGroupStore.getState().groups[0].extensionIds).toEqual(["a"])
    })

    it("abnormal: should rollback on addToGroup failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("add failed"))
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().addToGroup("g2", "a")

      expect(useGroupStore.getState().groups[0].extensionIds).toEqual(["a"])
      expect(useGroupStore.getState().groups[1].extensionIds).toEqual(["b", "c"])
    })
  })

  // ============================================================
  // removeFromGroup
  // ============================================================
  describe("removeFromGroup", () => {
    it("normal: should remove an extension from a group", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().removeFromGroup("g1", "a")

      expect(useGroupStore.getState().groups[0].extensionIds).toEqual([])
    })

    it("normal: should remove one extension and keep others", async () => {
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().removeFromGroup("g2", "b")

      expect(useGroupStore.getState().groups[1].extensionIds).toEqual(["c"])
    })

    it("abnormal: should rollback on removeFromGroup failure", async () => {
      repo.saveAll.mockRejectedValue(new Error("remove failed"))
      const { useGroupStore } = await import("../groupStore")
      await useGroupStore.getState().fetchGroups()

      await useGroupStore.getState().removeFromGroup("g1", "a")

      expect(useGroupStore.getState().groups[0].extensionIds).toEqual(["a"])
    })
  })

  // ============================================================
  // setDraggedExtension
  // ============================================================
  describe("setDraggedExtension", () => {
    it("normal: should set draggedExtensionId", async () => {
      const { useGroupStore } = await import("../groupStore")

      useGroupStore.getState().setDraggedExtension("ext-1")

      expect(useGroupStore.getState().draggedExtensionId).toBe("ext-1")
    })

    it("normal: should clear draggedExtensionId with null", async () => {
      const { useGroupStore } = await import("../groupStore")
      useGroupStore.getState().setDraggedExtension("ext-1")

      useGroupStore.getState().setDraggedExtension(null)

      expect(useGroupStore.getState().draggedExtensionId).toBeNull()
    })
  })
})
