import * as React from "react"
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  X,
} from "lucide-react"
import { cn } from "@/utils"
import type { Group, Extension } from "@/types"

interface GroupItemProps {
  group: Group
  extensions: Extension[]
  isExpanded: boolean
  isActive: boolean
  extensionCount: number
  onToggleExpand: () => void
  onSelect: () => void
  onRename: () => void
  onDelete: () => void
  onAddExtension: (extId: string) => void
  onRemoveExtension: (extId: string) => void
  className?: string
}

export function GroupItem({
  group,
  extensions,
  isExpanded,
  isActive,
  extensionCount,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onAddExtension,
  onRemoveExtension,
  className,
}: GroupItemProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showExtensionList, setShowExtensionList] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Extensions in this group
  const groupExtensions = React.useMemo(
    () => extensions.filter((e) => group.extensionIds.includes(e.id)),
    [extensions, group.extensionIds]
  )

  // Extensions NOT in this group (available to add)
  const availableExtensions = React.useMemo(
    () => extensions.filter((e) => !group.extensionIds.includes(e.id)),
    [extensions, group.extensionIds]
  )

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setShowExtensionList(false)
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

        <div className="flex-shrink-0 h-3 w-3" style={{ backgroundColor: group.color }} />

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-punk-accent" />
        ) : (
          <Folder className="h-4 w-4 text-punk-text-muted" />
        )}

        <span className="flex-1 truncate font-punk-heading text-[13px] text-punk-text-primary uppercase tracking-wider">
          {group.name}
        </span>

        <span className="font-punk-code text-[10px] text-punk-accent">[{extensionCount}]</span>

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
                  setShowMenu(false)
                  setShowExtensionList(true)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
              >
                <Plus className="h-4 w-4" />
                ADD EXTENSION
              </button>
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

          {/* Extension List Popup */}
          {showExtensionList && (
            <div
              ref={listRef}
              className="absolute left-full top-0 z-50 ml-1 w-56 border border-punk-border bg-punk-bg-alt py-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] max-h-64 overflow-y-auto"
            >
              {availableExtensions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-punk-text-muted">
                  No extensions available
                </div>
              ) : (
                availableExtensions.map((ext) => (
                  <button
                    key={ext.id}
                    onClick={() => {
                      onAddExtension(ext.id)
                      setShowExtensionList(false)
                      setShowMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-punk-text-secondary hover:bg-punk-bg transition-colors"
                  >
                    <div
                      className="h-4 w-4 rounded flex-shrink-0"
                      style={{ backgroundColor: ext.enabled ? "#22C55E" : "#6B7280" }}
                    />
                    <span className="truncate flex-1">{ext.name}</span>
                    <Plus className="h-3 w-3 flex-shrink-0 text-punk-accent" />
                  </button>
                ))
              )}

              {groupExtensions.length > 0 && (
                <>
                  <div className="my-1 border-t border-punk-border" />
                  <div className="px-3 py-1 text-xs text-punk-text-muted uppercase">In Sector</div>
                  {groupExtensions.map((ext) => (
                    <button
                      key={ext.id}
                      onClick={() => {
                        onRemoveExtension(ext.id)
                        setShowExtensionList(false)
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-punk-text-secondary hover:bg-punk-bg transition-colors"
                    >
                      <div
                        className="h-4 w-4 rounded flex-shrink-0"
                        style={{ backgroundColor: ext.enabled ? "#22C55E" : "#6B7280" }}
                      />
                      <span className="truncate flex-1">{ext.name}</span>
                      <X className="h-3 w-3 flex-shrink-0 text-punk-cta" />
                    </button>
                  ))}
                </>
              )}
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
        "flex w-full items-center gap-2 px-3 py-2 font-punk-body text-sm",
        "border border-punk-accent/50 text-punk-accent",
        "hover:bg-punk-accent/10 hover:border-punk-accent transition-all",
        className
      )}
    >
      <Plus className="h-4 w-4" />
      NEW GROUP
    </button>
  )
}
