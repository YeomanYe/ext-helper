import * as React from "react"
import { Globe, Calendar, Edit2, Trash2, Folder, Zap, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/utils"
import type { Rule, ConditionGroup, Action } from "@/rules/types"
import { DAYS_OF_WEEK } from "@/rules/types"
import type { Extension, Group, ViewMode } from "@/types"

interface RuleCardProps {
  rule: Rule
  extensions: Extension[]
  groups: Group[]
  onToggle: (id: string) => void
  onEdit: (rule: Rule) => void
  onDelete: (id: string) => void
  viewMode?: ViewMode
  showDelete?: boolean
  className?: string
}

export function RuleCard({
  rule,
  extensions,
  groups,
  onToggle,
  onEdit,
  onDelete,
  viewMode = "card",
  showDelete = true,
  className
}: RuleCardProps) {
  const isEnabled = rule.enabled
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Compact mode - vertical layout with fixed size
  if (viewMode === "compact") {
    return (
      <div
        className={cn(
          "group relative flex flex-col items-center justify-center p-3 border transition-all cursor-pointer",
          "bg-punk-bg-alt",
          "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          !isEnabled && "opacity-50",
          "min-w-[84px] w-[84px] h-[84px]",
          "punk-border",
          className
        )}
        onClick={() => onToggle(rule.id)}
      >
        {/* Status indicator */}
        <div
          className={cn(
            "absolute top-1.5 right-1.5 w-2 h-2 border border-punk-bg-alt rounded-full",
            isEnabled ? "bg-punk-success animate-pulse-neon" : "bg-punk-text-muted"
          )}
        />

        {/* Rule Icon */}
        <div className="w-8 h-8 flex items-center justify-center border border-punk-border/50 bg-punk-bg rounded mb-1.5">
          <Zap className="w-4 h-4 text-punk-accent" />
        </div>

        {/* Rule Name */}
        <h4 className="font-punk-heading text-[6px] text-punk-text-primary text-center uppercase tracking-wide px-1 truncate w-full">
          {rule.name.substring(0, 12)}
        </h4>
      </div>
    )
  }

  // Card mode - horizontal layout with more details
  if (viewMode === "card") {
    return (
      <div
        className={cn(
          "group relative flex flex-col border transition-all",
          "bg-punk-bg-alt",
          "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          !isEnabled && "opacity-60",
          "w-full",
          "punk-border",
          className
        )}
      >
        {/* Content */}
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-punk-heading text-[9px] text-punk-text-primary uppercase tracking-wide truncate">
                {rule.name}
              </h4>
              {rule.description && (
                <p className="font-punk-code text-[8px] text-punk-text-muted truncate mt-0.5">
                  {rule.description}
                </p>
              )}
            </div>
          </div>

          {/* Conditions */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            <span className="font-punk-heading text-[7px] text-punk-text-muted uppercase">
              IF
            </span>
            {rule.conditionGroups.map((group, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="px-1 py-0.5 font-punk-heading text-[6px] text-punk-accent bg-punk-accent/10 border border-punk-accent/30">
                    OR
                  </span>
                )}
                <ConditionGroupBadge group={group} />
              </React.Fragment>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="font-punk-heading text-[7px] text-punk-text-muted uppercase">
              THEN
            </span>
            <div className="flex flex-wrap gap-1">
              {rule.actions.map((action, idx) => (
                <ActionBadge
                  key={idx}
                  action={action}
                  extensions={extensions}
                  groups={groups}
                />
              ))}
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-punk-border/20">
            <div className="flex items-center gap-2">
              {rule.triggerCount > 0 && (
                <span className="font-punk-code text-[7px] text-punk-text-muted">
                  TRIGGERED {rule.triggerCount}x
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(rule)}
                className="p-1 text-punk-text-muted hover:text-punk-accent transition-colors"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              {showDelete && (
                <button
                  onClick={() => onDelete(rule.id)}
                  className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Detail mode - expanded vertical layout
  return (
    <div
      className={cn(
        "group relative flex flex-col border transition-all",
        "bg-punk-bg-alt",
        "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
        !isEnabled && "opacity-60",
        "w-full",
        "punk-border",
        className
      )}
    >
      {/* Content */}
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Rule Icon */}
          <div className="w-12 h-12 flex items-center justify-center border border-punk-border/50 bg-punk-bg rounded flex-shrink-0">
            <Zap className="w-6 h-6 text-punk-accent" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wide">
                  {rule.name}
                </h4>
                {rule.description && (
                  <p className="font-punk-code text-[8px] text-punk-text-muted mt-0.5">
                    {rule.description}
                  </p>
                )}
              </div>
              {rule.triggerCount > 0 && (
                <span className="font-punk-code text-[7px] text-punk-success shrink-0">
                  {rule.triggerCount}x TRIGGERS
                </span>
              )}
            </div>

            {/* Status line */}
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "px-1.5 py-0.5 text-[6px] font-punk-heading uppercase border",
                isEnabled
                  ? "text-punk-success border-punk-success/50 bg-punk-success/10"
                  : "text-punk-text-muted border-punk-border/30"
              )}>
                {isEnabled ? "ACTIVE" : "INACTIVE"}
              </span>
              <span className="font-punk-code text-[7px] text-punk-text-muted">
                {rule.conditionGroups.length} CONDITION{S(rule.conditionGroups.length)} • {rule.actions.length} ACTION{S(rule.actions.length)}
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-2">
          {/* Conditions Section */}
          <div
            className="border border-punk-border/30 rounded bg-punk-bg/50 cursor-pointer hover:border-punk-accent/30 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-punk-accent" />
                <span className="font-punk-heading text-[7px] text-punk-text-muted uppercase">
                  CONDITIONS
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-punk-text-muted" />
              ) : (
                <ChevronDown className="w-3 h-3 text-punk-text-muted" />
              )}
            </div>

            {isExpanded && (
              <div className="px-2 py-2 border-t border-punk-border/20 space-y-1.5">
                {rule.conditionGroups.map((group, idx) => (
                  <div key={idx}>
                    {idx > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="px-1 py-0.5 font-punk-heading text-[6px] text-punk-accent bg-punk-accent/10 border border-punk-accent/30">
                          OR GROUP {idx + 1}
                        </span>
                      </div>
                    )}
                    <ConditionGroupDetail group={group} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="border border-punk-border/30 rounded bg-punk-bg/50">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-punk-cta" />
                <span className="font-punk-heading text-[7px] text-punk-text-muted uppercase">
                  ACTIONS
                </span>
              </div>
            </div>

            <div className="px-2 py-2 border-t border-punk-border/20 space-y-1.5">
              {rule.actions.map((action, idx) => (
                <ActionBadge
                  key={idx}
                  action={action}
                  extensions={extensions}
                  groups={groups}
                  detailed
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-punk-border/20">
          <button
            onClick={() => onEdit(rule)}
            className="flex items-center gap-1 px-2 py-1 text-[7px] font-punk-heading text-punk-text-muted hover:text-punk-accent border border-punk-border/30 hover:border-punk-accent/50 transition-all"
          >
            <Edit2 className="w-3 h-3" />
            EDIT
          </button>
          {showDelete && (
            <button
              onClick={() => onDelete(rule.id)}
              className="flex items-center gap-1 px-2 py-1 text-[7px] font-punk-heading text-punk-text-muted hover:text-punk-cta border border-punk-border/30 hover:border-punk-cta/50 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              DELETE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function S(n: number): string {
  return n !== 1 ? "S" : ""
}

function ConditionGroupBadge({ group }: { group: ConditionGroup }) {
  const domainsLabel = group.domains.length > 1
    ? `${group.domains.length} domains`
    : group.domains[0] || "any"

  const hasTime = group.schedule !== null

  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 border border-punk-accent/30 bg-punk-accent/5">
      <Globe className="h-2.5 w-2.5 text-punk-accent" />
      <span className="font-punk-code text-[7px] text-punk-accent">
        {domainsLabel}
      </span>
      {hasTime && (
        <Calendar className="h-2.5 w-2.5 text-punk-success" />
      )}
    </div>
  )
}

function ConditionGroupDetail({ group }: { group: ConditionGroup }) {
  const domainsLabel = group.domains.length > 0
    ? group.domains.join(", ")
    : "ALL DOMAINS"

  const hasTime = group.schedule !== null

  return (
    <div className="flex items-center gap-2 px-2 py-1 border border-punk-border/20 bg-punk-bg rounded">
      <Globe className="h-3 w-3 text-punk-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-punk-code text-[7px] text-punk-text-primary uppercase">
          {domainsLabel}
        </span>
      </div>
      {hasTime && (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-punk-success" />
          <span className="font-punk-code text-[6px] text-punk-success uppercase">
            SCHEDULED
          </span>
        </div>
      )}
    </div>
  )
}

function ActionBadge({ action, extensions, groups, detailed = false }: { action: Action; extensions: Extension[]; groups: Group[]; detailed?: boolean }) {
  const isEnable = action.type.startsWith("enable")
  const isExt = action.type.endsWith("Extension")

  let icon: React.ReactNode
  let name = action.type
  let colorClass = isEnable ? "text-punk-success border-punk-success/30 bg-punk-success/5" : "text-punk-cta border-punk-cta/30 bg-punk-cta/5"

  if (isExt) {
    const ext = extensions.find(e => e.id === action.targetId)
    name = ext ? ext.name : action.targetId
    icon = ext?.iconUrl ? (
      detailed ? (
        <img src={ext.iconUrl} className="h-5 w-5 border border-punk-border/30 object-cover" alt="" />
      ) : (
        <img src={ext.iconUrl} className="h-4 w-4 border border-punk-border/30 object-cover" alt="" />
      )
    ) : (
      <div className={cn(detailed ? "h-5 w-5" : "h-4 w-4", "border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center")}>
        <span className={cn(detailed ? "font-punk-heading text-[7px]" : "font-punk-heading text-[6px]", "text-punk-text-muted")}>{name[0]}</span>
      </div>
    )
  } else {
    const grp = groups.find(g => g.id === action.targetId)
    name = grp ? grp.name : action.targetId
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
        <span className="uppercase truncate flex-1">{name}</span>
        <span className={cn(
          "text-[6px] uppercase shrink-0",
          isEnable ? "text-punk-success" : "text-punk-cta"
        )}>
          {isEnable ? "ENABLE" : "DISABLE"}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-1 px-1.5 py-0.5 border text-[7px] font-punk-code",
      colorClass
    )}>
      {icon}
      <span className="uppercase truncate max-w-[80px]">{name.substring(0, 10)}</span>
    </div>
  )
}
