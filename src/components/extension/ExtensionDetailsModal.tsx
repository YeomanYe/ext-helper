import { createPortal } from "react-dom"
import { Package, Shield, X, ExternalLink } from "lucide-react"
import { cn } from "@/utils"
import type { Extension } from "@/types"

interface ExtensionDetailsModalProps {
  show: boolean
  extension: Extension
  onClose: () => void
  onOpenOptions?: () => void
}

export function ExtensionDetailsModal({
  show,
  extension,
  onClose,
  onOpenOptions
}: ExtensionDetailsModalProps) {
  if (!show || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-punk-bg/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-punk-primary bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-punk-border/30 px-4 py-3">
          <div className="flex items-center gap-3">
            {extension.iconUrl ? (
              <img
                src={extension.iconUrl}
                alt={extension.name}
                className="h-10 w-10 border border-punk-border object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center border border-punk-border bg-punk-bg">
                <Package className="h-5 w-5 text-punk-text-muted" />
              </div>
            )}
            <div>
              <h3 className="font-punk-heading text-[12px] uppercase tracking-wider text-punk-text-primary">
                {extension.name}
              </h3>
              <p className="font-punk-code text-[10px] uppercase text-punk-accent">
                v{extension.version} · {extension.installType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-punk-text-muted transition-colors hover:text-punk-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-1 text-[10px] font-punk-heading uppercase border tracking-wider",
              extension.enabled
                ? "border-punk-success/50 bg-punk-success/10 text-punk-success"
                : "border-punk-border/30 text-punk-text-muted"
            )}>
              {extension.enabled ? "ACTIVE" : "INACTIVE"}
            </span>
            {extension.homepageUrl && (
              <a
                href={extension.homepageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-punk-code text-[10px] uppercase text-punk-accent hover:text-punk-text-primary"
              >
                HOMEPAGE
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {extension.optionsUrl && (
              <button
                onClick={() => onOpenOptions?.()}
                className="flex items-center gap-1 font-punk-code text-[10px] uppercase text-punk-accent hover:text-punk-text-primary"
              >
                OPTIONS
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {extension.description && (
            <div className="border border-punk-border/30 bg-punk-bg/40 p-3">
              <div className="mb-2 font-punk-heading text-[10px] uppercase tracking-wider text-punk-text-muted">
                DESCRIPTION
              </div>
              <p className="font-punk-body text-sm leading-relaxed text-punk-text-secondary">
                {extension.description}
              </p>
            </div>
          )}

          <div className="border border-punk-border/30 bg-punk-bg/40 p-3">
            <div className="mb-2 flex items-center gap-2 font-punk-heading text-[10px] uppercase tracking-wider text-punk-text-muted">
              <Shield className="h-3 w-3 text-punk-accent" />
              PERMISSIONS ({extension.permissions.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {extension.permissions.length > 0 ? extension.permissions.map((perm) => (
                <span
                  key={perm}
                  className="border border-punk-border/20 bg-punk-bg px-2 py-1 font-punk-code text-[10px] text-punk-text-secondary"
                >
                  {perm}
                </span>
              )) : (
                <span className="font-punk-code text-[10px] uppercase text-punk-text-muted">
                  NO PERMISSIONS
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
