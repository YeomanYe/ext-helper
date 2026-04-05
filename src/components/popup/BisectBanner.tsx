import type { BisectSession, Extension } from "@/types"

interface BisectBannerProps {
  bisectSession: BisectSession
  resultExtension: Extension | null
  onGood: () => void
  onBad: () => void
  onCancel: () => void
  onRestore: () => void
}

export function BisectBanner({
  bisectSession,
  resultExtension,
  onGood,
  onBad,
  onCancel,
  onRestore
}: BisectBannerProps) {
  const isResolved = bisectSession.phase === "resolved"

  if (!bisectSession.active) return null

  return (
    <div className="flex-shrink-0 border-b border-punk-border/30 bg-punk-bg px-3 py-3">
      <div className="border border-punk-warning/40 bg-punk-bg-alt px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-punk-heading text-[12px] uppercase tracking-wider text-punk-warning">
              {isResolved ? "Bisect Resolved" : `Bisect Step ${bisectSession.step}`}
            </p>
            <p className="font-punk-body text-sm text-punk-text-secondary">
              {isResolved
                ? `Suspect: ${resultExtension?.name ?? bisectSession.resultId ?? "Unknown extension"}. Current state is preserved until you restore it.`
                : "Good means the issue disappeared. Bad means the issue is still present."}
            </p>
            <p className="font-punk-code text-[10px] uppercase tracking-wider text-punk-text-muted">
              Candidates {bisectSession.candidateIds.length} · Testing {bisectSession.currentTestIds.length}
            </p>
          </div>
          {!isResolved && (
            <div className="flex items-center gap-2">
              <button
                onClick={onGood}
                className="border border-punk-success/50 bg-punk-success/10 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-success transition-colors hover:bg-punk-success/20"
              >
                Good
              </button>
              <button
                onClick={onBad}
                className="border border-punk-cta/50 bg-punk-cta/10 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-cta transition-colors hover:bg-punk-cta/20"
              >
                Bad
              </button>
              <button
                onClick={onCancel}
                className="border border-punk-border/30 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-muted transition-colors hover:border-punk-accent/50 hover:text-punk-text-primary"
              >
                Cancel
              </button>
            </div>
          )}
          {isResolved && (
            <div className="flex items-center gap-2">
              <button
                onClick={onRestore}
                className="border border-punk-border/30 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-muted transition-colors hover:border-punk-accent/50 hover:text-punk-text-primary"
              >
                Restore Original
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
