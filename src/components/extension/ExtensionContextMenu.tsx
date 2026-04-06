import * as React from "react"
import { createPortal } from "react-dom"
import { Settings, Trash2, Power, PowerOff, Info } from "lucide-react"
import { useClickOutside } from "@/hooks/useClickOutside"

interface ExtensionContextMenuProps {
  show: boolean
  menuRef: React.RefObject<HTMLDivElement | null>
  menuPosition: { top: number; left: number }
  menuWidth: number
  extension: { enabled: boolean; optionsUrl: string | null }
  disableEnableControls: boolean
  disableRemove: boolean
  onToggle: () => void
  onOpenOptions?: () => void
  onRemove: () => void
  onShowDetails: () => void
  onClose: () => void
}

export function ExtensionContextMenu({
  show,
  menuRef,
  menuPosition,
  menuWidth,
  extension,
  disableEnableControls,
  disableRemove,
  onToggle,
  onOpenOptions,
  onRemove,
  onShowDetails,
  onClose
}: ExtensionContextMenuProps) {
  useClickOutside(menuRef, onClose, show)

  if (!show || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={menuRef as React.RefObject<HTMLDivElement>}
      className="fixed z-[90] border border-punk-border bg-punk-bg-alt py-1 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
      style={{ top: menuPosition.top, left: menuPosition.left, width: menuWidth }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (disableEnableControls) return
          onToggle()
          onClose()
        }}
        disabled={disableEnableControls}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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
            onClose()
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
          onShowDetails()
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg transition-colors"
      >
        <Info className="h-4 w-4" />
        DETAILS
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (disableRemove) return
          onRemove()
        }}
        disabled={disableRemove}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-body text-sm text-punk-cta hover:bg-punk-cta/10 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
        REMOVE
      </button>
    </div>,
    document.body
  )
}
