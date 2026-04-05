import * as React from "react"
import { Globe, Calendar, Edit2, Trash2, Folder, Zap, ChevronDown, ChevronUp, Package } from "lucide-react"
import { cn } from "@/utils"
import type { Rule, ConditionGroup, Action } from "@/rules/types"
import { DAYS_OF_WEEK } from "@/rules/types"
import type { Extension, Group, ViewMode } from "@/types"
import { ConfirmDialog } from "@/components/common"

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
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false)

  const handleConfirmDelete = () => {
    onDelete(rule.id)
    setShowConfirmDelete(false)
  }

  // Compact mode - vertical layout with fixed size
  if (viewMode === "compact") {
    return (
      <div
        className={cn(
          "group relative flex flex-col items-center justify-center p-3 border",
          "bg-punk-bg-alt",
          "hover:border-punk-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          !isEnabled && "opacity-50",
          "aspect-square",
          "punk-border",
          className
        )}
        onClick={() => onToggle(rule.id)}
      >
        {/* Top bar - status on left, actions on right */}
        <div className="absolute top-1 left-0 w-full flex items-center justify-between px-1.5 z-10">
          {/* Status indicator */}
          <div
            className={cn(
              "w-2 h-2 border border-punk-bg-alt rounded-full",
              isEnabled ? "bg-punk-success animate-pulse-neon" : "bg-punk-text-muted"
            )}
          />
          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmDelete(true)
              }}
              className="p-0.5 text-punk-text-muted hover:text-punk-cta transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(rule)
              }}
              className="p-0.5 text-punk-text-muted hover:text-punk-accent transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Rule Icon */}
        <div className="w-8 h-8 flex items-center justify-center border border-punk-border/50 bg-punk-bg rounded mb-1.5 overflow-hidden mt-3">
          {rule.iconUrl ? (
            <img src={rule.iconUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Zap className="w-4 h-4 text-punk-accent" />
          )}
        </div>

        {/* Rule Name */}
        <h4 className="font-punk-heading text-[11px] text-punk-text-primary text-center uppercase tracking-wider px-1 truncate w-full">
          {rule.name.substring(0, 12)}
        </h4>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDelete}
          title="DELETE RULE"
          message={`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`}
          confirmText="DELETE"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
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
          "min-w-[280px] flex-1",
          "punk-border",
          className
        )}
      >
        {/* Content */}
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            {/* Rule Icon */}
            <div className="w-10 h-10 flex items-center justify-center border border-punk-border/50 bg-punk-bg rounded flex-shrink-0 overflow-hidden">
              {rule.iconUrl ? (
                <img src={rule.iconUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-5 h-5 text-punk-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-punk-heading text-[13px] text-punk-text-primary uppercase tracking-wider truncate">
                {rule.name}
              </h4>
              {rule.description && (
                <p className="font-punk-code text-[12px] text-punk-text-muted truncate mt-0.5">
                  {rule.description}
                </p>
              )}
            </div>
            {/* Toggle */}
            <button
              onClick={() => onToggle(rule.id)}
              className={cn(
                "px-2 py-0.5 text-[11px] font-punk-heading transition-all shrink-0",
                isEnabled
                  ? "text-punk-success border border-punk-success/50 bg-punk-success/10"
                  : "text-punk-text-muted border border-punk-border/30"
              )}
            >
              {isEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* Conditions */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            <span className="font-punk-heading text-[11px] text-punk-text-muted uppercase">
              IF
            </span>
            {rule.conditionGroups.map((group, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="px-1 py-0.5 font-punk-heading text-[10px] text-punk-accent bg-punk-accent/10 border border-punk-accent/30">
                    OR
                  </span>
                )}
                <ConditionGroupBadge group={group} />
              </React.Fragment>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="font-punk-heading text-[11px] text-punk-text-muted uppercase">
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
                <span className="font-punk-code text-[11px] text-punk-text-muted">
                  TRIGGERED {rule.triggerCount}x
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showDelete && (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => onEdit(rule)}
                className="p-1 text-punk-text-muted hover:text-punk-accent transition-colors"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Confirm Delete Dialog */}
        <div className={cn(!isEnabled && "!opacity-100")}>
          <ConfirmDialog
            isOpen={showConfirmDelete}
            title="DELETE RULE"
            message={`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`}
            confirmText="DELETE"
            variant="danger"
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowConfirmDelete(false)}
          />
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
          <div className="w-12 h-12 flex items-center justify-center border border-punk-border/50 bg-punk-bg rounded flex-shrink-0 overflow-hidden">
            {rule.iconUrl ? (
              <img src={rule.iconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Zap className="w-6 h-6 text-punk-accent" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wider">
                  {rule.name}
                </h4>
                {rule.description && (
                  <p className="font-punk-code text-[12px] text-punk-text-muted mt-0.5">
                    {rule.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {rule.triggerCount > 0 && (
                  <span className="font-punk-code text-[11px] text-punk-success shrink-0">
                    {rule.triggerCount}x TRIGGERS
                  </span>
                )}
                <button
                  onClick={() => onToggle(rule.id)}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-punk-heading transition-all shrink-0",
                    isEnabled
                      ? "text-punk-success border border-punk-success/50 bg-punk-success/10"
                      : "text-punk-text-muted border border-punk-border/30"
                  )}
                >
                  {isEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            {/* Status line */}
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "px-1.5 py-0.5 text-[10px] font-punk-heading uppercase border",
                isEnabled
                  ? "text-punk-success border-punk-success/50 bg-punk-success/10"
                  : "text-punk-text-muted border-punk-border/30"
              )}>
                {isEnabled ? "ACTIVE" : "INACTIVE"}
              </span>
              <span className="font-punk-code text-[11px] text-punk-text-muted">
                {rule.conditionGroups.length} CONDITION{S(rule.conditionGroups.length)} • {rule.actions.length} ACTION{S(rule.actions.length)}
              </span>
            </div>
          </div>
        </div>

        {/* Conditions Section - always expanded */}
          <div className="border border-punk-border/30 rounded bg-punk-bg/50">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Globe className="w-3 h-3 text-punk-accent" />
              <span className="font-punk-heading text-[11px] text-punk-text-muted uppercase">
                CONDITIONS
              </span>
            </div>

            <div className="px-2 py-2 border-t border-punk-border/20 space-y-1.5">
              {rule.conditionGroups.map((group, idx) => (
                <div key={idx}>
                  {idx > 0 && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="px-1 py-0.5 font-punk-heading text-[10px] text-punk-accent bg-punk-accent/10 border border-punk-accent/30">
                        OR GROUP {idx + 1}
                      </span>
                    </div>
                  )}
                  <ConditionGroupDetail group={group} />
                </div>
              ))}
            </div>
          </div>

          {/* Actions Section - display as grid of blocks */}
          <div className="border border-punk-border/30 rounded bg-punk-bg/50">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Zap className="w-3 h-3 text-punk-cta" />
              <span className="font-punk-heading text-[11px] text-punk-text-muted uppercase">
                ACTIONS ({rule.actions.length})
              </span>
            </div>

            <div className="px-2 py-2 border-t border-punk-border/20">
              <div className="flex flex-wrap gap-2">
                {rule.actions.map((action, idx) => (
                  <ActionBlock
                    key={idx}
                    action={action}
                    extensions={extensions}
                    groups={groups}
                    isEnable={action.type.startsWith("enable")}
                  />
                ))}
              </div>
            </div>
          </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-punk-border/20">
          {showDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-punk-heading text-punk-text-muted hover:text-punk-cta border border-punk-border/30 hover:border-punk-cta/50 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              DELETE
            </button>
          )}
          <button
            onClick={() => onEdit(rule)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-punk-heading text-punk-text-muted hover:text-punk-accent border border-punk-border/30 hover:border-punk-accent/50 transition-all"
          >
            <Edit2 className="w-3 h-3" />
            EDIT
          </button>
        </div>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDelete}
          title="DELETE RULE"
          message={`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`}
          confirmText="DELETE"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
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
      <span className="font-punk-code text-[11px] text-punk-accent">
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

function ActionBlock({ action, extensions, groups, isEnable }: { action: Action; extensions: Extension[]; groups: Group[]; isEnable: boolean }) {
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

function ActionBadge({ action, extensions, groups, detailed = false }: { action: Action; extensions: Extension[]; groups: Group[]; detailed?: boolean }) {
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
