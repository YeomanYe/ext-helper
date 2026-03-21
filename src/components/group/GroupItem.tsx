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
    <div className={cn("border punk-border", className)}>
      {/* Group Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
          "hover:bg-punk-bg-alt",
          isActive && "bg-punk-primary/20"
        )}
        onClick={onSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="flex-shrink-0 text-punk-text-muted hover:text-punk-accent transition-colors"
        >
          {isExpanded ? (
            <ChevronRight className="h-4 w-4 rotate-90 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </button>

        <div
          className="flex-shrink-0 h-3 w-3"
          style={{ backgroundColor: group.color }}
        />

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-punk-accent" />
        ) : (
          <Folder className="h-4 w-4 text-punk-text-muted" />
        )}

        <span className="flex-1 truncate font-punk-heading text-[9px] text-punk-text-primary uppercase tracking-wide">
          {group.name}
        </span>

        <span className="font-punk-code text-[10px] text-punk-accent">
          [{extensionCount}]
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="flex h-6 w-6 items-center justify-center text-punk-text-muted hover:text-punk-accent transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
              >
                <Pencil className="h-4 w-4" />
                RENAME
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-cta hover:bg-punk-cta/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                DELETE
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
        "flex w-full items-center gap-2 px-3 py-2 font-punk-body text-sm text-punk-text-muted",
        "hover:text-punk-accent hover:bg-punk-bg-alt transition-colors border border-dashed border-punk-border/30 hover:border-punk-accent",
        className
      )}
    >
      <Plus className="h-4 w-4" />
      + NEW SECTOR
    </button>
  )
}
