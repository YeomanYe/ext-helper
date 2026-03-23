import * as React from "react"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/utils"
import { ConditionBuilder } from "./ConditionBuilder"
import { ActionBuilder } from "./ActionBuilder"
import type {
  Rule,
  Condition,
  Action,
  ConditionOperator,
} from "@/rules/types"

interface RuleEditorProps {
  rule: Rule | null
  onSave: (data: Omit<Rule, "id" | "createdAt" | "updatedAt" | "triggerCount">) => void
  onClose: () => void
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "AND", label: "MATCH ALL (AND)" },
  { value: "OR", label: "MATCH ANY (OR)" }
]

function ConditionOperatorDropdown({
  value,
  onChange
}: {
  value: ConditionOperator
  onChange: (op: ConditionOperator) => void
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const currentLabel = OPERATORS.find(o => o.value === value)?.label || ""

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          "punk-input h-7 px-2 text-[9px] flex items-center gap-2",
          "border border-punk-border/50 bg-punk-bg-alt"
        )}
      >
        <span className="font-punk-heading uppercase">{currentLabel}</span>
        <ChevronDown className={cn("h-3 w-3 text-punk-text-muted", showDropdown && "rotate-180")} />
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 z-50 w-40 border border-punk-border bg-punk-bg-alt shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          {OPERATORS.map((op) => (
            <button
              key={op.value}
              onClick={() => {
                onChange(op.value)
                setShowDropdown(false)
              }}
              className={cn(
                "w-full px-3 py-2 text-left font-punk-heading text-[9px] uppercase transition-all",
                value === op.value
                  ? "bg-punk-primary text-white"
                  : "text-punk-text-secondary hover:bg-punk-bg hover:text-punk-text-primary"
              )}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function RuleEditor({ rule, onSave, onClose }: RuleEditorProps) {
  const [name, setName] = React.useState(rule?.name || "")
  const [description, setDescription] = React.useState(rule?.description || "")
  const [conditions, setConditions] = React.useState<Condition[]>(
    rule?.conditions || []
  )
  const [conditionOperator, setConditionOperator] = React.useState<ConditionOperator>(
    rule?.conditionOperator || "AND"
  )
  const [actions, setActions] = React.useState<Action[]>(rule?.actions || [])
  const [priority, setPriority] = React.useState(rule?.priority || 0)

  const isValid = name.trim() && conditions.length > 0 && actions.length > 0

  // Close on escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  const handleSave = () => {
    if (!isValid) return

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      conditions,
      conditionOperator,
      actions,
      priority,
      enabled: rule?.enabled ?? true,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-h-[600px] border border-punk-border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-punk-border/30 shrink-0">
          <h3 className="flex-1 font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wide">
            {rule ? "EDIT RULE" : "NEW RULE"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
              RULE_NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Time Extensions"
              className="punk-input w-full h-10 px-3 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
              DESCRIPTION (OPTIONAL)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="punk-input w-full h-10 px-3 text-sm"
            />
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-punk-heading text-[9px] text-punk-text-muted uppercase">
                CONDITIONS
              </label>
              <ConditionOperatorDropdown
                value={conditionOperator}
                onChange={setConditionOperator}
              />
            </div>
            <ConditionBuilder
              conditions={conditions}
              onChange={setConditions}
            />
          </div>

          {/* Actions */}
          <div>
            <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
              ACTIONS
            </label>
            <ActionBuilder actions={actions} onChange={setActions} />
          </div>

          {/* Priority */}
          <div>
            <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
              PRIORITY
            </label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              className="punk-input w-24 h-10 px-3 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-punk-border/30 shrink-0">
          <button
            onClick={onClose}
            className={cn(
              "px-3 py-1.5 text-[10px] font-punk-heading uppercase",
              "text-punk-text-muted hover:text-punk-text-primary"
            )}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={cn(
              "px-3 py-1.5 text-[10px] font-punk-heading uppercase",
              "bg-punk-accent text-white",
              "hover:bg-punk-accent/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {rule ? "UPDATE" : "CREATE"}
          </button>
        </div>
      </div>
    </div>
  )
}
