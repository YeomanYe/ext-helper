import * as React from "react"
import { Plus, X, ChevronDown } from "lucide-react"
import { cn } from "@/utils"
import { useRuleStore } from "@/stores/ruleStore"
import { useExtensionStore } from "@/stores/extensionStore"
import { useGroupStore } from "@/stores/groupStore"
import { useUIStore } from "@/stores/uiStore"
import { RuleList } from "./RuleList"
import { RuleEditor } from "./RuleEditor"
import type { Rule } from "@/rules/types"

type RuleFilterType = "all" | "enabled" | "disabled" | "has-group" | "no-group"

const FILTERS: { value: RuleFilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "enabled", label: "ON" },
  { value: "disabled", label: "OFF" },
  { value: "has-group", label: "HAS_GRP" },
  { value: "no-group", label: "NO_GRP" },
]

function RuleFilterDropdown({
  value,
  onChange,
}: {
  value: RuleFilterType
  onChange: (v: RuleFilterType) => void
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [dropUp, setDropUp] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const handleToggle = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < FILTERS.length * 36 + 8)
    }
    setShowDropdown((v) => !v)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-2 px-3 h-9",
          "border border-punk-border/50 bg-punk-bg-alt",
          "font-punk-heading text-[13px] uppercase tracking-wider",
          "text-punk-text-primary",
          "hover:border-punk-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.3)]",
          "transition-all duration-200"
        )}
      >
        <span className="inline-grid">
          {FILTERS.map((f) => (
            <span
              key={f.value}
              className={cn(
                "col-start-1 row-start-1",
                f.value !== value && "invisible select-none"
              )}
              aria-hidden={f.value !== value ? "true" : undefined}
            >
              {f.label}
            </span>
          ))}
        </span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", showDropdown && "rotate-180")} />
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div
            className={cn(
              "absolute left-0 z-50 min-w-full border border-punk-border bg-punk-bg-alt shadow-[0_0_20px_rgba(124,58,237,0.3)]",
              dropUp ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  onChange(filter.value)
                  setShowDropdown(false)
                }}
                className={cn(
                  "w-full px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider",
                  "transition-all duration-150",
                  value === filter.value
                    ? "bg-punk-primary text-white"
                    : "text-punk-text-secondary hover:bg-punk-bg hover:text-punk-text-primary"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RuleSearchBar({
  value,
  onChange,
  filter,
  onFilterChange,
}: {
  value: string
  onChange: (v: string) => void
  filter: RuleFilterType
  onFilterChange: (v: RuleFilterType) => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-b border-punk-border/30">
      <RuleFilterDropdown value={filter} onChange={onFilterChange} />

      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-punk-body text-punk-accent text-lg">
          $
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search rules..."
          className={cn(
            "punk-input h-9 w-full pl-9 pr-10 text-punk-text-primary",
            "font-punk-body text-sm"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-punk-text-muted hover:text-punk-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function RuleManager() {
  const { rules, fetchRules, createRule, updateRule, deleteRule, toggleRule } = useRuleStore()
  const { extensions } = useExtensionStore()
  const { groups } = useGroupStore()
  const { viewMode } = useUIStore()
  const [showEditor, setShowEditor] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<Rule | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState<RuleFilterType>("all")

  React.useEffect(() => {
    fetchRules()
  }, [])

  const filteredRules = React.useMemo(() => {
    let result = rules

    // Filter by status
    if (filter === "enabled") {
      result = result.filter((r) => r.enabled)
    } else if (filter === "disabled") {
      result = result.filter((r) => !r.enabled)
    } else if (filter === "has-group") {
      result = result.filter((r) =>
        r.actions.some((a) => a.type === "enableGroup" || a.type === "disableGroup")
      )
    } else if (filter === "no-group") {
      result = result.filter((r) =>
        r.actions.every((a) => a.type === "enableExtension" || a.type === "disableExtension")
      )
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) => r.name.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query)
      )
    }

    return result
  }, [rules, searchQuery, filter])

  const handleCreateRule = () => {
    setEditingRule(null)
    setShowEditor(true)
  }

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule)
    setShowEditor(true)
  }

  const handleSaveRule = async (ruleData: any) => {
    if (editingRule) {
      await updateRule(editingRule.id, ruleData)
    } else {
      await createRule(ruleData)
    }
    setShowEditor(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-punk-border/30">
        <div className="flex items-center gap-2">
          <span className="font-punk-heading text-[13px] text-punk-text-primary uppercase tracking-wider">
            AUTO_RULES
          </span>
          <span className="font-punk-code text-[13px] text-punk-accent">[{rules.length}]</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={handleCreateRule}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-punk-heading uppercase",
            "border border-punk-accent/50 text-punk-accent",
            "hover:bg-punk-accent/10 hover:border-punk-accent transition-all"
          )}
        >
          <Plus className="h-3 w-3" />
          NEW
        </button>
      </div>

      {/* Search */}
      <RuleSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Results count */}
      {(searchQuery || filter !== "all") && (
        <div className="px-3 py-1 bg-punk-bg/50">
          <span className="text-xs text-punk-text-muted">
            {filteredRules.length} / {rules.length} rules
          </span>
        </div>
      )}

      {/* Rule List */}
      <div className="flex-1 overflow-y-auto p-3">
        <RuleList
          rules={filteredRules}
          extensions={extensions}
          groups={groups}
          onToggle={toggleRule}
          onEdit={handleEditRule}
          onDelete={deleteRule}
          viewMode={viewMode}
        />
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <RuleEditor
          rule={editingRule}
          onSave={handleSaveRule}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
