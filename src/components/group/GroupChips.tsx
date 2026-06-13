import type { DragEventHandler } from "react"
import { Bot, Folder, GripVertical, Power, PowerOff } from "lucide-react"
import { cn } from "@/utils"
import type { Group } from "@/types"
import { GROUP_ICON_MAP } from "./groupVisuals"

type GroupChipDragState = "idle" | "dragging" | "over-before" | "over-after"

interface GroupChipProps {
  group: Group
  extensionCount: number
  allEnabled: boolean
  disabled?: boolean
  draggable?: boolean
  dragState?: GroupChipDragState
  onClick: () => void
  onToggle: () => void
  onDragStart?: DragEventHandler<HTMLDivElement>
  onDragOver?: DragEventHandler<HTMLDivElement>
  onDragLeave?: DragEventHandler<HTMLDivElement>
  onDrop?: DragEventHandler<HTMLDivElement>
  onDragEnd?: DragEventHandler<HTMLDivElement>
}

export function GroupChip({
  group,
  extensionCount,
  allEnabled,
  disabled = false,
  draggable = false,
  dragState = "idle",
  onClick,
  onToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: GroupChipProps) {
  const canDrag = draggable && !disabled
  const displayIcon = group.iconUrl ? (
    <img src={group.iconUrl} className="w-full h-full object-cover" alt="" />
  ) : (
    GROUP_ICON_MAP[group.icon] || <Folder className="w-3 h-3" />
  )

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 transition-all duration-200 cursor-pointer",
        "border border-punk-border/50 bg-punk-surface-raised",
        "hover:border-punk-primary hover:shadow-punk-hard",
        "active:shadow-punk-panel",
        canDrag && "cursor-grab active:cursor-grabbing",
        dragState === "dragging" && "opacity-60 border-punk-neon-cyan shadow-punk-hard",
        dragState === "over-before" &&
          "border-l-4 border-l-punk-neon-cyan ring-1 ring-punk-neon-cyan/50",
        dragState === "over-after" &&
          "border-r-4 border-r-punk-neon-cyan ring-1 ring-punk-neon-cyan/50"
      )}
      onClick={onClick}
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onDragOver={canDrag ? onDragOver : undefined}
      onDragLeave={canDrag ? onDragLeave : undefined}
      onDrop={canDrag ? onDrop : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      aria-grabbed={dragState === "dragging"}
      data-group-id={group.id}
    >
      {canDrag && (
        <GripVertical
          className="h-3.5 w-3.5 flex-shrink-0 text-punk-text-muted/50"
          aria-hidden="true"
        />
      )}
      {group.iconUrl ? (
        <img src={group.iconUrl} className="h-5 w-5 object-cover flex-shrink-0" alt="" />
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
        aria-label={
          allEnabled ? "Disable all extensions in group" : "Enable all extensions in group"
        }
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
      title="Create a group and use AI suggestions"
      className={cn(
        "flex items-center gap-2 px-3 py-2 transition-all duration-200",
        "border border-dashed border-punk-accent text-punk-accent bg-punk-accent/5"
      )}
    >
      <Bot className="h-3.5 w-3.5" />
      <span className="font-punk-heading text-[12px] uppercase tracking-wider">NEW / AI GROUP</span>
    </button>
  )
}
