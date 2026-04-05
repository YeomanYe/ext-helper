import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/utils"

interface ExtensionsActionsMenuProps {
  enabledExtensionCount: number
  isBisectActive: boolean
  isBisectResolved: boolean
  canUndo: boolean
  canRedo: boolean
  undoCount: number
  redoCount: number
  onStartBisect: () => void
  onBisectGood: () => void
  onBisectBad: () => void
  onCancelBisect: () => void
  onEnableAll: () => void
  onDisableAll: () => void
  onUndo: () => void
  onRedo: () => void
}

export function ExtensionsActionsMenu({
  enabledExtensionCount,
  isBisectActive,
  isBisectResolved,
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onStartBisect,
  onBisectGood,
  onBisectBad,
  onCancelBisect,
  onEnableAll,
  onDisableAll,
  onUndo,
  onRedo
}: ExtensionsActionsMenuProps) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative ml-auto" ref={menuRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 items-center gap-1 border border-punk-border/30 bg-punk-bg-alt px-2 text-[11px] font-punk-heading uppercase tracking-wider text-punk-text-muted transition-all hover:border-punk-accent/50 hover:text-punk-accent"
      >
        ACTIONS
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 border border-punk-border bg-punk-bg-alt shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          {!isBisectActive && (
            <button
              onClick={() => {
                onStartBisect()
                setOpen(false)
              }}
              disabled={enabledExtensionCount < 2}
              className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start Bisect
            </button>
          )}
          {isBisectActive && !isBisectResolved && (
            <>
              <button
                onClick={() => {
                  onBisectGood()
                  setOpen(false)
                }}
                className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-success transition-colors hover:bg-punk-bg"
              >
                Bisect Good
              </button>
              <button
                onClick={() => {
                  onBisectBad()
                  setOpen(false)
                }}
                className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-cta transition-colors hover:bg-punk-bg"
              >
                Bisect Bad
              </button>
              <button
                onClick={() => {
                  onCancelBisect()
                  setOpen(false)
                }}
                className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary"
              >
                Cancel Bisect
              </button>
            </>
          )}
          <button
            onClick={() => {
              onEnableAll()
              setOpen(false)
            }}
            disabled={isBisectActive}
            className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enable All
          </button>
          <button
            onClick={() => {
              onDisableAll()
              setOpen(false)
            }}
            disabled={isBisectActive}
            className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Disable All
          </button>
          <button
            onClick={() => {
              onUndo()
              setOpen(false)
            }}
            disabled={!canUndo || isBisectActive}
            className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Undo [{undoCount}]
          </button>
          <button
            onClick={() => {
              onRedo()
              setOpen(false)
            }}
            disabled={!canRedo || isBisectActive}
            className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Redo [{redoCount}]
          </button>
        </div>
      )}
    </div>
  )
}
