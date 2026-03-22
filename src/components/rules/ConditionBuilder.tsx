import { Trash2, Globe, Clock, Calendar } from "lucide-react"
import { cn } from "@/utils"
import type {
  Condition,
  DomainCondition,
  TimeCondition,
  DayOfWeekCondition,
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
      case "time":
        newCondition = {
          type: "time",
          startTime: "09:00",
          endTime: "18:00",
        } as TimeCondition
        break
      case "dayOfWeek":
        newCondition = {
          type: "dayOfWeek",
          days: [1, 2, 3, 4, 5],
        } as DayOfWeekCondition
        break
    }

    onChange([...conditions, newCondition])
  }

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const currentCondition = conditions[index]
    const newConditions = [...conditions]

    if (currentCondition.type === "domain" && updates.type !== "domain") {
      newConditions[index] = { ...currentCondition, ...updates } as Condition
    } else if (currentCondition.type === "time" && updates.type !== "time") {
      newConditions[index] = { ...currentCondition, ...updates } as Condition
    } else if (currentCondition.type === "dayOfWeek" && updates.type !== "dayOfWeek") {
      newConditions[index] = { ...currentCondition, ...updates } as Condition
    } else {
      newConditions[index] = { ...currentCondition, ...updates } as Condition
    }

    onChange(newConditions)
  }

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index))
  }

  const toggleDay = (condition: DayOfWeekCondition, day: number) => {
    const newDays = condition.days.includes(day)
      ? condition.days.filter((d) => d !== day)
      : [...condition.days, day].sort()
    updateCondition(
      conditions.indexOf(condition),
      { days: newDays } as Partial<DayOfWeekCondition>
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
              condition.type === "time" &&
                "text-punk-success bg-punk-success/5",
              condition.type === "dayOfWeek" &&
                "text-punk-warning bg-punk-warning/5"
            )}
          >
            {condition.type === "domain" && (
              <Globe className="h-3 w-3" />
            )}
            {condition.type === "time" && <Clock className="h-3 w-3" />}
            {condition.type === "dayOfWeek" && (
              <Calendar className="h-3 w-3" />
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-2">
            {condition.type === "domain" && (
              <DomainConditionFields
                condition={condition as DomainCondition}
                onChange={(updates) => updateCondition(index, updates)}
              />
            )}
            {condition.type === "time" && (
              <TimeConditionFields
                condition={condition as TimeCondition}
                onChange={(updates) => updateCondition(index, updates)}
              />
            )}
            {condition.type === "dayOfWeek" && (
              <DayOfWeekConditionFields
                condition={condition as DayOfWeekCondition}
                onToggleDay={(day) => toggleDay(condition as DayOfWeekCondition, day)}
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
          onClick={() => addCondition("time")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-success/30 text-punk-success/70",
            "hover:border-punk-success hover:text-punk-success"
          )}
        >
          <Clock className="h-3 w-3" />
          TIME
        </button>
        <button
          onClick={() => addCondition("dayOfWeek")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-warning/30 text-punk-warning/70",
            "hover:border-punk-warning hover:text-punk-warning"
          )}
        >
          <Calendar className="h-3 w-3" />
          DAY
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
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={condition.pattern}
        onChange={(e) => onChange({ pattern: e.target.value })}
        placeholder="*.example.com or github.com"
        className="punk-input w-full h-8 px-2 text-[9px]"
      />
      <select
        value={condition.matchMode}
        onChange={(e) =>
          onChange({ matchMode: e.target.value as MatchMode })
        }
        className="punk-input w-full h-7 px-2 text-[8px]"
      >
        {MATCH_MODES.map((mode) => (
          <option key={mode.value} value={mode.value}>
            {mode.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function TimeConditionFields({
  condition,
  onChange,
}: {
  condition: TimeCondition
  onChange: (updates: Partial<TimeCondition>) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={condition.startTime}
        onChange={(e) => onChange({ startTime: e.target.value })}
        className="punk-input h-7 px-2 text-[9px]"
      />
      <span className="text-punk-text-muted text-[8px]">TO</span>
      <input
        type="time"
        value={condition.endTime}
        onChange={(e) => onChange({ endTime: e.target.value })}
        className="punk-input h-7 px-2 text-[9px]"
      />
    </div>
  )
}

function DayOfWeekConditionFields({
  condition,
  onToggleDay,
}: {
  condition: DayOfWeekCondition
  onToggleDay: (day: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {DAYS_OF_WEEK.map((day) => (
        <button
          key={day.value}
          onClick={() => onToggleDay(day.value)}
          className={cn(
            "w-8 h-7 text-[8px] font-punk-heading transition-all",
            condition.days.includes(day.value)
              ? "border border-punk-warning/50 bg-punk-warning/10 text-punk-warning"
              : "border border-punk-border/30 bg-punk-bg text-punk-text-muted"
          )}
        >
          {day.label}
        </button>
      ))}
    </div>
  )
}
