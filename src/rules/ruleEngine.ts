// ============================================================
// 规则引擎
// ============================================================

import type {
  Action,
  ConditionGroup,
  ConditionOperator,
  MatchMode,
  Rule,
  ScheduleCondition,
} from "./types"
import { domainMatcher } from "./domainMatcher"
import { browserAdapter } from "@/services/browser/adapter"
import { groupsRepo } from "@/services/groupsRepo"
import { rulesRepo } from "@/services/rulesRepo"
import { logger } from "@/utils/logger"

// 旧版持久化条件的数据形状（migration 前）。仅下方「兼容旧数据」评估方法消费；
// 新数据模型用 ConditionGroup（patterns 复数）。旧 domain 条件是单数 pattern。
type LegacyDomainCondition = { type: "domain"; pattern: string; matchMode: MatchMode }
type LegacyCondition = LegacyDomainCondition | ScheduleCondition

export class RuleEngine {
  /**
   * 评估单个 ConditionGroup（新数据模型）
   * - domains 为空或全为空字符串 → 匹配所有网站
   * - schedule 为 null → 不限时间
   */
  evaluateConditionGroup(group: ConditionGroup, url: string): boolean {
    const nonEmptyDomains = group.domains.filter((d) => d.trim())
    const domainMatch =
      nonEmptyDomains.length === 0
        ? true
        : nonEmptyDomains.some((domain) => domainMatcher.matches(domain, group.matchMode, url))

    if (!domainMatch) return false

    if (!group.schedule) return true
    return this.isScheduleMatch(group.schedule as ScheduleCondition)
  }

  /**
   * 评估 ConditionGroup 列表（新数据模型，供 background 使用）
   */
  evaluateConditionGroups(
    groups: ConditionGroup[] | undefined,
    operator: ConditionOperator,
    url: string
  ): boolean {
    if (!groups || groups.length === 0) return false
    const results = groups.map((g) => this.evaluateConditionGroup(g, url))
    return this.combineResults(results, operator)
  }

  /**
   * 评估域名条件（兼容旧数据）
   */
  evaluateDomainConditions(
    conditions: LegacyCondition[],
    operator: ConditionOperator,
    url: string
  ): boolean {
    const domainConditions = conditions.filter(
      (c): c is LegacyDomainCondition => c.type === "domain"
    )
    if (domainConditions.length === 0) return false

    const results = domainConditions.map((condition) =>
      domainMatcher.matches(condition.pattern, condition.matchMode, url)
    )

    return this.combineResults(results, operator)
  }

  /**
   * 评估时间表条件（兼容旧数据）
   */
  evaluateScheduleConditions(conditions: LegacyCondition[], operator: ConditionOperator): boolean {
    const scheduleConditions = conditions.filter(
      (c): c is ScheduleCondition => c.type === "schedule"
    )
    if (scheduleConditions.length === 0) return false

    const results = scheduleConditions.map((condition) => this.isScheduleMatch(condition))

    return this.combineResults(results, operator)
  }

  /**
   * 评估所有条件（兼容旧数据）
   */
  evaluateConditions(
    conditions: LegacyCondition[],
    operator: ConditionOperator,
    url?: string
  ): boolean {
    const results: boolean[] = []

    const domainResults = conditions
      .filter((c): c is LegacyDomainCondition => c.type === "domain")
      .map((c) => (url ? domainMatcher.matches(c.pattern, c.matchMode, url) : false))
    results.push(...domainResults)

    const scheduleResults = conditions
      .filter((c): c is ScheduleCondition => c.type === "schedule")
      .map((c) => this.isScheduleMatch(c))
    results.push(...scheduleResults)

    if (results.length === 0) return false

    return this.combineResults(results, operator)
  }

  private combineResults(results: boolean[], operator: ConditionOperator): boolean {
    if (results.length === 0) return false
    return operator === "AND" ? results.every(Boolean) : results.some(Boolean)
  }

  isWithinTimeRange(start: string, end: string): boolean {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startH, startM] = start.split(":").map(Number)
    const [endH, endM] = end.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  isDayMatch(days: number[]): boolean {
    const today = new Date().getDay()
    return days.includes(today)
  }

  isScheduleMatch(schedule: ScheduleCondition): boolean {
    const today = new Date().getDay()
    if (!schedule.days.includes(today)) return false
    return this.isWithinTimeRange(schedule.startTime, schedule.endTime)
  }

  async executeActions(actions: Action[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case "enableExtension":
          case "disableExtension": {
            const enabled = action.type === "enableExtension"
            await browserAdapter.setExtensionEnabled(action.targetId, enabled)
            break
          }
          case "enableGroup":
          case "disableGroup": {
            const enabled = action.type === "enableGroup"
            await this.toggleGroupExtensions(action.targetId, enabled)
            break
          }
        }
      } catch (error) {
        logger.error(`Failed to execute action ${action.type}:`, error)
      }
    }
  }

  private async toggleGroupExtensions(groupId: string, enabled: boolean): Promise<void> {
    const groups = await groupsRepo.fetchAll()
    const group = groups.find((g) => g.id === groupId)

    if (group) {
      for (const extId of group.extensionIds) {
        try {
          await browserAdapter.setExtensionEnabled(extId, enabled)
        } catch (error) {
          logger.error(`Failed to ${enabled ? "enable" : "disable"} extension ${extId}:`, error)
        }
      }
    }
  }

  async recordTrigger(ruleId: string): Promise<void> {
    const rules = await rulesRepo.fetchAll()
    const updated = rules.map((r: Rule) =>
      r.id === ruleId
        ? { ...r, lastTriggeredAt: Date.now(), triggerCount: (r.triggerCount || 0) + 1 }
        : r
    )
    await rulesRepo.saveAll(updated)
  }
}

export const ruleEngine = new RuleEngine()
