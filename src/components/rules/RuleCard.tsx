import * as React from "react"
import { Globe, Calendar, Edit2, Trash2 } from "lucide-react"
import { cn } from "@/utils"
import type { Rule, Condition, ScheduleCondition } from "@/rules/types"
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
  const actionSummary = React.useMemo(() => {
    return rule.actions.map((a) => {
      let name = a.type
      if (a.type === "enableExtension" || a.type === "disableExtension") {
        const ext = extensions.find(e => e.id === a.targetId)
        name = ext ? ext.name.substring(0, 12) : a.targetId
      } else if (a.type === "enableGroup" || a.type === "disableGroup") {
        const grp = groups.find(g => g.id === a.targetId)
        name = grp ? grp.name : a.targetId
      }
      const prefix = a.type.startsWith("enable") ? "+" : "-"
      return `${prefix}${name}`
    })
  }, [rule.actions, extensions, groups])

  return (
    <div
      className={cn(
        "p-3 border transition-all",
        rule.enabled
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
            rule.enabled
              ? "text-punk-success border border-punk-success/50 bg-punk-success/10"
              : "text-punk-text-muted border border-punk-border/30"
          )}
        >
          {rule.enabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Conditions */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="font-punk-heading text-[7px] text-punk-text-muted uppercase">
          IF
        </span>
        {rule.conditions.map((condition, idx) => (
          <ConditionBadge key={idx} condition={condition} />
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
        <span className="font-punk-code text-[8px] text-punk-accent px-1.5 py-0.5 border border-punk-accent/30 bg-punk-accent/5">
          {actionSummary}
        </span>
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

function ConditionBadge({ condition }: { condition: Condition }) {
  if (condition.type === "domain") {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 border border-punk-accent/30 bg-punk-accent/5">
        <Globe className="h-2.5 w-2.5 text-punk-accent" />
        <span className="font-punk-code text-[7px] text-punk-accent">
          {condition.pattern}
        </span>
      </div>
    )
  }

  if (condition.type === "schedule") {
    const daysLabel = condition.days
      .map((d) => DAYS_OF_WEEK.find(day => day.value === d)?.label || "")
      .join("")
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 border border-punk-success/30 bg-punk-success/5">
        <Calendar className="h-2.5 w-2.5 text-punk-success" />
        <span className="font-punk-code text-[7px] text-punk-success">
          {daysLabel} {condition.startTime}-{condition.endTime}
        </span>
      </div>
    )
  }

  return null
}
