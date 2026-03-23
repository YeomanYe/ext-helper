// ============================================================
// 规则引擎
// ============================================================

import type { Action, Condition, ConditionOperator, ScheduleCondition } from "./types"
import { domainMatcher } from "./domainMatcher"
import { browserAdapter } from "@/services/browser/adapter"
import { RULES_STORAGE_KEY } from "./constants"

export class RuleEngine {
  /**
   * 评估域名条件
   */
  evaluateDomainConditions(
    conditions: Condition[],
    operator: ConditionOperator,
    url: string
  ): boolean {
    const domainConditions = conditions.filter((c) => c.type === "domain")
    if (domainConditions.length === 0) return false

    const results = domainConditions.map((condition) => {
      if (condition.type !== "domain") return false
      return domainMatcher.matches(
        condition.pattern,
        condition.matchMode,
        url
      )
    })

    return this.combineResults(results, operator)
  }

  /**
   * 评估时间表条件
   */
  evaluateScheduleConditions(
    conditions: Condition[],
    operator: ConditionOperator
  ): boolean {
    const scheduleConditions = conditions.filter((c) => c.type === "schedule")
    if (scheduleConditions.length === 0) return false

    const results = scheduleConditions.map((condition) => {
      if (condition.type !== "schedule") return false
      return this.isScheduleMatch(condition as ScheduleCondition)
    })

    return this.combineResults(results, operator)
  }

  /**
   * 评估所有条件
   */
  evaluateConditions(
    conditions: Condition[],
    operator: ConditionOperator,
    url?: string
  ): boolean {
    const results: boolean[] = []

    // 评估域名条件
    const domainResults = conditions
      .filter((c) => c.type === "domain")
      .map((c) => {
        if (c.type !== "domain") return false
        return url ? domainMatcher.matches(c.pattern, c.matchMode, url) : false
      })
    results.push(...domainResults)

    // 评估时间表条件
    const scheduleResults = conditions
      .filter((c) => c.type === "schedule")
      .map((c) => {
        if (c.type !== "schedule") return false
        return this.isScheduleMatch(c as ScheduleCondition)
      })
    results.push(...scheduleResults)

    if (results.length === 0) return false

    return this.combineResults(results, operator)
  }

  /**
   * 组合结果
   */
  private combineResults(
    results: boolean[],
    operator: ConditionOperator
  ): boolean {
    if (results.length === 0) return false
    return operator === "AND"
      ? results.every(Boolean)
      : results.some(Boolean)
  }

  /**
   * 检查时间范围
   */
  isWithinTimeRange(start: string, end: string): boolean {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startH, startM] = start.split(":").map(Number)
    const [endH, endM] = end.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    // 跨天情况 (e.g., 22:00 - 06:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  /**
   * 检查星期
   */
  isDayMatch(days: number[]): boolean {
    const today = new Date().getDay()
    return days.includes(today)
  }

  /**
   * 检查时间表条件 (星期 + 时间范围)
   */
  isScheduleMatch(schedule: ScheduleCondition): boolean {
    // 检查星期
    const today = new Date().getDay()
    if (!schedule.days.includes(today)) return false

    // 检查时间范围
    return this.isWithinTimeRange(schedule.startTime, schedule.endTime)
  }

  /**
   * 执行动作
   */
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
        console.error(`Failed to execute action ${action.type}:`, error)
      }
    }
  }

  /**
   * 批量切换分组扩展
   */
  private async toggleGroupExtensions(
    groupId: string,
    enabled: boolean
  ): Promise<void> {
    const groups = await browserAdapter.getStorage("ext-helper-groups") || []
    const group = groups.find((g: any) => g.id === groupId)

    if (group) {
      for (const extId of group.extensionIds) {
        try {
          await browserAdapter.setExtensionEnabled(extId, enabled)
        } catch (error) {
          console.error(
            `Failed to ${enabled ? "enable" : "disable"} extension ${extId}:`,
            error
          )
        }
      }
    }
  }

  /**
   * 记录规则触发
   */
  async recordTrigger(ruleId: string): Promise<void> {
    const rules = (await browserAdapter.getStorage(RULES_STORAGE_KEY)) || []
    const newRules = rules.map((r: any) =>
      r.id === ruleId
        ? {
            ...r,
            lastTriggeredAt: Date.now(),
            triggerCount: (r.triggerCount || 0) + 1,
          }
        : r
    )
    await browserAdapter.setStorage(RULES_STORAGE_KEY, newRules)
  }
}

export const ruleEngine = new RuleEngine()
