import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Group } from "@/types"

const repo = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  saveAll: vi.fn(),
  generateId: vi.fn()
}))

vi.mock("@/services/groupsRepo", () => ({
  groupsRepo: repo
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
    order: 0
  },
  {
    id: "g2",
    name: "Two",
    color: "#000",
    icon: "folder",
    extensionIds: [],
    createdAt: 1,
    updatedAt: 1,
    isExpanded: true,
    order: 1
  }
]

describe("groupStore", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    repo.fetchAll.mockResolvedValue(baseGroups)
    repo.saveAll.mockResolvedValue(undefined)
    repo.generateId.mockReturnValue("generated")
  })

  it("moves an extension into the selected group", async () => {
    const { useGroupStore } = await import("../groupStore")
    await useGroupStore.getState().fetchGroups()

    await useGroupStore.getState().addToGroup("g2", "a")

    expect(useGroupStore.getState().groups[0].extensionIds).toEqual([])
    expect(useGroupStore.getState().groups[1].extensionIds).toEqual(["a"])
  })

  it("removes an extension from a group", async () => {
    const { useGroupStore } = await import("../groupStore")
    await useGroupStore.getState().fetchGroups()

    await useGroupStore.getState().removeFromGroup("g1", "a")

    expect(useGroupStore.getState().groups[0].extensionIds).toEqual([])
  })
})
