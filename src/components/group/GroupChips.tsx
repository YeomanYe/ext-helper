import { Folder, Power, PowerOff } from "lucide-react"
import { cn } from "@/utils"
import type { Group } from "@/types"
import { GROUP_ICON_MAP } from "./groupVisuals"

interface GroupChipProps {
  group: Group
  extensionCount: number
  allEnabled: boolean
  disabled?: boolean
  onClick: () => void
  onToggle: () => void
}

export function GroupChip({
  group,
  extensionCount,
  allEnabled,
  disabled = false,
  onClick,
  onToggle
}: GroupChipProps) {
  const displayIcon = group.iconUrl ? (
    <img src={group.iconUrl} className="w-full h-full object-cover" alt="" />
  ) : (
    GROUP_ICON_MAP[group.icon] || <Folder className="w-3 h-3" />
  )

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 transition-all duration-200 cursor-pointer",
        "border border-punk-border/50 bg-punk-bg-alt",
        "hover:border-punk-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.3)]",
        "active:shadow-[0_0_15px_rgba(124,58,237,0.5)]"
      )}
      onClick={onClick}
    >
      {group.iconUrl ? (
        <img src={group.iconUrl} className="h-5 w-5 border border-punk-border/30 object-cover flex-shrink-0" alt="" />
      ) : (
        <div
          className="h-5 w-5 rounded-sm border border-punk-border/30 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${group.color}20` }}
        >
          <span style={{ color: group.color }}>{displayIcon}</span>
        </div>
      )}
      <span className="font-punk-heading text-[13px] text-punk-text-primary tracking-wider">
        {group.name}
      </span>
      <span className="font-punk-code text-[10px] text-punk-accent px-1.5 py-0.5 border border-punk-accent/30 bg-punk-accent/5">
        {extensionCount}
      </span>
      <button
        onClick={(event) => {
          event.stopPropagation()
          if (disabled) return
          onToggle()
        }}
        disabled={disabled}
        className={cn(
          "p-1.5 transition-colors",
          disabled
            ? "cursor-not-allowed text-punk-text-muted/40"
            : "text-punk-text-muted hover:text-punk-success hover:bg-punk-success/10"
        )}
        title={allEnabled ? "Disable all in group" : "Enable all in group"}
        aria-label={allEnabled ? "Disable all extensions in group" : "Enable all extensions in group"}
      >
        {allEnabled ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

interface CreateGroupChipProps {
  onClick: () => void
}

export function CreateGroupChip({ onClick }: CreateGroupChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 transition-all duration-200",
        "border border-dashed border-punk-accent text-punk-accent bg-punk-accent/5"
      )}
    >
      <Folder className="h-3.5 w-3.5" />
      <span className="font-punk-heading text-[12px] uppercase tracking-wider">NEW GROUP</span>
    </button>
  )
}
