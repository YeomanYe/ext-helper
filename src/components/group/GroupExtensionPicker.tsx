import { Package } from "lucide-react"
import { cn } from "@/utils"
import type { Extension } from "@/types"

interface ExtensionWithStatus extends Extension {
  isInGroup: boolean
}

interface GroupExtensionPickerProps {
  extensions: Extension[]
  memberExtensions?: ExtensionWithStatus[]
  filteredExtensions: ExtensionWithStatus[]
  disableEnableControls: boolean
  showEnableActions?: boolean
  onToggleAll: (enabled: boolean) => void
  onToggleMembership: (extension: ExtensionWithStatus) => void
}

export function GroupExtensionPicker({
  extensions,
  memberExtensions,
  filteredExtensions,
  disableEnableControls,
  showEnableActions = true,
  onToggleAll,
  onToggleMembership,
}: GroupExtensionPickerProps) {
  const allEnabled = extensions.length > 0 && extensions.every((extension) => extension.enabled)
  const allDisabled = extensions.length > 0 && extensions.every((extension) => !extension.enabled)
  const members = memberExtensions || filteredExtensions.filter((extension) => extension.isInGroup)

  return (
    <>
      {showEnableActions && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-punk-border/30 bg-punk-bg shrink-0">
          <span className="font-punk-heading text-[12px] text-punk-text-muted uppercase">
            ACTIONS
          </span>
          <button
            onClick={() => onToggleAll(true)}
            disabled={disableEnableControls || extensions.length === 0 || allEnabled}
            className={cn(
              "px-2 py-1 text-[12px] font-punk-heading uppercase transition-all",
              disableEnableControls || extensions.length === 0 || allEnabled
                ? "bg-punk-success/20 text-punk-success/50 cursor-not-allowed"
                : "bg-punk-success/20 text-punk-success border border-punk-success/50 hover:bg-punk-success hover:text-white"
            )}
          >
            ENABLE ALL
          </button>
          <button
            onClick={() => onToggleAll(false)}
            disabled={disableEnableControls || extensions.length === 0 || allDisabled}
            className={cn(
              "px-2 py-1 text-[12px] font-punk-heading uppercase transition-all",
              disableEnableControls || extensions.length === 0 || allDisabled
                ? "bg-punk-cta/20 text-punk-cta/50 cursor-not-allowed"
                : "bg-punk-cta/20 text-punk-cta border border-punk-cta/50 hover:bg-punk-cta hover:text-white"
            )}
          >
            DISABLE ALL
          </button>
        </div>
      )}

      <div className="flex gap-2 px-4 py-2 border-b border-punk-border/30 bg-punk-bg shrink-0 overflow-x-auto">
        {members.map((extension) => (
          <div
            key={extension.id}
            className={cn(
              "w-8 h-8 flex-shrink-0 border bg-punk-bg-alt flex items-center justify-center overflow-hidden",
              extension.enabled ? "border-punk-success" : "border-punk-border/30"
            )}
            onClick={() => onToggleMembership(extension)}
          >
            {extension.iconUrl ? (
              <img src={extension.iconUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <Package className="w-4 h-4 text-punk-text-muted" />
            )}
          </div>
        ))}
        {members.length === 0 && (
          <div className="h-8 flex items-center">
            <span className="font-punk-heading text-[12px] text-punk-text-muted uppercase">
              NO GROUP MEMBERS
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredExtensions.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 p-3" style={{ gridAutoRows: "72px" }}>
            {filteredExtensions.map((extension) => (
              <div
                key={extension.id}
                onClick={() => onToggleMembership(extension)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2 cursor-pointer transition-all border",
                  extension.isInGroup
                    ? "border-punk-success/50 bg-punk-success/5 hover:border-punk-success"
                    : "border-punk-border/20 bg-punk-bg-alt hover:border-punk-primary/50"
                )}
                style={{ height: "72px" }}
              >
                <div
                  className={cn(
                    "absolute top-1 right-1 w-2 h-2 border border-punk-bg-alt z-10",
                    extension.enabled ? "bg-punk-success" : "bg-punk-text-muted"
                  )}
                />
                {extension.iconUrl ? (
                  <img src={extension.iconUrl} className="w-8 h-8 object-cover" alt="" />
                ) : (
                  <div className="w-8 h-8 bg-punk-bg flex items-center justify-center">
                    <Package className="w-4 h-4 text-punk-text-muted" />
                  </div>
                )}
                <span
                  className={cn(
                    "font-punk-heading text-[10px] uppercase text-center truncate w-full mt-1",
                    extension.isInGroup ? "text-punk-text-primary" : "text-punk-text-muted"
                  )}
                >
                  {extension.name.substring(0, 8)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="font-punk-body text-base text-punk-text-muted">NO_MATCH_FOUND</p>
          </div>
        )}
      </div>
    </>
  )
}
