import * as React from "react"
import { Settings, Trash2, Package, Shield } from "lucide-react"
import { cn } from "@/utils"
import type { Extension, ViewMode } from "@/types"
import { Switch, ConfirmDialog } from "@/components/common"
import { useContextMenuPosition } from "@/hooks/useContextMenuPosition"
import { ExtensionContextMenu } from "@/components/extension/ExtensionContextMenu"
import { ExtensionDetailsModal } from "@/components/extension/ExtensionDetailsModal"

interface ExtensionCardProps {
  extension: Extension
  onToggle: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
  disableEnableControls?: boolean
  disableRemove?: boolean
  viewMode?: ViewMode
  className?: string
}

export const ExtensionCard = React.memo(function ExtensionCard({
  extension,
  onToggle,
  onOpenOptions,
  onRemove,
  disableEnableControls = false,
  disableRemove = false,
  viewMode = "compact",
  className
}: ExtensionCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showConfirmRemove, setShowConfirmRemove] = React.useState(false)
  const [showDetails, setShowDetails] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const isCard = viewMode === "card"
  const isDetail = viewMode === "detail"
  const menuWidth = viewMode === "compact" ? 160 : 176
  const menuHeight = extension.optionsUrl ? 156 : 120

  const handleCloseMenu = React.useCallback(() => setShowMenu(false), [])

  const menuPosition = useContextMenuPosition({
    cardRef,
    showMenu,
    isDetail,
    menuWidth,
    menuHeight,
    onClose: handleCloseMenu
  })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(true)
  }

  const handleRemoveClick = () => {
    setShowMenu(false)
    setShowConfirmRemove(true)
  }

  const handleShowDetails = () => {
    setShowMenu(false)
    setShowDetails(true)
  }

  const handleToggle = React.useCallback(() => {
    onToggle(extension.id)
  }, [onToggle, extension.id])

  const handleOpenOptions = React.useCallback(() => {
    onOpenOptions?.(extension.id)
  }, [onOpenOptions, extension.id])

  const handleConfirmRemove = () => {
    onRemove?.(extension.id)
    setShowConfirmRemove(false)
  }

  const isDimmed = !extension.enabled && !showMenu && !showConfirmRemove

  const contextMenu = (
    <ExtensionContextMenu
      show={showMenu}
      menuRef={menuRef}
      menuPosition={menuPosition}
      menuWidth={menuWidth}
      extension={extension}
      disableEnableControls={disableEnableControls}
      disableRemove={disableRemove}
      onToggle={handleToggle}
      onOpenOptions={handleOpenOptions}
      onRemove={handleRemoveClick}
      onShowDetails={handleShowDetails}
      onClose={handleCloseMenu}
    />
  )

  const confirmDialog = (
    <ConfirmDialog
      isOpen={showConfirmRemove}
      title="REMOVE EXTENSION"
      message={`Are you sure you want to remove "${extension.name}"? This action cannot be undone.`}
      confirmText="REMOVE"
      variant="danger"
      onConfirm={handleConfirmRemove}
      onCancel={() => setShowConfirmRemove(false)}
    />
  )

  const detailsModal = (
    <ExtensionDetailsModal
      show={showDetails}
      extension={extension}
      onClose={() => setShowDetails(false)}
      onOpenOptions={handleOpenOptions}
    />
  )

  if (isDetail) {
    return (
      <div
        ref={cardRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "group relative flex flex-col border transition-all",
          "bg-punk-bg-alt",
          "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          isDimmed && "opacity-60",
          "w-full",
          "punk-border",
          className
        )}
        onContextMenu={handleContextMenu}
      >
        <div className="p-3">
          <div className="flex items-start gap-3 mb-3">
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
                  disabled={disableEnableControls}
                  onCheckedChange={handleToggle}
                />
              </div>

              {extension.description && (
                <p className="font-punk-body text-sm text-punk-text-secondary mt-1.5">
                  {extension.description}
                </p>
              )}

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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-punk-border/20">
            {extension.optionsUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenOptions()
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
                if (disableRemove) return
                handleRemoveClick()
              }}
              disabled={disableRemove}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-punk-heading text-punk-text-muted hover:text-punk-cta border border-punk-border/30 hover:border-punk-cta/50 transition-all disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" />
              REMOVE
            </button>
          </div>
        </div>

        {contextMenu}
        {confirmDialog}
        {detailsModal}
      </div>
    )
  }

  if (isCard) {
    return (
      <div
        ref={cardRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "group relative flex items-center gap-3 p-2.5 border",
          "bg-punk-bg-alt",
          "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          isDimmed && "opacity-50",
          "w-full min-h-[60px]",
          "punk-border",
          className
        )}
        onContextMenu={handleContextMenu}
      >
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
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 border border-punk-bg",
              extension.enabled ? "bg-punk-success animate-pulse-neon" : "bg-punk-text-muted"
            )}
          />
        </div>

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

        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={extension.enabled}
            disabled={disableEnableControls}
            onCheckedChange={handleToggle}
          />
        </div>

        {contextMenu}
        {confirmDialog}
        {detailsModal}
      </div>
    )
  }

  return (
    <div
      ref={cardRef as React.RefObject<HTMLDivElement>}
      className={cn(
        "group relative flex flex-col items-center justify-center p-3 border",
        "bg-punk-bg-alt",
        "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
        isDimmed && "opacity-50",
        "aspect-square",
        "punk-border",
        className
      )}
      onContextMenu={handleContextMenu}
      onClick={() => {
        if (disableEnableControls) return
        handleToggle()
      }}
    >
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
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-punk-bg-alt",
            extension.enabled ? "bg-punk-success animate-pulse-neon" : "bg-punk-text-muted"
          )}
        />
      </div>

      <div className="w-full mt-1">
        <h3 className="font-punk-heading text-[10px] text-punk-text-primary text-center uppercase tracking-wider truncate" title={extension.name}>
          {extension.name.substring(0, 14)}
        </h3>
      </div>

      {contextMenu}
      {confirmDialog}
      {detailsModal}
    </div>
  )
})
