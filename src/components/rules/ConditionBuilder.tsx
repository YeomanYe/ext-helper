import * as React from "react"
import { Trash2, Plus, X, Calendar, ChevronDown, Clock } from "lucide-react"
import { cn } from "@/utils"
import { useClickOutside } from "@/hooks/useClickOutside"
import type { ConditionGroup, MatchMode } from "@/rules/types"
import { DAYS_OF_WEEK, MATCH_MODES } from "@/rules/types"

interface ConditionBuilderProps {
  conditions: ConditionGroup[]
  onChange: (conditions: ConditionGroup[]) => void
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const addConditionGroup = () => {
    const newGroup: ConditionGroup = {
      id: generateId(),
      domains: [""],
      matchMode: "wildcard",
      schedule: {
        days: [1, 2, 3, 4, 5],
        startTime: "09:00",
        endTime: "18:00",
      },
    }
    onChange([...conditions, newGroup])
  }

  const updateGroup = (index: number, updates: Partial<ConditionGroup>) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], ...updates }
    onChange(newConditions)
  }

  const removeGroup = (index: number) => {
    // Ensure at least one group remains
    if (conditions.length <= 1) return
    onChange(conditions.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {conditions.map((group, index) => (
        <ConditionGroupRow
          key={group.id}
          group={group}
          totalGroups={conditions.length}
          onChange={(updates) => updateGroup(index, updates)}
          onRemove={() => removeGroup(index)}
        />
      ))}

      {/* Add Condition Group Button */}
      <button
        onClick={addConditionGroup}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-3 py-2.5",
          "text-[13px] font-punk-heading uppercase tracking-wider",
          "border border-dashed border-punk-accent/30 text-punk-accent/70",
          "hover:border-punk-accent hover:text-punk-accent hover:bg-punk-accent/5",
          "transition-all duration-200"
        )}
      >
        <Plus className="h-3 w-3" />
        ADD CONDITION
      </button>
    </div>
  )
}

function ConditionGroupRow({
  group,
  totalGroups,
  onChange,
  onRemove,
}: {
  group: ConditionGroup
  totalGroups: number
  onChange: (updates: Partial<ConditionGroup>) => void
  onRemove: () => void
}) {
  // --- Domain handlers ---
  const addDomain = () => {
    onChange({ domains: [...group.domains, ""] })
  }

  const updateDomain = (index: number, value: string) => {
    const newDomains = [...group.domains]
    newDomains[index] = value
    onChange({ domains: newDomains })
  }

  const removeDomain = (index: number) => {
    if (group.domains.length <= 1) return // Keep at least one domain field
    onChange({ domains: group.domains.filter((_, i) => i !== index) })
  }

  // --- Schedule handlers ---
  const toggleSchedule = () => {
    if (group.schedule) {
      onChange({ schedule: null })
    } else {
      onChange({
        schedule: {
          days: [1, 2, 3, 4, 5],
          startTime: "09:00",
          endTime: "18:00",
        },
      })
    }
  }

  const updateSchedule = (updates: Partial<NonNullable<ConditionGroup["schedule"]>>) => {
    if (!group.schedule) return
    onChange({ schedule: { ...group.schedule, ...updates } })
  }

  const toggleDay = (day: number) => {
    if (!group.schedule) return
    const newDays = group.schedule.days.includes(day)
      ? group.schedule.days.filter((d) => d !== day)
      : [...group.schedule.days, day].sort()
    updateSchedule({ days: newDays })
  }

  return (
    <div className="border border-punk-border/30 bg-punk-bg p-3 space-y-3">
      {/* Header: Domains label + Match mode + Remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-punk-heading text-punk-accent uppercase tracking-wider">
            DOMAINS
          </span>
          <MatchModeDropdown
            value={group.matchMode}
            onChange={(matchMode) => onChange({ matchMode })}
          />
        </div>
        {totalGroups > 1 && (
          <button
            onClick={onRemove}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Domain inputs */}
      <div className="space-y-1.5">
        {group.domains.map((domain, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <input
              type="text"
              value={domain}
              onChange={(e) => updateDomain(index, e.target.value)}
              placeholder="*.example.com or github.com"
              className="punk-input flex-1 h-8 px-2.5 text-[11px]"
            />
            {group.domains.length > 1 && (
              <button
                onClick={() => removeDomain(index)}
                className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addDomain}
          className={cn(
            "flex items-center gap-1 text-[12px] font-punk-heading uppercase",
            "text-punk-accent/60 hover:text-punk-accent"
          )}
        >
          <Plus className="h-2.5 w-2.5" />
          ADD DOMAIN
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-punk-border/20" />

      {/* Time schedule section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-punk-success" />
            <span className="text-[12px] font-punk-heading text-punk-success uppercase tracking-wider">
              TIME (OPTIONAL)
            </span>
          </div>
          <button
            onClick={toggleSchedule}
            className={cn(
              "px-2 py-0.5 text-[12px] font-punk-heading uppercase transition-all",
              group.schedule
                ? "bg-punk-success/10 text-punk-success border border-punk-success/30"
                : "bg-punk-bg text-punk-text-muted border border-punk-border/30 hover:border-punk-success/30"
            )}
          >
            {group.schedule ? "ENABLED" : "DISABLED"}
          </button>
        </div>

        {group.schedule && (
          <div className="space-y-2 pl-5">
            {/* Days */}
            <div className="flex flex-wrap gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "w-7 h-6 text-[12px] font-punk-heading transition-all",
                    group.schedule!.days.includes(day.value)
                      ? "border border-punk-success/50 bg-punk-success/10 text-punk-success"
                      : "border border-punk-border/30 bg-punk-bg text-punk-text-muted hover:border-punk-success/30"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-punk-text-muted" />
              <input
                type="time"
                value={group.schedule.startTime}
                onChange={(e) => updateSchedule({ startTime: e.target.value })}
                className="punk-input h-8 px-2 text-[11px] border border-punk-border/50"
              />
              <span className="text-punk-text-muted text-[13px]">TO</span>
              <input
                type="time"
                value={group.schedule.endTime}
                onChange={(e) => updateSchedule({ endTime: e.target.value })}
                className="punk-input h-8 px-2 text-[11px] border border-punk-border/50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MatchModeDropdown({
  value,
  onChange,
}: {
  value: MatchMode
  onChange: (mode: MatchMode) => void
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const currentMode = MATCH_MODES.find((m) => m.value === value) || MATCH_MODES[0]
  const handleClose = React.useCallback(() => setShowDropdown(false), [])

  useClickOutside(dropdownRef, handleClose, showDropdown)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          "h-6 px-2 text-[12px] flex items-center gap-1",
          "border border-punk-border/50 bg-punk-bg-alt",
          "hover:border-punk-primary transition-colors"
        )}
      >
        <span className="font-punk-heading uppercase text-punk-text-secondary">
          {currentMode.label}
        </span>
        <ChevronDown className={cn("h-2.5 w-2.5 text-punk-text-muted", showDropdown && "rotate-180")} />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 z-50 w-44 border border-punk-border bg-punk-bg-alt shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          {MATCH_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => {
                onChange(mode.value)
                setShowDropdown(false)
              }}
              className={cn(
                "w-full px-2 py-1.5 text-left font-punk-heading text-[13px] uppercase tracking-wider transition-all",
                value === mode.value
                  ? "bg-punk-primary text-white"
                  : "text-punk-text-secondary hover:bg-punk-bg hover:text-punk-text-primary"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
