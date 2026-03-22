// ============================================================
// 规则引擎
// ============================================================

import type { Action, Condition, ConditionOperator } from "./types"
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
   * 评估时间条件
   */
  evaluateTimeConditions(
    conditions: Condition[],
    operator: ConditionOperator
  ): boolean {
    const timeConditions = conditions.filter(
      (c) => c.type === "time" || c.type === "dayOfWeek"
    )
    if (timeConditions.length === 0) return false

    const results = timeConditions.map((condition) => {
      if (condition.type === "time") {
        return this.isWithinTimeRange(condition.startTime, condition.endTime)
      }
      if (condition.type === "dayOfWeek") {
        return this.isDayMatch(condition.days)
      }
      return false
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

    // 评估时间条件
    const timeResults = conditions
      .filter((c) => c.type === "time" || c.type === "dayOfWeek")
      .map((c) => {
        if (c.type === "time") {
          return this.isWithinTimeRange(c.startTime, c.endTime)
        }
        if (c.type === "dayOfWeek") {
          return this.isDayMatch(c.days)
        }
        return false
      })
    results.push(...timeResults)

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
