import * as React from "react"
import { Settings, Trash2, Package, Power, PowerOff, Shield, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/utils"
import type { Extension, ViewMode } from "@/types"
import { Switch, ConfirmDialog } from "@/components/common"

interface ExtensionCardProps {
  extension: Extension
  onToggle: () => void
  onOpenOptions?: () => void
  onRemove?: () => void
  viewMode?: ViewMode
  className?: string
}

export function ExtensionCard({
  extension,
  onToggle,
  onOpenOptions,
  onRemove,
  viewMode = "compact",
  className
}: ExtensionCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showConfirmRemove, setShowConfirmRemove] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState<{ horizontal: "left" | "right"; vertical: "top" | "bottom" }>({ horizontal: "right", vertical: "bottom" })
  const menuRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)

  // Calculate menu position based on card location
  React.useEffect(() => {
    if (showMenu && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const menuWidth = 176
      const menuHeight = 120
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 10

      let horizontal: "left" | "right" = "right"
      let vertical: "top" | "bottom" = "bottom"

      if (rect.right + menuWidth > viewportWidth - padding) {
        horizontal = "left"
      }

      if (rect.bottom + menuHeight > viewportHeight - padding) {
        vertical = "top"
      }

      setMenuPosition({ horizontal, vertical })
    }
  }, [showMenu])

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(true)
  }

  const handleRemoveClick = () => {
    setShowMenu(false)
    setShowConfirmRemove(true)
  }

  const handleConfirmRemove = () => {
    onRemove?.()
    setShowConfirmRemove(false)
  }

  const isCard = viewMode === "card"
  const isDetail = viewMode === "detail"

  // Card mode: horizontal layout with icon, info, and toggle switch
  // Compact mode: vertical layout with fixed size
  // Detail mode: expanded layout with full info

  if (isDetail) {
    // Detail mode - expanded layout with full info
    return (
      <div
        ref={cardRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "group relative flex flex-col border transition-all",
          "bg-punk-bg-alt",
          "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          !extension.enabled && "opacity-60",
          "w-full",
          "punk-border",
          className
        )}
        onContextMenu={handleContextMenu}
      >
        {/* Content */}
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Extension Icon */}
            <div className="relative flex-shrink-0">
              {extension.iconUrl ? (
                <img
                  src={extension.iconUrl}
                  alt={extension.name}
                  className="w-14 h-14 border border-punk-border object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-14 h-14 flex items-center justify-center border border-punk-border bg-punk-bg">
                  <Package className="w-7 h-7 text-punk-text-muted" />
                </div>
              )}
              {/* Status dot */}
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-punk-bg-alt rounded-full",
                  extension.enabled ? "bg-punk-success animate-pulse-neon" : "bg-punk-text-muted"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-punk-heading text-[11px] text-punk-text-primary uppercase tracking-wider" title={extension.name}>
                    {extension.name}
                  </h3>
                  <p className="font-punk-code text-[10px] text-punk-accent mt-0.5">
                    v{extension.version}
                  </p>
                </div>
                <Switch
                  checked={extension.enabled}
                  onCheckedChange={() => onToggle()}
                />
              </div>

              {extension.description && (
                <p className="font-punk-body text-sm text-punk-text-secondary mt-1.5">
                  {extension.description}
                </p>
              )}

              {/* Status line */}
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "px-2 py-1 text-[10px] font-punk-heading uppercase border tracking-wider",
                  extension.enabled
                    ? "text-punk-success border-punk-success/50 bg-punk-success/10"
                    : "text-punk-text-muted border-punk-border/30"
                )}>
                  {extension.enabled ? "ACTIVE" : "INACTIVE"}
                </span>
                <span className="font-punk-code text-[10px] text-punk-text-muted uppercase">
                  {extension.installType}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="border border-punk-border/30 rounded bg-punk-bg/50 mb-2">
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-punk-border/20">
              <Shield className="w-3 h-3 text-punk-accent" />
              <span className="font-punk-heading text-[11px] text-punk-text-muted uppercase">
                PERMISSIONS ({extension.permissions.length})
              </span>
            </div>
            <div className="px-2 py-2">
              <div className="flex flex-wrap gap-1">
                {extension.permissions.slice(0, 6).map((perm, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 text-[10px] font-punk-code text-punk-text-secondary bg-punk-bg border border-punk-border/20"
                  >
                    {perm.substring(0, 15)}
                  </span>
                ))}
                {extension.permissions.length > 6 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-punk-code text-punk-accent">
                    +{extension.permissions.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-punk-border/20">
            {extension.optionsUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenOptions?.()
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-punk-heading text-punk-text-muted hover:text-punk-accent border border-punk-border/30 hover:border-punk-accent/50 transition-all"
              >
                <Settings className="w-3 h-3" />
                OPTIONS
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveClick()
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-punk-heading text-punk-text-muted hover:text-punk-cta border border-punk-border/30 hover:border-punk-cta/50 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              REMOVE
            </button>
          </div>
        </div>

        {/* Context Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className={cn("absolute z-50 w-44 border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]", menuPosition.horizontal === "right" ? "right-0" : "left-0", menuPosition.vertical === "bottom" ? "top-full mt-1" : "bottom-full mb-1", !extension.enabled && "!opacity-100")}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
                setShowMenu(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
            >
              {extension.enabled ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  DISABLE
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  ENABLE
                </>
              )}
            </button>
            {extension.optionsUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenOptions?.()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
              >
                <Settings className="h-4 w-4" />
                OPTIONS
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveClick()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-cta hover:bg-punk-cta/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              REMOVE
            </button>
          </div>
        )}

        {/* Confirm Remove Dialog */}
        <div className={cn(!extension.enabled && "!opacity-100")}>
          <ConfirmDialog
            isOpen={showConfirmRemove}
            title="REMOVE EXTENSION"
            message={`Are you sure you want to remove "${extension.name}"? This action cannot be undone.`}
            confirmText="REMOVE"
            variant="danger"
            onConfirm={handleConfirmRemove}
            onCancel={() => setShowConfirmRemove(false)}
          />
        </div>
      </div>
    )
  }

  if (isCard) {
    // Card mode - horizontal layout with more details
    return (
      <div
        ref={cardRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "group relative flex items-center gap-3 p-2.5 border",
          "bg-punk-bg-alt",
          "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          !extension.enabled && "opacity-50",
          "w-full min-h-[60px]",
          "punk-border",
          className
        )}
        onContextMenu={handleContextMenu}
      >
        {/* Extension Icon with status indicator */}
        <div className="relative flex-shrink-0">
          {extension.iconUrl ? (
            <img
              src={extension.iconUrl}
              alt={extension.name}
              className="w-10 h-10 border border-punk-border object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center border border-punk-border bg-punk-bg">
              <Package className="w-5 h-5 text-punk-text-muted" />
            </div>
          )}
          {/* Status dot */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 border border-punk-bg",
              extension.enabled ? "bg-punk-success animate-pulse-neon" : "bg-punk-text-muted"
            )}
          />
        </div>

        {/* Extension Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-punk-heading text-[12px] text-punk-text-primary truncate uppercase tracking-wider" title={extension.name}>
            {extension.name}
          </h3>
          {extension.description && (
            <p className="font-punk-body text-sm text-punk-text-secondary truncate mt-0.5" title={extension.description}>
              {extension.description}
            </p>
          )}
          <p className="font-punk-code text-[10px] text-punk-accent mt-0.5">
            v{extension.version}
          </p>
        </div>

        {/* Toggle Switch */}
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={extension.enabled}
            onCheckedChange={() => onToggle()}
          />
        </div>

        {/* Context Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className={cn("absolute z-50 w-44 border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]", menuPosition.horizontal === "right" ? "right-0" : "left-0", menuPosition.vertical === "bottom" ? "top-full mt-1" : "bottom-full mb-1", !extension.enabled && "!opacity-100")}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
                setShowMenu(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
            >
              {extension.enabled ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  DISABLE
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  ENABLE
                </>
              )}
            </button>
            {extension.optionsUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenOptions?.()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
              >
                <Settings className="h-4 w-4" />
                OPTIONS
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveClick()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-cta hover:bg-punk-cta/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              REMOVE
            </button>
          </div>
        )}

        {/* Confirm Remove Dialog */}
        <div className={cn(!extension.enabled && "!opacity-100")}>
          <ConfirmDialog
            isOpen={showConfirmRemove}
            title="REMOVE EXTENSION"
            message={`Are you sure you want to remove "${extension.name}"? This action cannot be undone.`}
            confirmText="REMOVE"
            variant="danger"
            onConfirm={handleConfirmRemove}
            onCancel={() => setShowConfirmRemove(false)}
          />
        </div>
      </div>
    )
  }

  // Compact mode - vertical layout with fixed size
  return (
    <div
      ref={cardRef as React.RefObject<HTMLDivElement>}
      className={cn(
        "group relative flex flex-col items-center justify-center p-3 border",
        "bg-punk-bg-alt",
        "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
        !extension.enabled && "opacity-50",
        "aspect-square",
        "punk-border",
        className
      )}
      onContextMenu={handleContextMenu}
      onClick={() => onToggle()}
    >
      {/* Extension Icon */}
      <div className="relative flex-shrink-0">
        {extension.iconUrl ? (
          <img
            src={extension.iconUrl}
            alt={extension.name}
            className="w-10 h-10 border border-punk-border object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center border border-punk-border bg-punk-bg">
            <Package className="w-5 h-5 text-punk-text-muted" />
          </div>
        )}
        {/* Status dot */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-punk-bg-alt",
            extension.enabled ? "bg-punk-success animate-pulse-neon" : "bg-punk-text-muted"
          )}
        />
      </div>

      {/* Extension Name - truncated */}
      <div className="w-full mt-1">
        <h3 className="font-punk-heading text-[10px] text-punk-text-primary text-center uppercase tracking-wider truncate" title={extension.name}>
          {extension.name.substring(0, 14)}
        </h3>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className={cn("absolute z-50 w-40 border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]", menuPosition.horizontal === "right" ? "right-0" : "left-0", menuPosition.vertical === "bottom" ? "top-full mt-1" : "bottom-full mb-1", !extension.enabled && "!opacity-100")}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onToggle()
              setShowMenu(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
          >
            {extension.enabled ? (
              <>
                <PowerOff className="h-4 w-4" />
                DISABLE
              </>
            ) : (
              <>
                <Power className="h-4 w-4" />
                ENABLE
              </>
            )}
          </button>
          {extension.optionsUrl && (
            <button
              onClick={() => {
                onOpenOptions?.()
                setShowMenu(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
            >
              <Settings className="h-4 w-4" />
              OPTIONS
            </button>
          )}
          <button
            onClick={handleRemoveClick}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-cta hover:bg-punk-cta/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            REMOVE
          </button>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      <div className={cn(!extension.enabled && "!opacity-100")}>
        <ConfirmDialog
          isOpen={showConfirmRemove}
          title="REMOVE EXTENSION"
          message={`Are you sure you want to remove "${extension.name}"? This action cannot be undone.`}
          confirmText="REMOVE"
          variant="danger"
          onConfirm={handleConfirmRemove}
          onCancel={() => setShowConfirmRemove(false)}
        />
      </div>
    </div>
  )
}
