import * as React from "react"
import { X, Plus, Folder, Package, Star, Heart, Bookmark, Tag, Flag, Briefcase, Code, Globe, Lock, Settings, Wrench, Zap, Flame, Gem, Crown, Target, Image, Upload } from "lucide-react"
import { cn } from "@/utils"
import { SearchBar } from "@/components/popup"
import type { Group, Extension, FilterType } from "@/types"

const ICON_MAP: Record<string, React.ReactNode> = {
  folder: <Folder className="w-4 h-4" />,
  star: <Star className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  bookmark: <Bookmark className="w-4 h-4" />,
  tag: <Tag className="w-4 h-4" />,
  flag: <Flag className="w-4 h-4" />,
  briefcase: <Briefcase className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  globe: <Globe className="w-4 h-4" />,
  lock: <Lock className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  tool: <Wrench className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  bolt: <Zap className="w-4 h-4" />,
  flame: <Flame className="w-4 h-4" />,
  gem: <Gem className="w-4 h-4" />,
  crown: <Crown className="w-4 h-4" />,
  target: <Target className="w-4 h-4" />,
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
  onCreate?: (name: string, color: string, extensionIds: string[], iconUrl?: string) => void
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
  const [editIconUrl, setEditIconUrl] = React.useState((group as any)?.iconUrl || "")
  const [selectedExtensions, setSelectedExtensions] = React.useState<Set<string>>(new Set())
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (isCreateMode) {
          setEditIconUrl(dataUrl)
        } else if (group && onUpdateGroup) {
          onUpdateGroup(group.id, { icon: "custom", iconUrl: dataUrl })
        }
      }
      reader.readAsDataURL(file)
    }
  }

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

  // Handle create
  const handleCreate = () => {
    if (onCreate && editName.trim()) {
      onCreate(editName.trim(), selectedColor, Array.from(selectedExtensions), editIconUrl)
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
        className="w-[480px] max-h-[95%] border border-punk-border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Icon with name input and search */}
        <div className="flex gap-4 px-4 py-3 border-b border-punk-border/30 bg-punk-bg shrink-0">
          {/* Icon Upload */}
          <div className="flex-shrink-0 flex items-center">
            {isCreateMode ? (
              <div
                className="relative w-[96px] h-[96px] border border-punk-border/50 bg-punk-bg rounded overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Image className="h-6 w-6 text-punk-text-muted mb-1" />
                  <span className="text-[6px] text-punk-text-muted uppercase">UPLOAD</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative w-[96px] h-[96px] border border-punk-border/50 bg-punk-bg rounded overflow-hidden group">
                {(group as any)?.iconUrl ? (
                  <>
                    <img
                      src={(group as any).iconUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-punk-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer p-2 text-punk-text-muted hover:text-punk-accent transition-colors">
                        <Upload className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-punk-bg-alt transition-colors"
                    style={{ color: group.color }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {ICON_MAP[group?.icon || "folder"]}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Name input + Count/Buttons, then Search bar below */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Name input row with label */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
                  SECTOR_NAME
                </label>
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
                  placeholder="e.g., Work Extensions"
                  className="punk-input w-full h-10 px-3 text-sm"
                />
              </div>

              {/* Count badge */}
              <div className="pt-5">
                <span className="font-punk-code text-[10px] text-punk-accent">
                  [{isCreateMode ? selectedExtensions.size : extensions.length}]
                </span>
              </div>

                          </div>

            {/* Search bar */}
            <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1">
              SEARCH & FILTER
            </label>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="SEARCH_EXTENSIONS..."
              activeFilter={filter}
              onFilterChange={setFilter}
            />
          </div>
        </div>

        {/* Extension List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredExtensions.length > 0 ? (
            <div className="space-y-1.5">
              {filteredExtensions.map((ext) => (
                <div
                  key={ext.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-all border rounded",
                    ext.isInGroup
                      ? "border-punk-success/50 bg-punk-success/5 hover:border-punk-success"
                      : "border-punk-border/20 bg-punk-bg-alt hover:border-punk-primary/50"
                  )}
                >
                  {/* Checkbox to add/remove from group */}
                  <div
                    onClick={() => handleToggleExtensionMembership(ext)}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                      ext.isInGroup
                        ? "border-punk-success bg-punk-success/20"
                        : "border-punk-border/30"
                    )}
                  >
                    {ext.isInGroup && (
                      <span className="text-punk-success text-[8px]">✓</span>
                    )}
                  </div>
                  {/* Icon */}
                  <div className="w-6 h-6 flex-shrink-0">
                    {ext.iconUrl ? (
                      <img src={ext.iconUrl} className="w-6 h-6 border border-punk-border/30 object-cover rounded-sm" alt="" />
                    ) : (
                      <div className="w-6 h-6 border border-punk-border/30 bg-punk-bg flex items-center justify-center rounded-sm">
                        <Package className="w-3 h-3 text-punk-text-muted" />
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <span
                    onClick={() => handleToggleExtensionMembership(ext)}
                    className={cn(
                      "flex-1 font-punk-heading text-[8px] uppercase truncate",
                      ext.isInGroup ? "text-punk-text-primary" : "text-punk-text-muted"
                    )}
                  >
                    {ext.name}
                  </span>
                  {/* Enable/Disable toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onToggleExtension) onToggleExtension(ext.id)
                    }}
                    className={cn(
                      "w-8 h-4 rounded text-[6px] font-punk-heading uppercase transition-all flex-shrink-0",
                      ext.enabled
                        ? "bg-punk-success/20 text-punk-success border border-punk-success/50"
                        : "bg-punk-text-muted/20 text-punk-text-muted border border-punk-text-muted/50"
                    )}
                  >
                    {ext.enabled ? "ON" : "OFF"}
                  </button>
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
