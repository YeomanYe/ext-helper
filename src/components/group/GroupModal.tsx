import * as React from "react"
import { X, Plus, Search } from "lucide-react"
import { cn } from "@/utils"
import type { Group, Extension } from "@/types"

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
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
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

interface CreateGroupModalProps {
  onClose: () => void
  onCreate: (name: string, color: string) => void
}

const GROUP_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#22C55E",
  "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899"
]

export function CreateGroupModal({ onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState(GROUP_COLORS[0])

  // Close on escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), selectedColor)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-80 border border-punk-border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-punk-border/30">
          <h3 className="flex-1 font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wide">
            CREATE SECTOR
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block font-punk-heading text-[8px] text-punk-text-muted uppercase tracking-wide mb-2">
              SECTOR NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sector name..."
              className="punk-input w-full h-10 px-3 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-punk-heading text-[8px] text-punk-text-muted uppercase tracking-wide mb-2">
              COLOR
            </label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform",
                    selectedColor === color && "ring-2 ring-offset-2 ring-punk-accent scale-110"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-punk-border/30">
          <button
            onClick={onClose}
            className="px-4 py-2 font-punk-heading text-[9px] text-punk-text-muted uppercase tracking-wide hover:text-punk-text-primary"
          >
            CANCEL
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className={cn(
              "px-4 py-2 font-punk-heading text-[9px] uppercase tracking-wide transition-all",
              name.trim()
                ? "bg-punk-primary text-white hover:bg-punk-primary-hover"
                : "bg-punk-border/50 text-punk-text-muted cursor-not-allowed"
            )}
          >
            CREATE
          </button>
        </div>
      </div>
    </div>
  )
}

interface GroupDetailModalProps {
  group: Group
  extensions: Extension[]
  allExtensions: Extension[]
  onClose: () => void
  onToggleExtension: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
  onAddExtension: (groupId: string, extId: string) => void
  onRemoveFromGroup: (groupId: string, extId: string) => void
  onRename: (groupId: string, name: string) => void
}

