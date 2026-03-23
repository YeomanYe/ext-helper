import * as React from "react"
import { Settings, Trash2, Package, Power, PowerOff } from "lucide-react"
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
  const menuRef = React.useRef<HTMLDivElement>(null)

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

  // Card mode: horizontal layout with icon, info, and toggle switch
  // Compact mode: horizontal layout
  if (isCard) {
    // Card mode - horizontal layout with more details
    return (
      <div
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
          <h3 className="font-punk-heading text-[8px] text-punk-text-primary truncate uppercase tracking-wide" title={extension.name}>
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
            className="absolute right-0 top-full z-50 mt-1 w-44 border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
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
    )
  }

  // Compact mode - vertical layout with fixed size
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center justify-center p-3 border",
        "bg-punk-bg-alt",
        "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
        !extension.enabled && "opacity-50",
        "min-w-[84px] w-[84px] h-[84px]",
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
        <h3 className="font-punk-heading text-[6px] text-punk-text-primary text-center uppercase tracking-wide truncate" title={extension.name}>
          {extension.name.substring(0, 14)}
        </h3>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 w-40 border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
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
  )
}
