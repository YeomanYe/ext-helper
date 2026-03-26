import * as React from "react"
import { X, Plus, Folder, Package, Star, Heart, Bookmark, Tag, Flag, Briefcase, Code, Globe, Lock, Settings, Wrench, Zap, Flame, Gem, Crown, Target } from "lucide-react"
import { cn } from "@/utils"
import { SearchBar } from "@/components/popup"
import type { Group, Extension, FilterType } from "@/types"

const ICON_MAP: Record<string, React.ReactNode> = {
  folder: <Folder className="w-3 h-3" />,
  star: <Star className="w-3 h-3" />,
  heart: <Heart className="w-3 h-3" />,
  bookmark: <Bookmark className="w-3 h-3" />,
  tag: <Tag className="w-3 h-3" />,
  flag: <Flag className="w-3 h-3" />,
  briefcase: <Briefcase className="w-3 h-3" />,
  code: <Code className="w-3 h-3" />,
  globe: <Globe className="w-3 h-3" />,
  lock: <Lock className="w-3 h-3" />,
  settings: <Settings className="w-3 h-3" />,
  tool: <Wrench className="w-3 h-3" />,
  zap: <Zap className="w-3 h-3" />,
  bolt: <Zap className="w-3 h-3" />,
  flame: <Flame className="w-3 h-3" />,
  gem: <Gem className="w-3 h-3" />,
  crown: <Crown className="w-3 h-3" />,
  target: <Target className="w-3 h-3" />,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

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
  // Get icon to display (custom image or icon map)
  const groupIconUrl = (group as any)?.iconUrl
  const displayIcon = groupIconUrl ? (
    <img src={groupIconUrl} className="w-full h-full object-cover" alt="" />
  ) : (
    ICON_MAP[group.icon] || <Folder className="w-3 h-3" />
  )

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
      {/* Icon */}
      {groupIconUrl ? (
        <img src={groupIconUrl} className="h-5 w-5 border border-punk-border/30 object-cover flex-shrink-0" alt="" />
      ) : (
        <div
          className="h-5 w-5 rounded-sm border border-punk-border/30 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: group.color + "20" }}
        >
          <span style={{ color: group.color }}>{displayIcon}</span>
        </div>
      )}
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
      <Folder className="h-3.5 w-3.5" />
      <span className="font-punk-heading text-[8px] uppercase tracking-wide">NEW SECTOR</span>
    </button>
  )
}

const GROUP_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#22C55E",
  "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899"
]

interface GroupModalProps {
  // For create mode: group is null/undefined
  // For edit mode: group is provided
  group?: Group
  extensions?: Extension[]
  allExtensions?: Extension[]
  onClose: () => void
  onCreate?: (name: string, color: string, extensionIds: string[]) => void
  onToggleExtension?: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
  onAddExtension?: (groupId: string, extId: string) => void
  onRemoveFromGroup?: (groupId: string, extId: string) => void
  onUpdateGroup?: (groupId: string, updates: { name?: string; color?: string; icon?: string; iconUrl?: string }) => void
}

