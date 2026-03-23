import * as React from "react"
import { Search, Plus } from "lucide-react"
import { cn } from "@/utils"
import { useRuleStore } from "@/stores/ruleStore"
import { useExtensionStore } from "@/stores/extensionStore"
import { useGroupStore } from "@/stores/groupStore"
import { RuleList } from "./RuleList"
import { RuleEditor } from "./RuleEditor"
import type { Rule } from "@/rules/types"

export function RuleManager() {
  const { rules, fetchRules, createRule, updateRule, deleteRule, toggleRule } =
    useRuleStore()
  const { extensions } = useExtensionStore()
  const { groups } = useGroupStore()
  const [showEditor, setShowEditor] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<Rule | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    fetchRules()
  }, [])

  const filteredRules = React.useMemo(() => {
    if (!searchQuery.trim()) return rules
    const query = searchQuery.toLowerCase()
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
    )
  }, [rules, searchQuery])

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
      <div className="flex items-center gap-2 px-4 py-3 border-b border-punk-border/30">
        <div className="flex items-center gap-2">
          <span className="font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wide">
            AUTO_RULES
          </span>
          <span className="font-punk-code text-[10px] text-punk-accent">
            [{rules.length}]
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={handleCreateRule}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-punk-accent/50 text-punk-accent",
            "hover:bg-punk-accent/10 hover:border-punk-accent transition-all"
          )}
        >
          <Plus className="h-3 w-3" />
          NEW
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-punk-border/20">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-punk-accent" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH RULES..."
            className="punk-input w-full h-8 pl-8 pr-3 text-[10px]"
          />
        </div>
      </div>

      {/* Rule List */}
      <div className="flex-1 overflow-y-auto p-3">
        <RuleList
          rules={filteredRules}
          extensions={extensions}
          groups={groups}
          onToggle={toggleRule}
          onEdit={handleEditRule}
          onDelete={deleteRule}
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
