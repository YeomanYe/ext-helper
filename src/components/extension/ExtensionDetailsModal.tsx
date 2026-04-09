import { createPortal } from "react-dom"
import {
  Package,
  Shield,
  Globe,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/utils"
import type { Extension } from "@/types"

interface ExtensionDetailsModalProps {
  show: boolean
  extension: Extension
  onClose: () => void
  onOpenOptions?: () => void
}

/** HUD-style key-value data row */
function DataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-punk-border/10 last:border-b-0">
      <span className="font-punk-code text-[10px] text-punk-text-muted uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn("font-punk-code text-[11px] uppercase", color || "text-punk-text-secondary")}
      >
        {value}
      </span>
    </div>
  )
}

/** Status badge */
function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-punk-heading uppercase border tracking-wider",
        active
          ? "border-punk-success/50 bg-punk-success/10 text-punk-success"
          : "border-punk-border/30 text-punk-text-muted"
      )}
    >
      {label}
    </span>
  )
}

/** Section header with icon */
function SectionHeader({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode
  label: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-2 font-punk-heading text-[10px] uppercase tracking-[0.15em] text-punk-neon-cyan/70 mb-1.5">
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className="font-punk-code text-punk-text-muted">({count})</span>
      )}
    </div>
  )
}

export function ExtensionDetailsModal({
  show,
  extension,
  onClose,
  onOpenOptions,
}: ExtensionDetailsModalProps) {
  if (!show || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-punk-bg/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-lg border border-punk-neon-cyan/30 bg-punk-bg",
          "shadow-[0_0_25px_rgba(0,255,255,0.1),0_4px_24px_rgba(0,0,0,0.6)]",
          "max-h-[560px] overflow-hidden flex flex-col"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD corner accents */}
        <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-punk-neon-cyan/60" />
        <div className="absolute -top-px -right-px w-3 h-3 border-t border-r border-punk-neon-cyan/60" />
        <div className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-punk-neon-cyan/60" />
        <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-punk-neon-cyan/60" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-punk-neon-cyan/15 px-4 py-2.5 bg-punk-neon-cyan/[0.03] shrink-0">
          <div className="flex items-center gap-3">
            {extension.iconUrl ? (
              <img
                src={extension.iconUrl}
                alt={extension.name}
                className="h-10 w-10 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center bg-punk-bg-alt">
                <Package className="h-5 w-5 text-punk-text-muted" />
              </div>
            )}
            <div>
              <h3 className="font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-primary">
                {extension.name}
              </h3>
              <p className="font-punk-code text-[10px] text-punk-accent">
                v{extension.version}
                {extension.versionName ? ` (${extension.versionName})` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 text-punk-text-muted transition-colors hover:text-punk-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Status & Links row */}
          <div className="flex items-center flex-wrap gap-2">
            <StatusBadge
              active={extension.enabled}
              label={extension.enabled ? "ACTIVE" : "INACTIVE"}
            />
            <StatusBadge
              active={extension.offlineEnabled}
              label={extension.offlineEnabled ? "OFFLINE OK" : "ONLINE ONLY"}
            />
            {extension.disabledReason && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-punk-heading uppercase border border-punk-warning/50 bg-punk-warning/10 text-punk-warning tracking-wider">
                <AlertTriangle className="h-3 w-3" />
                {extension.disabledReason === "permissions_increase" ? "PERMS CHANGED" : "DISABLED"}
              </span>
            )}
            {extension.homepageUrl && (
              <a
                href={extension.homepageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-punk-code text-[10px] uppercase text-punk-accent hover:text-punk-text-primary transition-colors"
              >
                HOMEPAGE <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {extension.optionsUrl && (
              <button
                onClick={() => onOpenOptions?.()}
                className="flex items-center gap-1 font-punk-code text-[10px] uppercase text-punk-accent hover:text-punk-text-primary transition-colors"
              >
                OPTIONS <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Description */}
          {extension.description && (
            <div className="border border-punk-border/20 bg-punk-bg-alt/50 p-2.5">
              <p className="font-punk-body text-[13px] leading-relaxed text-punk-text-secondary">
                {extension.description}
              </p>
            </div>
          )}

          {/* System info — HUD data readout */}
          <div className="border border-punk-border/20 bg-punk-bg-alt/50 p-2.5">
            <SectionHeader icon={<Package className="h-3 w-3" />} label="SYSTEM INFO" />
            <div className="space-y-0">
              <DataRow label="TYPE" value={extension.type} />
              <DataRow label="INSTALL" value={extension.installType} />
              <DataRow label="ID" value={extension.id} />
              <DataRow
                label="MAY_ENABLE"
                value={extension.mayEnable ? "YES" : "BLOCKED"}
                color={extension.mayEnable ? "text-punk-success" : "text-punk-cta"}
              />
              <DataRow
                label="MAY_DISABLE"
                value={extension.mayDisable ? "YES" : "BLOCKED"}
                color={extension.mayDisable ? "text-punk-success" : "text-punk-cta"}
              />
              <DataRow
                label="OFFLINE"
                value={extension.offlineEnabled ? "ENABLED" : "DISABLED"}
                color={extension.offlineEnabled ? "text-punk-success" : "text-punk-text-muted"}
              />
              {extension.updateUrl && (
                <DataRow
                  label="UPDATE_URL"
                  value={
                    extension.updateUrl.length > 40
                      ? extension.updateUrl.substring(0, 40) + "..."
                      : extension.updateUrl
                  }
                />
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="border border-punk-border/20 bg-punk-bg-alt/50 p-2.5">
            <SectionHeader
              icon={<Shield className="h-3 w-3" />}
              label="PERMISSIONS"
              count={extension.permissions.length}
            />
            <div className="flex flex-wrap gap-1">
              {extension.permissions.length > 0 ? (
                extension.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="border border-punk-border/20 bg-punk-bg px-1.5 py-0.5 font-punk-code text-[10px] text-punk-text-secondary"
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span className="font-punk-code text-[10px] uppercase text-punk-text-muted">
                  NONE
                </span>
              )}
            </div>
          </div>

          {/* Host Permissions */}
          <div className="border border-punk-border/20 bg-punk-bg-alt/50 p-2.5">
            <SectionHeader
              icon={<Globe className="h-3 w-3" />}
              label="HOST PERMISSIONS"
              count={extension.hostPermissions.length}
            />
            <div className="flex flex-wrap gap-1">
              {extension.hostPermissions.length > 0 ? (
                extension.hostPermissions.map((host) => (
                  <span
                    key={host}
                    className={cn(
                      "border px-1.5 py-0.5 font-punk-code text-[10px]",
                      host === "<all_urls>"
                        ? "border-punk-warning/30 bg-punk-warning/5 text-punk-warning"
                        : "border-punk-border/20 bg-punk-bg text-punk-text-secondary"
                    )}
                  >
                    {host}
                  </span>
                ))
              ) : (
                <span className="font-punk-code text-[10px] uppercase text-punk-text-muted">
                  NONE
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
