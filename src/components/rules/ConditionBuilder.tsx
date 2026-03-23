import * as React from "react"
import { Trash2, Globe, Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/utils"
import type {
  Condition,
  DomainCondition,
  ScheduleCondition,
  MatchMode,
} from "@/rules/types"
import { DAYS_OF_WEEK, MATCH_MODES } from "@/rules/types"

interface ConditionBuilderProps {
  conditions: Condition[]
  onChange: (conditions: Condition[]) => void
}

export function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const addCondition = (type: Condition["type"]) => {
    let newCondition: Condition

    switch (type) {
      case "domain":
        newCondition = {
          type: "domain",
          pattern: "",
          matchMode: "wildcard",
        } as DomainCondition
        break
      case "schedule":
        newCondition = {
          type: "schedule",
          days: [1, 2, 3, 4, 5], // Mon-Fri default
          startTime: "09:00",
          endTime: "18:00",
        } as ScheduleCondition
        break
      default:
        return
    }

    onChange([...conditions, newCondition])
  }

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const currentCondition = conditions[index]
    const newConditions = [...conditions]

    if (currentCondition.type === "domain" && updates.type !== "domain") {
      newConditions[index] = { ...currentCondition, ...updates } as Condition
    } else if (currentCondition.type === "schedule" && updates.type !== "schedule") {
      newConditions[index] = { ...currentCondition, ...updates } as Condition
    } else {
      newConditions[index] = { ...currentCondition, ...updates } as Condition
    }

    onChange(newConditions)
  }

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index))
  }

  const toggleDay = (condition: ScheduleCondition, day: number) => {
    const newDays = condition.days.includes(day)
      ? condition.days.filter((d) => d !== day)
      : [...condition.days, day].sort()
    updateCondition(
      conditions.indexOf(condition),
      { days: newDays } as Partial<ScheduleCondition>
    )
  }

  return (
    <div className="space-y-2">
      {conditions.map((condition, index) => (
        <div
          key={index}
          className="flex items-start gap-2 p-2.5 border border-punk-border/30 bg-punk-bg"
        >
          {/* Icon */}
          <div
            className={cn(
              "mt-0.5 p-1 border border-punk-border/30",
              condition.type === "domain" &&
                "text-punk-accent bg-punk-accent/5",
              condition.type === "schedule" &&
                "text-punk-success bg-punk-success/5"
            )}
          >
            {condition.type === "domain" && <Globe className="h-3 w-3" />}
            {condition.type === "schedule" && <Calendar className="h-3 w-3" />}
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-2">
            {condition.type === "domain" && (
              <DomainConditionFields
                condition={condition as DomainCondition}
                onChange={(updates) => updateCondition(index, updates)}
              />
            )}
            {condition.type === "schedule" && (
              <ScheduleConditionFields
                condition={condition as ScheduleCondition}
                onChange={(updates) => updateCondition(index, updates)}
                onToggleDay={(day) => toggleDay(condition as ScheduleCondition, day)}
              />
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => removeCondition(index)}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Add Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => addCondition("domain")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-accent/30 text-punk-accent/70",
            "hover:border-punk-accent hover:text-punk-accent"
          )}
        >
          <Globe className="h-3 w-3" />
          DOMAIN
        </button>
        <button
          onClick={() => addCondition("schedule")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-success/30 text-punk-success/70",
            "hover:border-punk-success hover:text-punk-success"
          )}
        >
          <Calendar className="h-3 w-3" />
          SCHEDULE
        </button>
      </div>
    </div>
  )
}

function DomainConditionFields({
  condition,
  onChange,
}: {
  condition: DomainCondition
  onChange: (updates: Partial<DomainCondition>) => void
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const currentMode = MATCH_MODES.find(m => m.value === condition.matchMode) || MATCH_MODES[0]

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
    <div className="space-y-2">
      <input
        type="text"
        value={condition.pattern}
        onChange={(e) => onChange({ pattern: e.target.value })}
        placeholder="*.example.com or github.com"
        className="punk-input w-full h-9 px-3 text-sm"
      />

      {/* Match Mode Dropdown - Styled */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            "w-full h-8 px-2 text-[9px] flex items-center justify-between",
            "border border-punk-border/50 bg-punk-bg-alt",
            "hover:border-punk-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.2)]",
            "transition-all duration-200"
          )}
        >
          <span className="font-punk-heading uppercase tracking-wide text-punk-text-primary">
            {currentMode.label}
          </span>
          <ChevronDown className={cn("h-3 w-3 text-punk-text-muted transition-transform", showDropdown && "rotate-180")} />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full border border-punk-border bg-punk-bg-alt shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            {MATCH_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  onChange({ matchMode: mode.value })
                  setShowDropdown(false)
                }}
                className={cn(
                  "w-full px-2 py-1.5 text-left font-punk-heading text-[8px] uppercase tracking-wide transition-all",
                  condition.matchMode === mode.value
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
    </div>
  )
}

function ScheduleConditionFields({
  condition,
  onChange,
  onToggleDay,
}: {
  condition: ScheduleCondition
  onChange: (updates: Partial<ScheduleCondition>) => void
  onToggleDay: (day: number) => void
}) {
  return (
    <div className="space-y-2">
      {/* Days */}
      <div className="flex flex-wrap gap-1">
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day.value}
            onClick={() => onToggleDay(day.value)}
            className={cn(
              "w-8 h-7 text-[8px] font-punk-heading transition-all",
              condition.days.includes(day.value)
                ? "border border-punk-success/50 bg-punk-success/10 text-punk-success"
                : "border border-punk-border/30 bg-punk-bg text-punk-text-muted"
            )}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Time Range */}
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={condition.startTime}
          onChange={(e) => onChange({ startTime: e.target.value })}
          className="punk-input h-9 px-3 text-sm border border-punk-border/50"
        />
        <span className="text-punk-text-muted text-[9px]">TO</span>
        <input
          type="time"
          value={condition.endTime}
          onChange={(e) => onChange({ endTime: e.target.value })}
          className="punk-input h-9 px-3 text-sm border border-punk-border/50"
        />
      </div>
    </div>
  )
}
