// ============================================================
// Background Script - 规则自动执行服务
// ============================================================

import { browserAdapter } from "@/services/browser/adapter"
import { RULES_STORAGE_KEY, RULE_SETTINGS_KEY, DEFAULT_RULE_SETTINGS, RULE_ALARM_NAME } from "@/rules/constants"
import { ruleEngine } from "@/rules/ruleEngine"
import type { Rule, RuleSettings } from "@/rules/types"

class RuleBackgroundService {
  /**
   * 获取设置（每次从 storage 读取，避免 Service Worker 挂起后内存丢失）
   */
  private async getSettings(): Promise<RuleSettings> {
    const storedSettings = await browserAdapter.getStorage(RULE_SETTINGS_KEY)
    return { ...DEFAULT_RULE_SETTINGS, ...storedSettings }
  }

  /**
   * 初始化后台服务
   */
  async initialize(): Promise<void> {
    try {
      const settings = await this.getSettings()

      // 设置定时器
      if (settings.enableScheduler) {
        await this.startScheduler(settings)
      }

      // 设置监听器
      this.setupAlarmListener()
      this.setupTabListener()
      this.setupMessageHandler()

      console.log("[RuleBackground] Initialized successfully")
    } catch (error) {
      console.error("[RuleBackground] Initialization failed:", error)
    }
  }

  /**
   * 设置 alarms 监听
   */
  private setupAlarmListener(): void {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === RULE_ALARM_NAME) {
        this.checkTimeRules()
      }
    })
  }

  /**
   * 设置标签页监听
   */
  private setupTabListener(): void {
    // 标签页 URL 更新时检测
    chrome.tabs.onUpdated.addListener(
      async (tabId, changeInfo) => {
        if (!changeInfo.url) return
        const settings = await this.getSettings()
        if (settings.enableDomainDetection) {
          this.checkDomainRules(tabId, changeInfo.url)
        }
      }
    )

    // 标签页激活时检测
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const settings = await this.getSettings()
      if (!settings.enableDomainDetection) return

      try {
        const tab = await chrome.tabs.get(activeInfo.tabId)
        if (tab.url) {
          this.checkDomainRules(activeInfo.tabId, tab.url)
        }
      } catch {
        // 忽略错误
      }
    })
  }

  /**
   * 设置消息处理
   */
  private setupMessageHandler(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "TRIGGER_RULES_NOW") {
        this.triggerAllRules()
        sendResponse({ success: true })
      }
      if (message.type === "GET_RULE_STATUS") {
        this.getSettings().then((settings) => {
          sendResponse({
            schedulerEnabled: settings.enableScheduler,
            domainDetectionEnabled: settings.enableDomainDetection,
          })
        })
      }
      return true
    })
  }

  /**
   * 启动定时调度器
   */
  private async startScheduler(settings?: RuleSettings): Promise<void> {
    const s = settings ?? await this.getSettings()
    try {
      await chrome.alarms.create(RULE_ALARM_NAME, {
        delayInMinutes: s.schedulerInterval / 60000,
        periodInMinutes: s.schedulerInterval / 60000,
      })
      console.log(
        `[RuleBackground] Scheduler started with interval: ${s.schedulerInterval}ms`
      )
    } catch (error) {
      console.error("[RuleBackground] Failed to start scheduler:", error)
    }
  }

  /**
   * 停止定时调度器
   */
  private async stopScheduler(): Promise<void> {
    try {
      await chrome.alarms.clear(RULE_ALARM_NAME)
      console.log("[RuleBackground] Scheduler stopped")
    } catch (error) {
      console.error("[RuleBackground] Failed to stop scheduler:", error)
    }
  }

  /**
   * 检查时间规则
   */
  private async checkTimeRules(): Promise<void> {
    const rules = await this.getEnabledRules()
    const now = Date.now()

    for (const rule of rules) {
      // 只检查有时间条件的规则
      const hasTimeCondition = rule.conditions.some(
        (c) => c.type === "time" || c.type === "dayOfWeek"
      )

      if (!hasTimeCondition) continue

      // 检查是否应该触发（避免短时间内重复触发）
      const settings = await this.getSettings()
      const cooldown = settings.schedulerInterval * 2
      if (
        rule.lastTriggeredAt &&
        now - rule.lastTriggeredAt < cooldown
      ) {
        continue
      }

      const shouldTrigger = ruleEngine.evaluateTimeConditions(
        rule.conditions,
        rule.conditionOperator
      )

      if (shouldTrigger) {
        console.log(`[RuleBackground] Triggering time rule: ${rule.name}`)
        await ruleEngine.executeActions(rule.actions)
        await ruleEngine.recordTrigger(rule.id)
      }
    }
  }

  /**
   * 检查域名规则
   */
  private async checkDomainRules(_tabId: number, url: string): Promise<void> {
    // 忽略 chrome:// 等内部页面
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return
    }

    const rules = await this.getEnabledRules()

    for (const rule of rules) {
      // 只检查有域名条件的规则
      const hasDomainCondition = rule.conditions.some(
        (c) => c.type === "domain"
      )

      if (!hasDomainCondition) continue

      const shouldTrigger = ruleEngine.evaluateDomainConditions(
        rule.conditions,
        rule.conditionOperator,
        url
      )

      if (shouldTrigger) {
        console.log(
          `[RuleBackground] Triggering domain rule: ${rule.name} for ${url}`
        )
        await ruleEngine.executeActions(rule.actions)
        await ruleEngine.recordTrigger(rule.id)
      }
    }
  }

  /**
   * 触发所有规则（手动）
   */
  private async triggerAllRules(): Promise<void> {
    const rules = await this.getEnabledRules()

    for (const rule of rules) {
      await ruleEngine.executeActions(rule.actions)
      await ruleEngine.recordTrigger(rule.id)
    }
  }

  /**
   * 获取启用的规则
   */
  private async getEnabledRules(): Promise<Rule[]> {
    const rules = (await browserAdapter.getStorage(RULES_STORAGE_KEY)) || []
    return (rules as Rule[]).filter((r) => r.enabled)
  }

  /**
   * 更新设置
   */
  async updateSettings(newSettings: Partial<RuleSettings>): Promise<void> {
    const currentSettings = await this.getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    await browserAdapter.setStorage(RULE_SETTINGS_KEY, updatedSettings)

    // 更新调度器状态
    if ("enableScheduler" in newSettings) {
      if (newSettings.enableScheduler) {
        await this.startScheduler()
      } else {
        await this.stopScheduler()
      }
    }
  }
}

// 创建并导出服务实例
export const ruleBackgroundService = new RuleBackgroundService()

// 初始化服务（当 background script 加载时）
ruleBackgroundService.initialize()
