import * as React from "react"
import { X, FolderOpen, Plus, Power, PowerOff } from "lucide-react"
import { ExtensionCard } from "@/components/extension"
import { cn } from "@/utils"
import type { Group, Extension, ViewMode } from "@/types"

interface GroupChipProps {
  group: Group
  extensionCount: number
  onClick: () => void
  onToggle: () => void
}

export function GroupChip({
  group,
  extensionCount,
  onClick,
  onToggle
}: GroupChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 transition-all duration-200 cursor-pointer",
        "border border-punk-border/50 bg-punk-bg-alt",
        "hover:border-punk-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.3)]",
        "active:shadow-[0_0_15px_rgba(124,58,237,0.5)]"
      )}
      onClick={onClick}
    >
      <div
        className="h-2 w-2"
        style={{ backgroundColor: group.color }}
      />
      <span className="font-punk-heading text-[9px] text-punk-text-primary uppercase tracking-wide">
        {group.name}
      </span>
      <span className="font-punk-code text-[10px] text-punk-accent px-1.5 py-0.5 border border-punk-accent/30 bg-punk-accent/5">
        {extensionCount}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          "p-0.5 transition-colors",
          "text-punk-text-muted hover:text-punk-success hover:bg-punk-success/10"
        )}
        title="Toggle all in sector"
      >
        <Power className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface CreateGroupChipProps {
  onClick: () => void
}

export function CreateGroupChip({ onClick }: CreateGroupChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 transition-all duration-200",
        "border border-dashed border-punk-border/30 text-punk-text-muted",
        "hover:border-punk-accent hover:text-punk-accent hover:bg-punk-accent/5"
      )}
    >
      <Plus className="h-3.5 w-3.5" />
      <span className="font-punk-heading text-[8px] uppercase tracking-wide">+ SECTOR</span>
    </button>
  )
}

interface GroupDetailModalProps {
  group: Group
  extensions: Extension[]
  viewMode?: ViewMode
  onClose: () => void
  onToggleExtension: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
}

export function GroupDetailModal({
  group,
  extensions,
  viewMode = "card",
  onClose,
  onToggleExtension,
  onOpenOptions,
  onRemove
}: GroupDetailModalProps) {
  // Close on escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[340px] max-h-[480px] border border-punk-border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-punk-border/30 bg-punk-bg">
          <div
            className="h-3 w-3"
            style={{ backgroundColor: group.color }}
          />
          <h3 className="flex-1 font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wide">
            {group.name}
          </h3>
          <span className="font-punk-code text-[10px] text-punk-accent">
            [{extensions.length}]
          </span>
          <button
            onClick={onClose}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Extension List */}
        <div className="p-3 max-h-[380px] overflow-y-auto">
          {extensions.length > 0 ? (
            <div className="space-y-2">
              {extensions.map((ext) => (
                <ExtensionCard
                  key={ext.id}
                  extension={ext}
                  viewMode={viewMode}
                  onToggle={() => onToggleExtension(ext.id)}
                  onOpenOptions={() => onOpenOptions?.(ext.id)}
                  onRemove={() => onRemove?.(ext.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="h-10 w-10 text-punk-text-muted/50" />
              <p className="mt-3 font-punk-body text-base text-punk-text-muted">
                NO EXTENSIONS IN SECTOR
              </p>
              <p className="font-punk-code text-[10px] text-punk-text-muted/50 mt-1">
                // Sector empty
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
