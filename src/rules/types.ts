// ============================================================
// 规则系统类型定义
// ============================================================

// ---------- 条件类型 ----------

export type ConditionType = "domain" | "schedule"
export type MatchMode = "exact" | "contains" | "wildcard" | "regex"
export type ConditionOperator = "AND" | "OR"

// 域名条件 - 支持多个域名 pattern
export interface DomainCondition {
  type: "domain"
  patterns: string[] // 支持多个域名
  matchMode: MatchMode
}

// 时间表的结构形状（星期 + 起止时间）。被 ScheduleCondition（带 type 判别）
// 与 ConditionGroup.schedule（内联无 type）共用，是 isScheduleMatch 实际消费的字段集。
export interface ScheduleSpec {
  days: number[] // 0=周日, 1=周一, ..., 6=周六
  startTime: string // "HH:mm" 格式
  endTime: string // "HH:mm" 格式
}

// 时间表条件 (合并时间和星期)
export interface ScheduleCondition extends ScheduleSpec {
  type: "schedule"
}

// 条件组：域名列表 + 时间条件（视觉和逻辑上分组）
export interface ConditionGroup {
  id: string // 条件组唯一ID
  domains: string[] // 多个域名
  matchMode: MatchMode // 匹配模式（适用于所有域名）
  schedule: ScheduleSpec | null // 可选，不设置表示不限时间
}

// 联合条件类型（兼容旧数据）
export type Condition = DomainCondition | ScheduleCondition | ConditionGroup

// ---------- 动作类型 ----------

export type ActionType = "enableExtension" | "disableExtension" | "enableGroup" | "disableGroup"

export interface Action {
  type: ActionType
  targetId: string // 扩展ID 或 分组ID
}

// ---------- 规则类型 ----------

export interface Rule {
  id: string
  name: string
  description?: string
  iconUrl?: string
  enabled: boolean
  conditionGroups: ConditionGroup[]
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
  createRule: (rule: Omit<Rule, "id" | "createdAt" | "updatedAt" | "triggerCount">) => Promise<void>
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