export function GroupDetailModal({
  group,
  extensions,
  allExtensions,
  onClose,
  onToggleExtension,
  onOpenOptions,
  onRemove,
  onAddExtension,
  onRemoveFromGroup,
  onRename
}: GroupDetailModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)
  const [editName, setEditName] = React.useState(group.name)

  // Create a set of extension IDs in this group for fast lookup
  const groupExtIds = React.useMemo(() => {
    return new Set(extensions.map(e => e.id))
  }, [extensions])

  // Get all extensions with their group membership status
  const extensionsWithStatus = React.useMemo(() => {
    return allExtensions.map(ext => ({
      ...ext,
      isInGroup: groupExtIds.has(ext.id)
    }))
  }, [allExtensions, groupExtIds])

  // Filter by search query
  const filteredExtensions = React.useMemo(() => {
    if (!searchQuery.trim()) return extensionsWithStatus
    const query = searchQuery.toLowerCase()
    return extensionsWithStatus.filter(ext =>
      ext.name.toLowerCase().includes(query) ||
      ext.description.toLowerCase().includes(query)
    )
  }, [extensionsWithStatus, searchQuery])

  // Separate into in-group and not-in-group
  const inGroupExtensions = filteredExtensions.filter(e => e.isInGroup)
  const notInGroupExtensions = filteredExtensions.filter(e => !e.isInGroup)

  // Close on escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false)
          setEditName(group.name)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose, isEditing, group.name])

  const handleSaveRename = () => {
    if (editName.trim() && editName !== group.name) {
      onRename(group.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleToggleExtensionMembership = (ext: typeof filteredExtensions[0]) => {
    if (ext.isInGroup) {
      onRemoveFromGroup(group.id, ext.id)
    } else {
      onAddExtension(group.id, ext.id)
    }
  }

  const handleToggleEnabled = (e: React.MouseEvent, extId: string) => {
    e.stopPropagation()
    onToggleExtension(extId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[400px] max-h-[560px] border border-punk-border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-punk-border/30 bg-punk-bg shrink-0">
          <div
            className="h-3 w-3"
            style={{ backgroundColor: group.color }}
          />
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename()
                if (e.key === "Escape") {
                  setIsEditing(false)
                  setEditName(group.name)
                }
              }}
              onBlur={handleSaveRename}
              className="flex-1 h-6 px-2 font-punk-heading text-[10px] text-punk-text-primary uppercase bg-punk-bg border border-punk-border/50"
              autoFocus
            />
          ) : (
            <h3 className="flex-1 font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wide">
              {group.name}
            </h3>
          )}
          <span className="font-punk-code text-[10px] text-punk-accent">
            [{extensions.length}]
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-punk-text-muted hover:text-punk-accent transition-colors"
              title="Rename sector"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-punk-border/30 bg-punk-bg shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-punk-accent" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH..."
              className="punk-input w-full h-10 pl-10 pr-3 text-sm"
            />
          </div>
        </div>

        {/* Extension List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* In Group Section */}
          {inGroupExtensions.length > 0 && (
            <div>
              <p className="font-punk-heading text-[8px] text-punk-success uppercase tracking-wide mb-2">
                IN SECTOR [{inGroupExtensions.length}]
              </p>
              <div className="space-y-1">
                {inGroupExtensions.map((ext) => (
                  <div
                    key={ext.id}
                    onClick={() => handleToggleExtensionMembership(ext)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 cursor-pointer transition-all",
                      "border bg-punk-bg",
                      "border-punk-success/50 hover:border-punk-success hover:bg-punk-success/5",
                      !ext.enabled && "opacity-50"
                    )}
                  >
                    {ext.iconUrl ? (
                      <img src={ext.iconUrl} className="h-8 w-8 object-cover border border-punk-border/30" alt="" />
                    ) : (
                      <div className="h-8 w-8 border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center">
                        <span className="font-punk-heading text-[8px] text-punk-text-muted">{ext.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-punk-heading text-[8px] text-punk-text-primary truncate uppercase">
                        {ext.name}
                      </p>
                      <p className="font-punk-code text-[9px] text-punk-text-muted">
                        v{ext.version}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleEnabled(e, ext.id)}
                        className={cn(
                          "px-2 py-1 text-[8px] font-punk-heading transition-all",
                          ext.enabled
                            ? "text-punk-success border border-punk-success/50 bg-punk-success/10"
                            : "text-punk-text-muted border border-punk-border/30"
                        )}
                      >
                        {ext.enabled ? "1" : "0"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveFromGroup(group.id, ext.id)
                        }}
                        className={cn(
                          "p-1.5 text-punk-text-muted transition-all",
                          "hover:text-punk-cta hover:bg-punk-cta/10"
                        )}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Not In Group Section */}
          {notInGroupExtensions.length > 0 && (
            <div>
              <p className="font-punk-heading text-[8px] text-punk-text-muted uppercase tracking-wide mb-2">
                NOT IN SECTOR [{notInGroupExtensions.length}]
              </p>
              <div className="space-y-1">
                {notInGroupExtensions.map((ext) => (
                  <div
                    key={ext.id}
                    onClick={() => handleToggleExtensionMembership(ext)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 cursor-pointer transition-all opacity-40",
                      "border border-punk-border/20 bg-punk-bg-alt",
                      "hover:border-punk-primary/50 hover:opacity-70"
                    )}
                  >
                    {ext.iconUrl ? (
                      <img src={ext.iconUrl} className="h-8 w-8 object-cover border border-punk-border/30 grayscale" alt="" />
                    ) : (
                      <div className="h-8 w-8 border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center grayscale">
                        <span className="font-punk-heading text-[8px] text-punk-text-muted">{ext.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-punk-heading text-[8px] text-punk-text-muted truncate uppercase">
                        {ext.name}
                      </p>
                      <p className="font-punk-code text-[9px] text-punk-text-muted">
                        v{ext.version}
                      </p>
                    </div>
                    <button
                      className={cn(
                        "p-1.5 text-punk-text-muted transition-all"
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredExtensions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="font-punk-body text-base text-punk-text-muted">
                NO_MATCH_FOUND
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
