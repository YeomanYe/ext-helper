import * as React from "react"
import { createPortal } from "react-dom"
import { Bot, Check, Package } from "lucide-react"
import type { Extension, GroupSuggestion } from "@/types"
import { cn } from "@/utils"

interface GroupSuggestionDialogProps {
  isOpen: boolean
  groupName: string
  suggestions: GroupSuggestion[]
  extensions: Extension[]
  currentMemberIds: Set<string>
  selectedIds: Set<string>
  onToggleSelection: (extensionId: string) => void
  onConfirm: (extensionIds: string[]) => void
  onCancel: () => void
}

export function GroupSuggestionDialog({
  isOpen,
  groupName,
  suggestions,
  extensions,
  currentMemberIds,
  selectedIds,
  onToggleSelection,
  onConfirm,
  onCancel,
}: GroupSuggestionDialogProps) {
  const extensionById = React.useMemo(
    () => new Map(extensions.map((extension) => [extension.id, extension] as const)),
    [extensions]
  )

  const visibleSuggestions = React.useMemo(
    () =>
      suggestions
        .map((suggestion) => ({
          suggestion,
          extension: extensionById.get(suggestion.extensionId),
          isCurrentMember: currentMemberIds.has(suggestion.extensionId),
          isSelected: selectedIds.has(suggestion.extensionId),
        }))
        .filter((entry) => entry.extension),
    [currentMemberIds, extensionById, selectedIds, suggestions]
  )

  const selectedExtensionIds = visibleSuggestions
    .filter((entry) => entry.isSelected && !entry.isCurrentMember)
    .map((entry) => entry.suggestion.extensionId)

  if (!isOpen || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-punk-bg/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[520px] w-[440px] flex-col overflow-hidden border border-punk-accent/60 bg-punk-surface-raised shadow-punk-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-punk-accent/40 px-4 py-3">
          <Bot className="h-4 w-4 text-punk-accent" />
          <div className="min-w-0 flex-1">
            <h3 className="font-punk-heading text-[12px] uppercase tracking-wider text-punk-text-primary">
              AI SUGGESTIONS
            </h3>
            <p className="truncate font-punk-body text-[10px] text-punk-text-muted">
              Review extensions for {groupName}
            </p>
          </div>
          <span className="font-punk-code text-[11px] text-punk-accent">
            {visibleSuggestions.length}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {visibleSuggestions.length > 0 ? (
            <div className="space-y-2">
              {visibleSuggestions.map(({ suggestion, extension, isCurrentMember, isSelected }) => {
                if (!extension) return null
                const checked = isCurrentMember || isSelected

                return (
                  <button
                    key={suggestion.extensionId}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`${extension.name}: ${suggestion.reason}`}
                    disabled={isCurrentMember}
                    onClick={() => onToggleSelection(suggestion.extensionId)}
                    className={cn(
                      "flex w-full items-start gap-3 border p-3 text-left transition-all",
                      isCurrentMember
                        ? "cursor-not-allowed border-punk-success/40 bg-punk-success/5 text-punk-text-muted"
                        : checked
                          ? "border-punk-accent bg-punk-accent/10 text-punk-text-primary"
                          : "border-punk-border/30 bg-punk-surface-soft/70 text-punk-text-secondary hover:border-punk-accent/50"
                    )}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-transparent bg-punk-surface-raised">
                      {extension.iconUrl ? (
                        <img
                          src={extension.iconUrl}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-punk-text-muted" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-punk-heading text-[12px] uppercase text-punk-text-primary">
                          {extension.name}
                        </span>
                        {isCurrentMember && (
                          <span className="shrink-0 font-punk-heading text-[9px] uppercase text-punk-success">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 font-punk-body text-[11px] leading-snug text-punk-text-muted">
                        {suggestion.reason}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "mt-1 flex h-5 w-5 shrink-0 items-center justify-center border",
                        checked
                          ? "border-punk-accent bg-punk-accent text-punk-bg"
                          : "border-punk-border/50 bg-punk-surface-inset"
                      )}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center">
              <p className="font-punk-body text-[12px] uppercase text-punk-text-muted">
                NO MATCHING EXTENSIONS
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-punk-border/30 px-4 py-3">
          <span className="font-punk-body text-[11px] uppercase text-punk-text-muted">
            {selectedExtensionIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-muted transition-colors hover:text-punk-text-primary"
            >
              CANCEL
            </button>
            <button
              type="button"
              disabled={selectedExtensionIds.length === 0}
              onClick={() => onConfirm(selectedExtensionIds)}
              className={cn(
                "px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider transition-colors",
                selectedExtensionIds.length > 0
                  ? "bg-punk-accent text-punk-bg hover:bg-punk-accent/80"
                  : "cursor-not-allowed bg-punk-border/50 text-punk-text-muted"
              )}
            >
              ADD SELECTED
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
