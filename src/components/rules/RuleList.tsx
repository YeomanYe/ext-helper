import { RuleCard } from "./RuleCard"
import type { Rule } from "@/rules/types"
import type { Extension, Group, ViewMode } from "@/types"

interface RuleListProps {
  rules: Rule[]
  extensions: Extension[]
  groups: Group[]
  onToggle: (id: string) => void
  onEdit: (rule: Rule) => void
  onDelete: (id: string) => void
  viewMode?: ViewMode
}

export function RuleList({ rules, extensions, groups, onToggle, onEdit, onDelete, viewMode = "card" }: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="font-punk-body text-[10px] text-punk-text-muted uppercase tracking-wider">
          NO_RULES_YET
        </p>
        <p className="font-punk-code text-[12px] text-punk-text-muted mt-1">
          CREATE A NEW RULE TO GET STARTED
        </p>
      </div>
    )
  }

  return (
    <div className={viewMode === "compact" ? "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2" : "flex flex-wrap gap-2"}>
      {rules.map((rule) => (
        <RuleCard
          key={rule.id}
          rule={rule}
          extensions={extensions}
          groups={groups}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          viewMode={viewMode}
          showDelete={true}
        />
      ))}
    </div>
  )
}
