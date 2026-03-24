import * as React from "react"
import { Globe, Calendar, Edit2, Trash2, Folder } from "lucide-react"
import { cn } from "@/utils"
import type { Rule, ConditionGroup, Action } from "@/rules/types"
import { DAYS_OF_WEEK } from "@/rules/types"
import type { Extension, Group } from "@/types"

interface RuleCardProps {
  rule: Rule
  extensions: Extension[]
  groups: Group[]
  onToggle: (id: string) => void
  onEdit: (rule: Rule) => void
  onDelete: (id: string) => void
}

export function RuleCard({ rule, extensions, groups, onToggle, onEdit, onDelete }: RuleCardProps) {
  const isEnabled = rule.enabled

  return (
    <div
      className={cn(
        "p-3 border transition-all",
        isEnabled
          ? "border-punk-border/50 bg-punk-bg-alt hover:border-punk-accent/50"
          : "border-punk-border/20 bg-punk-bg opacity-60"
      )}
    >
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

        {/* Toggle */}
        <button
          onClick={() => onToggle(rule.id)}
          className={cn(
            "px-2 py-1 text-[8px] font-punk-heading transition-all shrink-0",
            isEnabled
              ? "text-punk-success border border-punk-success/50 bg-punk-success/10"
              : "text-punk-text-muted border border-punk-border/30"
          )}
        >
          {isEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Conditions */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="font-punk-heading text-[7px] text-punk-text-muted uppercase">
          IF
        </span>
        {rule.conditionGroups.map((group, idx) => (
          <ConditionGroupBadge key={idx} group={group} />
        ))}
        <span className="font-punk-heading text-[7px] text-punk-text-muted uppercase">
          ({rule.conditionOperator})
        </span>
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
          <button
            onClick={() => onDelete(rule.id)}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
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

function ActionBadge({ action, extensions, groups }: { action: Action; extensions: Extension[]; groups: Group[] }) {
  const isEnable = action.type.startsWith("enable")
  const isExt = action.type.endsWith("Extension")

  let icon: React.ReactNode
  let name = action.type
  let colorClass = isEnable ? "text-punk-success border-punk-success/30 bg-punk-success/5" : "text-punk-cta border-punk-cta/30 bg-punk-cta/5"

  if (isExt) {
    const ext = extensions.find(e => e.id === action.targetId)
    name = ext ? ext.name : action.targetId
    icon = ext?.iconUrl ? (
      <img src={ext.iconUrl} className="h-4 w-4 border border-punk-border/30 object-cover" alt="" />
    ) : (
      <div className="h-4 w-4 border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center">
        <span className="font-punk-heading text-[6px] text-punk-text-muted">{name[0]}</span>
      </div>
    )
  } else {
    const grp = groups.find(g => g.id === action.targetId)
    name = grp ? grp.name : action.targetId
    icon = (
      <div
        className="h-4 w-4 rounded border border-punk-border/30 flex items-center justify-center"
        style={{ backgroundColor: (grp?.color || "#666") + "20" }}
      >
        <Folder className="h-2.5 w-2.5" style={{ color: grp?.color || "#666" }} />
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
