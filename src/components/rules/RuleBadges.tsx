import * as React from "react"
import { Globe, Calendar, Folder, Package } from "lucide-react"
import { cn } from "@/utils"
import type { ConditionGroup, Action } from "@/rules/types"
import { DAYS_OF_WEEK } from "@/rules/types"
import type { Extension, Group } from "@/types"

export function S(n: number): string {
  return n !== 1 ? "S" : ""
}

export function ConditionGroupBadge({ group }: { group: ConditionGroup }) {
  const domainsLabel = group.domains.length > 1
    ? `${group.domains.length} domains`
    : group.domains[0] || "any"

  const hasTime = group.schedule !== null

  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 border border-punk-accent/30 bg-punk-accent/5">
      <Globe className="h-2.5 w-2.5 text-punk-accent" />
      <span className="font-punk-code text-[11px] text-punk-accent">
        {domainsLabel}
      </span>
      {hasTime && (
        <Calendar className="h-2.5 w-2.5 text-punk-success" />
      )}
    </div>
  )
}

export function ConditionGroupDetail({ group }: { group: ConditionGroup }) {
  const domainsLabel = group.domains.length > 0
    ? group.domains.join(", ")
    : "ALL DOMAINS"

  const hasTime = group.schedule !== null

  const daysLabel = hasTime && group.schedule
    ? group.schedule.days.map(d => DAYS_OF_WEEK[d].label).join(", ")
    : ""

  return (
    <div className="flex items-center gap-2 px-2 py-1 border border-punk-border/20 bg-punk-bg rounded">
      <Globe className="h-3 w-3 text-punk-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-punk-code text-[13px] text-punk-text-primary uppercase">
          {domainsLabel}
        </span>
      </div>
      {hasTime && group.schedule && (
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-punk-success" />
            <span className="font-punk-code text-[12px] text-punk-success uppercase">
              {group.schedule.startTime}-{group.schedule.endTime}
            </span>
          </div>
          <span className="font-punk-code text-[11px] text-punk-text-muted uppercase ml-4">
            {daysLabel}
          </span>
        </div>
      )}
    </div>
  )
}

export function ActionBlock({ action, extensions, groups, isEnable }: { action: Action; extensions: Extension[]; groups: Group[]; isEnable: boolean }) {
  const isExtensionType = action.type.endsWith("Extension")

  let icon: React.ReactNode
  let displayName = ""

  if (isExtensionType) {
    const ext = extensions.find(e => e.id === action.targetId)
    displayName = ext ? ext.name : action.targetId
    icon = ext?.iconUrl ? (
      <img src={ext.iconUrl} className="w-6 h-6 border border-punk-border/30 object-cover" alt="" />
    ) : (
      <div className="w-6 h-6 border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center">
        <Package className="w-4 h-4 text-punk-text-muted" />
      </div>
    )
  } else {
    const grp = groups.find(g => g.id === action.targetId)
    displayName = grp ? grp.name : action.targetId
    icon = (
      <div
        className="w-6 h-6 rounded border border-punk-border/30 flex items-center justify-center"
        style={{ backgroundColor: (grp?.color || "#666") + "20" }}
      >
        <Folder className="w-4 h-4" style={{ color: grp?.color || "#666" }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-0.5 p-1 border border-punk-border/30 bg-punk-bg-alt rounded min-w-[60px]">
      {icon}
      <span className="font-punk-heading text-[10px] text-punk-text-primary uppercase text-center truncate w-full px-0.5">
        {displayName.substring(0, 8)}
      </span>
      <span className={cn(
        "text-[9px] uppercase font-punk-code",
        isEnable ? "text-punk-success" : "text-punk-cta"
      )}>
        {isEnable ? "ON" : "OFF"}
      </span>
    </div>
  )
}

export function ActionBadge({ action, extensions, groups, detailed = false }: { action: Action; extensions: Extension[]; groups: Group[]; detailed?: boolean }) {
  const isEnable = action.type.startsWith("enable")
  const isExtensionType = action.type.endsWith("Extension")

  let icon: React.ReactNode
  let displayName = ""
  let colorClass = isEnable ? "text-punk-success border-punk-success/30 bg-punk-success/5" : "text-punk-cta border-punk-cta/30 bg-punk-cta/5"

  if (isExtensionType) {
    const ext = extensions.find(e => e.id === action.targetId)
    displayName = ext ? ext.name : action.targetId
    icon = ext?.iconUrl ? (
      detailed ? (
        <img src={ext.iconUrl} className="h-5 w-5 border border-punk-border/30 object-cover" alt="" />
      ) : (
        <img src={ext.iconUrl} className="h-4 w-4 border border-punk-border/30 object-cover" alt="" />
      )
    ) : (
      <div className={cn(detailed ? "h-5 w-5" : "h-4 w-4", "border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center")}>
        <span className={cn(detailed ? "font-punk-heading text-[11px]" : "font-punk-heading text-[10px]", "text-punk-text-muted")}>{displayName[0]}</span>
      </div>
    )
  } else {
    const grp = groups.find(g => g.id === action.targetId)
    displayName = grp ? grp.name : action.targetId
    icon = (
      <div
        className={cn(detailed ? "h-5 w-5" : "h-4 w-4", "rounded border border-punk-border/30 flex items-center justify-center")}
        style={{ backgroundColor: (grp?.color || "#666") + "20" }}
      >
        <Folder className={detailed ? "h-3 w-3" : "h-2.5 w-2.5"} style={{ color: grp?.color || "#666" }} />
      </div>
    )
  }

  if (detailed) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-2 py-1 border font-punk-code",
        colorClass
      )}>
        {icon}
        <span className="uppercase truncate flex-1">{displayName}</span>
        <span className={cn(
          "text-[10px] uppercase shrink-0",
          isEnable ? "text-punk-success" : "text-punk-cta"
        )}>
          {isEnable ? "ENABLE" : "DISABLE"}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-1 px-1.5 py-0.5 border text-[11px] font-punk-code",
      colorClass
    )}>
      {icon}
      <span className="uppercase truncate max-w-[80px]">{displayName.substring(0, 10)}</span>
    </div>
  )
}
