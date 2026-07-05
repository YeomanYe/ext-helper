import * as React from "react"
import { createPortal } from "react-dom"
import { Check, Package, Search } from "lucide-react"
import type { Extension } from "@/types"
import { cn } from "@/utils"
import {
  countCandidates,
  filterExtensionsByQuery,
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
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setSelected(initialWhitelist)
      setQuery("")
    }
  }, [open, initialWhitelist])

  if (!open) return null
  if (typeof document === "undefined") return null

  const visible = visibleExtensions(extensions)
  const filtered = filterExtensionsByQuery(visible, query)
  const selectedSet = new Set(selected)
  const selectedExtensions = visible.filter((e) => selectedSet.has(e.id))
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
        className="flex max-h-[80vh] w-[26rem] flex-col border border-punk-primary bg-punk-surface-raised shadow-punk-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-punk-primary px-4 py-3">
          <h3 className="flex-1 font-punk-heading text-[10px] uppercase tracking-wider text-punk-text-primary">
            {title}
          </h3>
          <span className="font-punk-code text-[10px] uppercase tracking-wider text-punk-text-muted">
            {selected.length}/{visible.length}
          </span>
        </div>

        <p className="px-4 py-2 font-punk-body text-[10px] leading-relaxed text-punk-text-secondary">
          Whitelisted extensions stay in their current state and are excluded from bisect.
        </p>

        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 border border-punk-border/40 bg-punk-surface-inset/70 px-2 py-1.5 focus-within:border-punk-accent/70">
            <Search className="h-3.5 w-3.5 shrink-0 text-punk-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search extensions..."
              aria-label="Search extensions"
              className="w-full bg-transparent font-punk-body text-[11px] text-punk-text-primary placeholder:text-punk-text-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-y border-punk-border/30 bg-punk-surface-soft/70 px-3 py-2">
          {selectedExtensions.length === 0 ? (
            <div className="flex h-8 items-center">
              <span className="font-punk-heading text-[10px] uppercase tracking-wider text-punk-text-muted">
                No whitelisted extensions
              </span>
            </div>
          ) : (
            selectedExtensions.map((ext) => (
              <button
                key={ext.id}
                type="button"
                onClick={() => handleToggle(ext.id)}
                aria-label={`Remove ${ext.name} from whitelist`}
                title={ext.name}
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-punk-success bg-punk-surface-raised transition-colors hover:border-punk-cta"
              >
                {ext.iconUrl ? (
                  <img src={ext.iconUrl} className="h-full w-full object-cover" alt="" />
                ) : (
                  <Package className="h-4 w-4 text-punk-text-muted" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2">
          {visible.length === 0 && (
            <p className="px-1 py-3 font-punk-body text-[10px] text-punk-text-muted">
              No toggleable extensions found.
            </p>
          )}
          {visible.length > 0 && filtered.length === 0 && (
            <p className="px-1 py-3 font-punk-body text-[10px] text-punk-text-muted">
              No extensions match &quot;{query}&quot;.
            </p>
          )}
          {filtered.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {filtered.map((ext) => {
                const checked = selectedSet.has(ext.id)
                return (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => handleToggle(ext.id)}
                    aria-pressed={checked}
                    aria-label={ext.name}
                    title={ext.name}
                    className={cn(
                      "relative flex flex-col items-center gap-1 border px-1 py-2 text-center transition-colors",
                      checked
                        ? "border-punk-accent bg-punk-accent/10"
                        : "border-punk-border/40 bg-punk-surface-inset/40 hover:border-punk-accent/50 hover:bg-punk-surface-soft"
                    )}
                  >
                    <div className="relative">
                      {ext.iconUrl ? (
                        <img
                          src={ext.iconUrl}
                          alt=""
                          className="h-8 w-8 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center bg-punk-surface-soft">
                          <Package className="h-4 w-4 text-punk-text-muted" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-punk-bg-alt",
                          ext.enabled ? "bg-punk-success" : "bg-punk-text-muted"
                        )}
                      />
                    </div>
                    <span className="line-clamp-2 w-full break-words font-punk-body text-[10px] leading-tight text-punk-text-primary">
                      {ext.name}
                    </span>
                    {checked && (
                      <Check
                        className="absolute right-0.5 top-0.5 h-3 w-3 text-punk-accent"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {tooFewCandidates && (
          <p className="border-t border-punk-warning/40 px-4 py-2 font-punk-body text-[10px] text-punk-warning">
            Need at least 2 candidates; remove items from the whitelist.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-punk-border/30 px-4 py-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-muted hover:text-punk-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={tooFewCandidates}
            className={cn(
              "bg-punk-primary px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider text-white transition-all hover:bg-punk-primary/90",
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