export function GroupModal({
  group,
  extensions = [],
  allExtensions = [],
  onClose,
  onCreate,
  onToggleExtension,
  onOpenOptions,
  onRemove,
  onAddExtension,
  onRemoveFromGroup,
  onUpdateGroup
}: GroupModalProps) {
  const isCreateMode = !group

  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterType>("all")
  const [editName, setEditName] = React.useState(group?.name || "New Sector")
  const [selectedColor, setSelectedColor] = React.useState(group?.color || GROUP_COLORS[0])
  const [showImageUpload, setShowImageUpload] = React.useState(false)
  const [selectedExtensions, setSelectedExtensions] = React.useState<Set<string>>(new Set())
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const imageUploadRef = React.useRef<HTMLDivElement>(null)

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && group && onUpdateGroup) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        onUpdateGroup(group.id, { icon: "custom", iconUrl: dataUrl })
        setShowImageUpload(false)
      }
      reader.readAsDataURL(file)
    }
  }

  // Close image upload on outside click
  React.useEffect(() => {
    if (!showImageUpload) return
    function handleClickOutside(event: MouseEvent) {
      if (imageUploadRef.current && !imageUploadRef.current.contains(event.target as Node)) {
        setShowImageUpload(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showImageUpload])

  // Create a set of extension IDs in this group for fast lookup
  const groupExtIds = React.useMemo(() => {
    return new Set(extensions.map(e => e.id))
  }, [extensions])

  // Get all extensions with their group membership status
  const extensionsWithStatus = React.useMemo(() => {
    return allExtensions.map(ext => ({
      ...ext,
      isInGroup: isCreateMode ? selectedExtensions.has(ext.id) : groupExtIds.has(ext.id)
    }))
  }, [allExtensions, groupExtIds, selectedExtensions, isCreateMode])

  // Filter by search query and enabled/disabled status
  const filteredExtensions = React.useMemo(() => {
    let result = extensionsWithStatus

    // Apply enabled/disabled filter
    if (filter === "enabled") {
      result = result.filter(ext => ext.enabled)
    } else if (filter === "disabled") {
      result = result.filter(ext => !ext.enabled)
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(ext =>
        ext.name.toLowerCase().includes(query) ||
        ext.description.toLowerCase().includes(query)
      )
    }

    return result
  }, [extensionsWithStatus, searchQuery, filter])

  // Close on escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  // Update name on blur or enter (edit mode only)
  const handleNameChange = () => {
    if (group && onUpdateGroup) {
      if (editName.trim() && editName !== group.name) {
        onUpdateGroup(group.id, { name: editName.trim() })
      } else if (!editName.trim()) {
        setEditName(group.name)
      }
    }
  }

  const handleToggleExtensionMembership = (ext: typeof filteredExtensions[0]) => {
    if (isCreateMode) {
      // In create mode, toggle selectedExtensions state
      setSelectedExtensions(prev => {
        const next = new Set(prev)
        if (next.has(ext.id)) {
          next.delete(ext.id)
        } else {
          next.add(ext.id)
        }
        return next
      })
    } else if (group && onAddExtension && onRemoveFromGroup) {
      // In edit mode, call actual handlers
      if (ext.isInGroup) {
        onRemoveFromGroup(group.id, ext.id)
      } else {
        onAddExtension(group.id, ext.id)
      }
    }
  }

  // Check if all extensions in group are enabled
  const allEnabled = extensions.length > 0 && extensions.every(ext => ext.enabled)
  const allDisabled = extensions.length > 0 && extensions.every(ext => !ext.enabled)

  // Toggle all extensions in group
  const handleToggleAll = () => {
    if (!onToggleExtension) return
    if (allEnabled) {
      // Disable all
      extensions.forEach(ext => {
        if (ext.enabled) onToggleExtension(ext.id)
      })
    } else {
      // Enable all
      extensions.forEach(ext => {
        if (!ext.enabled) onToggleExtension(ext.id)
      })
    }
  }

  // Handle create
  const handleCreate = () => {
    if (onCreate && editName.trim()) {
      onCreate(editName.trim(), selectedColor, Array.from(selectedExtensions))
      onClose()
    }
  }

  // Get icon to display (custom image or icon map)
  const groupIconUrl = (group as any)?.iconUrl
  const displayIcon = groupIconUrl ? (
    <img src={groupIconUrl} className="w-full h-full object-cover" alt="" />
  ) : (
    ICON_MAP[group?.icon || "folder"] || <Folder className="w-4 h-4" />
  )

  const canCreate = editName.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[95%] max-h-[95%] border border-punk-border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-punk-border/30 bg-punk-bg shrink-0">
          {/* Icon */}
          {isCreateMode ? (
            <div
              className="flex items-center justify-center w-10 h-10 border border-punk-border/50 bg-punk-bg-alt"
              style={{ color: selectedColor }}
            >
              {ICON_MAP.folder}
            </div>
          ) : (
            <div className="relative" ref={imageUploadRef}>
              <button
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="flex items-center justify-center w-10 h-10 border border-punk-border/50 bg-punk-bg-alt hover:border-punk-primary transition-colors overflow-hidden"
                style={{ color: group.color }}
                title="Upload icon image"
              >
                {displayIcon}
              </button>
              {showImageUpload && (
                <div className="absolute top-full left-0 mt-1 z-50 p-2 border border-punk-border bg-punk-bg-alt shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      fileInputRef.current?.click()
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[9px] font-punk-heading uppercase text-punk-text-secondary hover:text-punk-primary hover:bg-punk-bg transition-colors whitespace-nowrap"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    UPLOAD IMAGE
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Name input */}
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={isCreateMode ? undefined : handleNameChange}
            onKeyDown={(e) => {
              if (!isCreateMode && e.key === "Enter") {
                handleNameChange()
                e.currentTarget.blur()
              }
            }}
            placeholder="SECTOR NAME..."
            className="flex-1 h-10 px-3 font-punk-heading text-[11px] text-punk-text-primary uppercase bg-transparent border-b border-punk-border/50 focus:outline-none focus:border-punk-accent"
          />

          {/* Count badge */}
          <span className="font-punk-code text-[10px] text-punk-accent">
            [{isCreateMode ? selectedExtensions.size : extensions.length}]
          </span>

          {/* ON/OFF toggle for edit mode */}
          {isCreateMode ? null : (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (!onToggleExtension) return
                  extensions.forEach(ext => {
                    if (!ext.enabled) onToggleExtension(ext.id)
                  })
                }}
                disabled={extensions.length === 0 || allEnabled}
                className={cn(
                  "px-2 py-1 text-[8px] font-punk-heading transition-all",
                  allEnabled
                    ? "bg-punk-success text-white"
                    : "border border-punk-border/30 text-punk-text-muted hover:border-punk-success"
                )}
              >
                ON
              </button>
              <button
                onClick={() => {
                  if (!onToggleExtension) return
                  extensions.forEach(ext => {
                    if (ext.enabled) onToggleExtension(ext.id)
                  })
                }}
                disabled={extensions.length === 0 || allDisabled}
                className={cn(
                  "px-2 py-1 text-[8px] font-punk-heading transition-all",
                  allDisabled
                    ? "bg-punk-cta text-white"
                    : "border border-punk-border/30 text-punk-text-muted hover:border-punk-cta"
                )}
              >
                OFF
              </button>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-punk-border/30 bg-punk-bg shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="SEARCH_EXTENSIONS..."
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </div>

        {/* Extension List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredExtensions.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {filteredExtensions.map((ext) => (
                <div
                  key={ext.id}
                  onClick={() => handleToggleExtensionMembership(ext)}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2 cursor-pointer transition-all border",
                    ext.isInGroup
                      ? "border-punk-success/50 bg-punk-success/5 hover:border-punk-success"
                      : "border-punk-border/20 bg-punk-bg-alt hover:border-punk-primary/50"
                  )}
                >
                  {/* Status dot */}
                  <div
                    className={cn(
                      "absolute top-1 right-1 w-2 h-2 border border-punk-bg-alt z-10",
                      ext.enabled ? "bg-punk-success" : "bg-punk-text-muted"
                    )}
                  />
                  {/* Group icon badge - only show for in-group */}
                  {ext.isInGroup && (
                    <div
                      className="absolute bottom-1 right-1 w-4 h-4 rounded-sm flex items-center justify-center z-10 overflow-hidden"
                      style={{ backgroundColor: (group?.color || selectedColor) + "40" }}
                    >
                      {groupIconUrl ? (
                        <img src={groupIconUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span style={{ color: group?.color || selectedColor }}>
                          {ICON_MAP[group?.icon || "folder"] || <Folder className="w-2 h-2" />}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Icon */}
                  {ext.iconUrl ? (
                    <img src={ext.iconUrl} className="w-8 h-8 border border-punk-border/30 object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 border border-punk-border/30 bg-punk-bg flex items-center justify-center">
                      <Package className="w-4 h-4 text-punk-text-muted" />
                    </div>
                  )}
                  {/* Name */}
                  <span className={cn(
                    "font-punk-heading text-[6px] uppercase text-center truncate w-full mt-1",
                    ext.isInGroup ? "text-punk-text-primary" : "text-punk-text-muted"
                  )}>
                    {ext.name.substring(0, 12)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="font-punk-body text-base text-punk-text-muted">
                NO_MATCH_FOUND
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-punk-border/30 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 font-punk-heading text-[9px] text-punk-text-muted uppercase tracking-wide hover:text-punk-text-primary transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={isCreateMode ? handleCreate : onClose}
            disabled={isCreateMode && !canCreate}
            className={cn(
              "px-4 py-2 font-punk-heading text-[9px] uppercase tracking-wide transition-colors",
              (isCreateMode && canCreate) || !isCreateMode
                ? "bg-punk-primary text-white hover:bg-punk-primary/80"
                : "bg-punk-border/50 text-punk-text-muted cursor-not-allowed"
            )}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}
