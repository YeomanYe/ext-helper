import * as React from "react"
import { Folder, Search, X } from "lucide-react"
import { GroupItem, CreateGroupButton } from "./GroupItem"
import { cn } from "@/utils"
import type { Group, Extension } from "@/types"

type GroupFilterType = "all" | "hasExtensions" | "empty"

const FILTERS: { value: GroupFilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "hasExtensions", label: "WITH EXT" },
  { value: "empty", label: "EMPTY" },
]

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
  onAddToGroup: (groupId: string, extId: string) => void
  onRemoveFromGroup: (groupId: string, extId: string) => void
  className?: string
}

const GROUP_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#06B6D4", // cyan
  "#84CC16", // lime
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
  onAddToGroup,
  onRemoveFromGroup,
  className,
}: GroupManagerProps) {
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [newGroupName, setNewGroupName] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState(GROUP_COLORS[0])
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<GroupFilterType>("all")

  // Filtered groups
  const filteredGroups = React.useMemo(() => {
    let result = groups

    // Filter by status
    if (activeFilter === "hasExtensions") {
      result = result.filter((g) => g.extensionIds.length > 0)
    } else if (activeFilter === "empty") {
      result = result.filter((g) => g.extensionIds.length === 0)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((g) => g.name.toLowerCase().includes(query))
    }

    return result
  }, [groups, searchQuery, activeFilter])

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
      {/* Search Bar */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-punk-accent" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="punk-input h-7 w-full border border-punk-border/50 bg-punk-surface-raised pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-punk-surface-soft"
            >
              <X className="h-3 w-3 text-punk-text-muted" />
            </button>
          )}
        </div>
        {/* Filter Dropdown */}
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as GroupFilterType)}
          className="h-7 border border-punk-border/50 bg-punk-surface-raised px-1.5 text-xs text-punk-text-secondary"
        >
          {FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      {(searchQuery || activeFilter !== "all") && (
        <div className="px-3 py-1">
          <span className="text-xs text-punk-text-muted">
            {filteredGroups.length} / {groups.length} groups
          </span>
        </div>
      )}

      {/* All Extensions Button */}
      <button
        onClick={() => onSelectGroup(null)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-sm",
          "hover:bg-punk-surface-soft",
          activeGroupId === null && "border border-punk-primary/50 bg-punk-primary/10"
        )}
      >
        <Folder className="h-4 w-4 text-punk-accent" />
        <span className="flex-1 text-left text-punk-text-primary">All Extensions</span>
        <span className="text-xs text-punk-text-muted">({extensions.length})</span>
      </button>

      {/* Groups */}
      {filteredGroups.map((group) => (
        <div key={group.id}>
          {editingGroupId === group.id ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: group.color }} />
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
                className="punk-input flex-1 border border-punk-border/50 px-2 py-1 text-sm"
                autoFocus
              />
            </div>
          ) : (
            <GroupItem
              group={group}
              extensions={extensions}
              isExpanded={expandedGroups.has(group.id)}
              isActive={activeGroupId === group.id}
              extensionCount={group.extensionIds.length}
              onToggleExpand={() => onToggleExpanded(group.id)}
              onSelect={() => onSelectGroup(group.id)}
              onRename={() => handleStartRename(group)}
              onDelete={() => onDeleteGroup(group.id)}
              onAddExtension={(extId) => onAddToGroup(group.id, extId)}
              onRemoveExtension={(extId) => onRemoveFromGroup(group.id, extId)}
            />
          )}
        </div>
      ))}

      {/* Create Group Button */}
      <CreateGroupButton onClick={() => setShowCreateModal(true)} />

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/70 backdrop-blur-sm">
          <div className="w-72 border border-punk-border bg-punk-surface-raised p-4 shadow-punk-panel">
            <h3 className="font-punk-heading text-sm uppercase text-punk-text-primary">
              Create New Group
            </h3>

            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="punk-input w-full border border-punk-border/50 px-3 py-2 text-sm"
                autoFocus
              />

              <div className="flex gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "h-6 w-6 transition-transform",
                      selectedColor === color &&
                        "ring-2 ring-punk-primary ring-offset-2 ring-offset-punk-bg scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-sm text-punk-text-muted hover:text-punk-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="bg-punk-primary px-3 py-1.5 text-sm text-white hover:bg-punk-secondary disabled:opacity-50"
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
