import * as React from "react"
import { ChevronRight, Folder, FolderOpen, MoreVertical, Pencil, Trash2, Plus } from "lucide-react"
import { cn } from "@/utils"
import type { Group } from "@/types"

interface GroupItemProps {
  group: Group
  isExpanded: boolean
  isActive: boolean
  extensionCount: number
  onToggleExpand: () => void
  onSelect: () => void
  onRename: () => void
  onDelete: () => void
  onAddExtension?: () => void
  className?: string
}

export function GroupItem({
  group,
  isExpanded,
  isActive,
  extensionCount,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onAddExtension: _onAddExtension,
  className
}: GroupItemProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      {/* Group Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer",
          "hover:bg-gray-50 dark:hover:bg-gray-800",
          isActive && "bg-primary-light dark:bg-primary/20"
        )}
        onClick={onSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {isExpanded ? (
            <ChevronRight className="h-4 w-4 rotate-90 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </button>

        <div
          className="flex-shrink-0 h-4 w-4 rounded"
          style={{ backgroundColor: group.color }}
        />

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-gray-500" />
        ) : (
          <Folder className="h-4 w-4 text-gray-500" />
        )}

        <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {group.name}
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({extensionCount})
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Pencil className="h-4 w-4" />
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CreateGroupButtonProps {
  onClick: () => void
  className?: string
}

export function CreateGroupButton({ onClick, className }: CreateGroupButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500",
        "hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
        "dark:text-gray-400 dark:hover:text-gray-300",
        className
      )}
    >
      <Plus className="h-4 w-4" />
      Create new group
    </button>
  )
}
