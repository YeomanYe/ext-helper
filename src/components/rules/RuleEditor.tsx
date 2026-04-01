import * as React from "react"
import { X, Image, Upload } from "lucide-react"
import { cn } from "@/utils"
import { ConditionBuilder } from "./ConditionBuilder"
import { ActionBuilder } from "./ActionBuilder"
import type {
  Rule,
  ConditionGroup,
  Action,
} from "@/rules/types"

interface RuleEditorProps {
  rule: Rule | null
  onSave: (data: Omit<Rule, "id" | "createdAt" | "updatedAt" | "triggerCount">) => void
  onClose: () => void
}

// Helper to create a default condition group
function createDefaultConditionGroup(): ConditionGroup {
  return {
    id: Math.random().toString(36).substring(2, 9),
    domains: [""],
    matchMode: "wildcard",
    schedule: {
      days: [1, 2, 3, 4, 5],
      startTime: "09:00",
      endTime: "18:00",
    },
  }
}

export function RuleEditor({ rule, onSave, onClose }: RuleEditorProps) {
  const [name, setName] = React.useState(rule?.name || "")
  const [description, setDescription] = React.useState(rule?.description || "")
  const [iconUrl, setIconUrl] = React.useState(rule?.iconUrl || "")
  // Always have at least one condition group
  const [conditionGroups, setConditionGroups] = React.useState<ConditionGroup[]>(
    rule?.conditionGroups?.length ? rule.conditionGroups : [createDefaultConditionGroup()]
  )
  const [actions, setActions] = React.useState<Action[]>(rule?.actions || [])
  const [priority, setPriority] = React.useState(rule?.priority || 0)

  const isValid = name.trim() && conditionGroups.length > 0 && actions.length > 0

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

    // Always use "OR" - match any condition
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      iconUrl: iconUrl.trim() || undefined,
      conditionGroups,
      conditionOperator: "OR",
      actions,
      priority,
      enabled: rule?.enabled ?? true,
    })
  }

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setIconUrl(event.target?.result as string || "")
      }
      reader.readAsDataURL(file)
    }
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
          {/* Name & Icon */}
          <div className="flex gap-4">
            {/* Icon Upload - centered with right side content */}
            <div className="flex-shrink-0 flex items-start">
              <div className="relative w-[96px] h-[96px] border border-punk-border/50 bg-punk-bg rounded overflow-hidden group">
                {iconUrl ? (
                  <>
                    <img
                      src={iconUrl}
                      alt="Rule icon"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-punk-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer p-2 text-punk-text-muted hover:text-punk-accent transition-colors">
                        <Upload className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-punk-bg-alt transition-colors">
                    <Image className="h-6 w-6 text-punk-text-muted mb-1" />
                    <span className="text-[6px] text-punk-text-muted uppercase">UPLOAD</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name & Description Stack */}
            <div className="flex-1 space-y-4">
              {/* Rule Name & Priority on same row */}
              <div className="flex gap-4">
                <div className="flex-1">
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
                <div className="w-24">
                  <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
                    PRIORITY
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                    className="punk-input w-full h-10 px-3 text-sm"
                  />
                </div>
              </div>
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
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
              CONDITIONS (MATCH ANY)
            </label>
            <ConditionBuilder
              conditions={conditionGroups}
              onChange={setConditionGroups}
            />
          </div>

          {/* Actions */}
          <div>
            <label className="block font-punk-heading text-[9px] text-punk-text-muted uppercase mb-1.5">
              ACTIONS
            </label>
            <ActionBuilder actions={actions} onChange={setActions} />
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
