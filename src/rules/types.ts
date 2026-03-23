// ============================================================
// 规则系统类型定义
// ============================================================

// ---------- 条件类型 ----------

export type ConditionType = "domain" | "schedule"
export type MatchMode = "exact" | "contains" | "wildcard" | "regex"
export type ConditionOperator = "AND" | "OR"

// 域名条件
export interface DomainCondition {
  type: "domain"
  pattern: string
  matchMode: MatchMode
}

// 时间表条件 (合并时间和星期)
export interface ScheduleCondition {
  type: "schedule"
  days: number[] // 0=周日, 1=周一, ..., 6=周六
  startTime: string // "HH:mm" 格式
  endTime: string // "HH:mm" 格式
}

// 联合条件类型
export type Condition = DomainCondition | ScheduleCondition

// ---------- 动作类型 ----------

export type ActionType =
  | "enableExtension"
  | "disableExtension"
  | "enableGroup"
  | "disableGroup"

export interface Action {
  type: ActionType
  targetId: string // 扩展ID 或 分组ID
}

// ---------- 规则类型 ----------

export interface Rule {
  id: string
  name: string
  description?: string
  enabled: boolean
  conditions: Condition[]
  conditionOperator: ConditionOperator
  actions: Action[]
  priority: number
  createdAt: number
  updatedAt: number
  lastTriggeredAt?: number
  triggerCount: number
}

// ---------- Store 类型 ----------

export interface RuleStore {
  rules: Rule[]
  loading: boolean
  error: string | null
  fetchRules: () => Promise<void>
  createRule: (
    rule: Omit<Rule, "id" | "createdAt" | "updatedAt" | "triggerCount">
  ) => Promise<void>
  updateRule: (id: string, updates: Partial<Rule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string) => Promise<void>
  duplicateRule: (id: string) => Promise<void>
}

// ---------- 辅助类型 ----------

export interface RuleSettings {
  enableScheduler: boolean
  schedulerInterval: number // 毫秒
  enableDomainDetection: boolean
  domainDetectionDebounce: number // 毫秒
}

// ---------- 常量 ----------

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const

export const MATCH_MODES: { value: MatchMode; label: string }[] = [
  { value: "wildcard", label: "Wildcard (*.example.com)" },
  { value: "exact", label: "Exact Match" },
  { value: "contains", label: "Contains" },
  { value: "regex", label: "Regular Expression" },
]
