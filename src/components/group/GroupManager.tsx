import * as React from "react"
import { Folder } from "lucide-react"
import { GroupItem, CreateGroupButton } from "./GroupItem"
import { cn } from "@/utils"
import type { Group, Extension } from "@/types"

interface GroupManagerProps {
  groups: Group[]
  extensions: Extension[]
  activeGroupId: string | null
  expandedGroups: Set<string>
  onSelectGroup: (id: string | null) => void
  onToggleExpanded: (id: string) => void
  onCreateGroup: (name: string, color: string) => void
  onDeleteGroup: (id: string) => void
  onRenameGroup: (id: string, name: string) => void
  className?: string
}

const GROUP_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899"  // pink
]

export function GroupManager({
  groups,
  extensions,
  activeGroupId,
  expandedGroups,
  onSelectGroup,
  onToggleExpanded,
  onCreateGroup,
  onDeleteGroup,
  onRenameGroup,
  className
}: GroupManagerProps) {
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [newGroupName, setNewGroupName] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState(GROUP_COLORS[0])
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState("")

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim(), selectedColor)
      setNewGroupName("")
      setSelectedColor(GROUP_COLORS[0])
      setShowCreateModal(false)
    }
  }

  const handleStartRename = (group: Group) => {
    setEditingGroupId(group.id)
    setEditingName(group.name)
  }

  const handleFinishRename = () => {
    if (editingGroupId && editingName.trim()) {
      onRenameGroup(editingGroupId, editingName.trim())
    }
    setEditingGroupId(null)
    setEditingName("")
  }

  return (
    <div className={cn("space-y-1", className)}>
      {/* All Extensions Button */}
      <button
        onClick={() => onSelectGroup(null)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm",
          "hover:bg-gray-50 dark:hover:bg-gray-800",
          activeGroupId === null && "bg-primary-light dark:bg-primary/20"
        )}
      >
        <Folder className="h-4 w-4 text-gray-500" />
        <span className="flex-1 text-left text-gray-900 dark:text-gray-100">
          All Extensions
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({extensions.length})
        </span>
      </button>

      {/* Groups */}
      {groups.map((group) => (
        <div key={group.id}>
          {editingGroupId === group.id ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: group.color }}
              />
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishRename()
                  if (e.key === "Escape") {
                    setEditingGroupId(null)
                    setEditingName("")
                  }
                }}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                autoFocus
              />
            </div>
          ) : (
            <GroupItem
              group={group}
              isExpanded={expandedGroups.has(group.id)}
              isActive={activeGroupId === group.id}
              extensionCount={group.extensionIds.length}
              onToggleExpand={() => onToggleExpanded(group.id)}
              onSelect={() => onSelectGroup(group.id)}
              onRename={() => handleStartRename(group)}
              onDelete={() => onDeleteGroup(group.id)}
              onAddExtension={() => {}}
            />
          )}
        </div>
      ))}

      {/* Create Group Button */}
      <CreateGroupButton onClick={() => setShowCreateModal(true)} />

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Create New Group
            </h3>

            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                autoFocus
              />

              <div className="flex gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform",
                      selectedColor === color && "ring-2 ring-offset-2 ring-gray-400 scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
