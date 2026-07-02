import * as React from "react"
import { createPortal } from "react-dom"
import type { Extension } from "@/types"
import { cn } from "@/utils"
import {
  countCandidates,
  toggleSelection,
  visibleExtensions,
} from "./bisectWhitelistDialog.helpers"

export type BisectWhitelistDialogMode = "edit" | "start-bisect"

interface BisectWhitelistDialogProps {
  open: boolean
  mode: BisectWhitelistDialogMode
  extensions: Extension[]
  initialWhitelist: string[]
  onConfirm: (ids: string[]) => void
  onCancel: () => void
}

export function BisectWhitelistDialog({
  open,
  mode,
  extensions,
  initialWhitelist,
  onConfirm,
  onCancel,
}: BisectWhitelistDialogProps) {
  const [selected, setSelected] = React.useState<string[]>(initialWhitelist)

  React.useEffect(() => {
    if (open) setSelected(initialWhitelist)
  }, [open, initialWhitelist])

  if (!open) return null
  if (typeof document === "undefined") return null

  const visible = visibleExtensions(extensions)
  const selectedSet = new Set(selected)
  const tooFewCandidates = mode === "start-bisect" && countCandidates(extensions, selected) < 2

  const handleToggle = (id: string) => setSelected((prev) => toggleSelection(prev, id))

  const confirmLabel = mode === "start-bisect" ? "Start Bisect" : "Save"
  const title = mode === "start-bisect" ? "Start Bisect — Whitelist" : "Bisect Whitelist"

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-punk-bg/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-96 max-h-[80vh] flex flex-col border border-punk-primary bg-punk-surface-raised shadow-punk-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-punk-primary">
          <h3 className="flex-1 font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wider">
            {title}
          </h3>
        </div>

        <p className="px-4 py-2 font-punk-body text-[10px] text-punk-text-secondary leading-relaxed">
          Whitelisted extensions stay in their current state and are excluded from bisect.
        </p>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {visible.length === 0 && (
            <p className="px-2 py-3 font-punk-body text-[10px] text-punk-text-muted">
              No toggleable extensions found.
            </p>
          )}
          {visible.map((ext) => {
            const checked = selectedSet.has(ext.id)
            return (
              <label
                key={ext.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-punk-surface-soft cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(ext.id)}
                  aria-label={ext.name}
                />
                <span className="flex-1 font-punk-body text-[11px] text-punk-text-primary truncate">
                  {ext.name}
                </span>
                {!ext.enabled && (
                  <span className="font-punk-code text-[9px] uppercase text-punk-text-muted">
                    OFF
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {tooFewCandidates && (
          <p className="px-4 py-2 font-punk-body text-[10px] text-punk-warning border-t border-punk-warning/40">
            Need at least 2 candidates; remove items from the whitelist.
          </p>
        )}

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-punk-border/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-punk-heading text-[13px] text-punk-text-muted uppercase tracking-wider hover:text-punk-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={tooFewCandidates}
            className={cn(
              "px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider text-white bg-punk-primary hover:bg-punk-primary/90 transition-all",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
