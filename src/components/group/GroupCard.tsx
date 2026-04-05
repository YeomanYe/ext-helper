import * as React from "react"
import { ChevronDown, ChevronRight, Folder, MoreVertical, Plus, Pencil, Trash2, Edit2 } from "lucide-react"
import { ExtensionCard } from "@/components/extension"
import { cn } from "@/utils"
import type { Group, Extension } from "@/types"

interface GroupCardProps {
  group: Group
  extensions: Extension[]
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onRename: () => void
  onAddExtension?: () => void
  onToggleExtension: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
}

export function GroupCard({
  group,
  extensions,
  isExpanded,
  onToggleExpand,
  onDelete,
  onRename,
  onAddExtension,
  onToggleExtension,
  onOpenOptions,
  onRemove
}: GroupCardProps) {
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
    <div className="border transition-all punk-border bg-punk-bg-alt hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]">
      {/* Group Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer",
          "hover:bg-punk-bg/50",
          "transition-colors duration-150"
        )}
        onClick={onToggleExpand}
      >
        <button className="flex-shrink-0 text-punk-text-muted hover:text-punk-accent">
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        <div
          className="flex-shrink-0 h-3 w-3 rounded-sm"
          style={{ backgroundColor: group.color }}
        />

        <Folder className="h-3 w-3 text-punk-accent" />

        <span className="flex-1 truncate font-punk-heading text-[13px] text-punk-text-primary uppercase tracking-wider">
          {group.name}
        </span>

        <span className="font-punk-code text-[11px] text-punk-text-muted">
          ({extensions.length})
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="flex h-6 w-6 items-center justify-center text-punk-text-muted hover:text-punk-accent transition-colors"
          >
            <MoreVertical className="h-3 w-3" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-32 border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-punk-body text-[13px] text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
              >
                <Edit2 className="h-3 w-3" />
                RENAME
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-punk-body text-[13px] text-punk-cta hover:bg-punk-cta/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                DELETE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group Content - Extension Grid */}
      {isExpanded && (
        <div className="border-t border-punk-border/30 px-3 py-3">
          {extensions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {extensions.map((ext) => (
                <ExtensionCard
                  key={ext.id}
                  extension={ext}
                  onToggle={() => onToggleExtension(ext.id)}
                  onOpenOptions={() => onOpenOptions?.(ext.id)}
                  onRemove={() => onRemove?.(ext.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Folder className="h-6 w-6 text-punk-text-muted" />
              <p className="mt-2 font-punk-body text-[13px] text-punk-text-muted uppercase">
                NO_EXTENSIONS
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddExtension?.()
                }}
                className="mt-2 flex items-center gap-1 font-punk-heading text-[12px] text-punk-accent uppercase hover:text-punk-primary transition-colors"
              >
                <Plus className="h-3 w-3" />
                ADD_EXTENSION
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface CreateGroupCardProps {
  onClick: () => void
}

export function CreateGroupCard({ onClick }: CreateGroupCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 border border-dashed border-punk-border/50",
        "px-3 py-2 font-punk-heading text-[13px] uppercase text-punk-text-muted",
        "hover:border-punk-primary hover:text-punk-accent hover:shadow-[0_0_10px_rgba(124,58,237,0.3)]",
        "transition-all duration-200"
      )}
    >
      <Plus className="h-3 w-3" />
      NEW_GROUP
    </button>
  )
}
