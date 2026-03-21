import * as React from "react"
import { X, FolderOpen, Plus, Power, Search, Check } from "lucide-react"
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
  allExtensions: Extension[]
  viewMode?: ViewMode
  onClose: () => void
  onToggleExtension: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
  onAddExtension: (groupId: string, extId: string) => void
  onRemoveFromGroup: (groupId: string, extId: string) => void
}

export function GroupDetailModal({
  group,
  extensions,
  allExtensions,
  viewMode = "card",
  onClose,
  onToggleExtension,
  onOpenOptions,
  onRemove,
  onAddExtension,
  onRemoveFromGroup
}: GroupDetailModalProps) {
  const [isAddMode, setIsAddMode] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Get extensions NOT in this group (available to add)
  const availableExtensions = React.useMemo(() => {
    const groupExtIds = new Set(extensions.map(e => e.id))
    return allExtensions.filter(ext => !groupExtIds.has(ext.id))
  }, [allExtensions, extensions])

  // Filter available extensions by search
  const filteredAvailable = React.useMemo(() => {
    if (!searchQuery.trim()) return availableExtensions
    const query = searchQuery.toLowerCase()
    return availableExtensions.filter(ext =>
      ext.name.toLowerCase().includes(query) ||
      ext.description.toLowerCase().includes(query)
    )
  }, [availableExtensions, searchQuery])

  // Close on escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAddMode) {
          setIsAddMode(false)
          setSearchQuery("")
        } else {
          onClose()
        }
      }
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose, isAddMode])

  const handleAddExtension = (extId: string) => {
    onAddExtension(group.id, extId)
  }

  const handleRemoveFromGroup = (extId: string) => {
    onRemoveFromGroup(group.id, extId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[360px] max-h-[520px] border border-punk-border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden"
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
          {!isAddMode && (
            <button
              onClick={() => setIsAddMode(true)}
              className={cn(
                "px-2 py-1 text-[8px] font-punk-heading uppercase transition-all",
                "border border-punk-accent/50 text-punk-accent",
                "hover:bg-punk-accent/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
              )}
            >
              + ADD
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Add Extension Mode */}
        {isAddMode && (
          <div className="p-3 border-b border-punk-border/30">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-punk-accent" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH_EXTENSIONS..."
                className="punk-input w-full h-10 pl-10 pr-3 text-sm"
                autoFocus
              />
            </div>

            {/* Available Extensions List */}
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredAvailable.length > 0 ? (
                filteredAvailable.map((ext) => (
                  <button
                    key={ext.id}
                    onClick={() => handleAddExtension(ext.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 text-left transition-all",
                      "border border-punk-border/30 bg-punk-bg",
                      "hover:border-punk-success hover:bg-punk-success/5",
                      "hover:shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                    )}
                  >
                    {ext.iconUrl ? (
                      <img src={ext.iconUrl} className="h-6 w-6 object-cover border border-punk-border/30" alt="" />
                    ) : (
                      <div className="h-6 w-6 border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center">
                        <span className="text-[8px] text-punk-text-muted">{ext.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-punk-heading text-[8px] text-punk-text-primary truncate">
                        {ext.name}
                      </p>
                      <p className="font-punk-code text-[9px] text-punk-text-muted">
                        v{ext.version}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-punk-success shrink-0" />
                  </button>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="font-punk-body text-sm text-punk-text-muted">
                    {searchQuery ? "NO_MATCH_FOUND" : "ALL_ADDED"}
                  </p>
                </div>
              )}
            </div>

            {/* Cancel Add Mode */}
            <button
              onClick={() => {
                setIsAddMode(false)
                setSearchQuery("")
              }}
              className={cn(
                "w-full mt-3 px-3 py-2 text-[8px] font-punk-heading uppercase",
                "border border-punk-text-muted/30 text-punk-text-muted",
                "hover:border-punk-cta hover:text-punk-cta transition-colors"
              )}
            >
              CANCEL
            </button>
          </div>
        )}

        {/* Extension List */}
        <div className="p-3 max-h-[320px] overflow-y-auto">
          {extensions.length > 0 ? (
            <div className="space-y-2">
              {extensions.map((ext) => (
                <div
                  key={ext.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 transition-all",
                    "border border-punk-border/30 bg-punk-bg-alt",
                    "hover:border-punk-primary/50"
                  )}
                >
                  {ext.iconUrl ? (
                    <img src={ext.iconUrl} className="h-8 w-8 object-cover border border-punk-border/30" alt="" />
                  ) : (
                    <div className="h-8 w-8 border border-punk-border/30 bg-punk-bg flex items-center justify-center">
                      <span className="font-punk-heading text-[8px] text-punk-text-muted">{ext.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-punk-heading text-[8px] text-punk-text-primary truncate">
                      {ext.name}
                    </p>
                    <p className="font-punk-code text-[9px] text-punk-text-muted">
                      v{ext.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleExtension(ext.id)}
                      className={cn(
                        "p-1.5 transition-all",
                        ext.enabled
                          ? "text-punk-success bg-punk-success/10 hover:bg-punk-success/20"
                          : "text-punk-text-muted bg-punk-bg hover:bg-punk-bg-alt"
                      )}
                      title={ext.enabled ? "Disable" : "Enable"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromGroup(ext.id)}
                      className={cn(
                        "p-1.5 text-punk-text-muted transition-all",
                        "hover:text-punk-cta hover:bg-punk-cta/10"
                      )}
                      title="Remove from group"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
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
              {availableExtensions.length > 0 && (
                <button
                  onClick={() => setIsAddMode(true)}
                  className={cn(
                    "mt-4 px-4 py-2 text-[8px] font-punk-heading uppercase",
                    "border border-punk-accent text-punk-accent",
                    "hover:bg-punk-accent/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  )}
                >
                  + ADD EXTENSION
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
