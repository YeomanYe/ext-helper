// ============================================================
// Background Script - 规则自动执行服务
// ============================================================

import { browserAdapter } from "@/services/browser/adapter"
import { RULE_SETTINGS_KEY, DEFAULT_RULE_SETTINGS, RULE_ALARM_NAME } from "@/rules/constants"
import { ruleEngine } from "@/rules/ruleEngine"
import { rulesRepo, SYNC_RULES_INDEX, SYNC_RULE_PREFIX } from "@/services/rulesRepo"
import { createUsageLogEvent, usageLogRepo } from "@/services/usageLogRepo"
import { extensionsRepo } from "@/services/extensionsRepo"
import { getEffectiveAiProvider, normalizeAiSettings } from "@/services/aiSettings"
import { preferencesRepo } from "@/services/preferencesRepo"
import { siteInstallRepo } from "@/services/siteInstallRepo"
import {
  buildInstalledSiteDiscoveryPayload,
  buildSiteAuthStatus,
  buildSiteRecommendationPayload,
  type InstalledExtensionRecommendationContext,
} from "@/services/siteDiscoveryPanelService"
import { resolveRecommendationApiBaseUrl } from "@/services/siteRecommendationService"
import {
  buildLoginUrl,
  parseAuthSessionFromRedirectUrl,
  siteAuthSessionRepo,
  type SiteAuthProvider,
} from "@/services/siteAuthService"
import type { Rule, RuleSettings } from "@/rules/types"
import { logger } from "@/utils/logger"

const EXT_HELPER_AUTH_API_BASE_URL = (
  process.env.PLASMO_PUBLIC_EXT_HELPER_AUTH_API_BASE_URL ?? ""
).trim()

function getConfiguredAiSettings(preferences: Awaited<ReturnType<typeof preferencesRepo.fetch>>) {
  if (!preferences.aiSettings) return undefined
  const aiSettings = normalizeAiSettings(preferences.aiSettings)
  return getEffectiveAiProvider(aiSettings) !== "manual" ? aiSettings : undefined
}

function getRecommendationApiBaseUrl(
  preferences: Awaited<ReturnType<typeof preferencesRepo.fetch>>
) {
  return resolveRecommendationApiBaseUrl(preferences.recommendationApiBaseUrl)
}

class RuleBackgroundService {
  /**
   * 获取设置（每次从 storage 读取，避免 Service Worker 挂起后内存丢失）
   */
  private async getSettings(): Promise<RuleSettings> {
    const storedSettings = await browserAdapter.getStorage<Partial<RuleSettings>>(RULE_SETTINGS_KEY)
    return { ...DEFAULT_RULE_SETTINGS, ...(storedSettings ?? {}) }
  }

  /**
   * 同步注册所有事件监听器。
   * MV3 service worker 唤醒时，listener 必须在顶层同步注册，否则唤醒期间的消息会被丢弃。
   */
  registerListeners(): void {
    this.setupAlarmListener()
    this.setupTabListener()
    this.setupMessageHandler()
    this.setupSyncListener()
  }

  /**
   * 异步初始化（调度器等需要先读 storage 的工作）
   */
  async initialize(): Promise<void> {
    try {
      const settings = await this.getSettings()
      if (settings.enableScheduler) {
        await this.startScheduler(settings)
      }
      logger.log("[RuleBackground] Initialized successfully")
    } catch (error) {
      logger.error("[RuleBackground] Initialization failed:", error)
    }
  }

  /**
   * 设置 alarms 监听
   */
  private setupAlarmListener(): void {
    browserAdapter.onAlarm((alarm) => {
      if (alarm.name === RULE_ALARM_NAME) {
        this.checkTimeRules()
      }
    })
  }

  /**
   * 设置标签页监听
   */
  private setupTabListener(): void {
    browserAdapter.onTabUpdated(async (tabId, changeInfo) => {
      if (!changeInfo.url) return
      const settings = await this.getSettings()
      if (settings.enableDomainDetection) {
        this.checkDomainRules(tabId, changeInfo.url)
      }
    })

    browserAdapter.onTabActivated(async (activeInfo) => {
      const settings = await this.getSettings()
      if (!settings.enableDomainDetection) return
      const tab = await browserAdapter.getTab(activeInfo.tabId)
      if (tab?.url) {
        this.checkDomainRules(activeInfo.tabId, tab.url)
      }
    })
  }

  /**
   * 设置消息处理
   */
  private setupMessageHandler(): void {
    browserAdapter.onMessage((message, _sender, sendResponse) => {
      const msg = message as
        | {
            type?: string
            url?: string
            pageTitle?: string
            pageDescription?: string
            provider?: SiteAuthProvider
            installedExtensions?: InstalledExtensionRecommendationContext[]
          }
        | null
        | undefined
      if (msg?.type === "TRIGGER_RULES_NOW") {
        this.triggerAllRules()
        sendResponse({ success: true })
      }
      if (msg?.type === "GET_RULE_STATUS") {
        this.getSettings().then((settings) => {
          sendResponse({
            schedulerEnabled: settings.enableScheduler,
            domainDetectionEnabled: settings.enableDomainDetection,
          })
        })
      }
      if (msg?.type === "DISCOVER_INSTALLED_EXTENSIONS_FOR_SITE") {
        if (!msg.url) {
          sendResponse({ success: false, error: "Current URL is required." })
          return true
        }

        Promise.all([
          extensionsRepo.fetchAll(),
          siteAuthSessionRepo.fetch(),
          preferencesRepo.fetch(),
        ])
          .then(([extensions, authSession, preferences]) => {
            const aiSettings = getConfiguredAiSettings(preferences)
            const recommendationApiBaseUrl = getRecommendationApiBaseUrl(preferences)
            sendResponse(
              buildInstalledSiteDiscoveryPayload({
                url: msg.url!,
                pageTitle: msg.pageTitle,
                pageDescription: msg.pageDescription,
                extensions,
                authSession,
                recommendationApiBaseUrl,
                authApiConfigured: Boolean(EXT_HELPER_AUTH_API_BASE_URL),
                aiConfigured: Boolean(aiSettings),
              })
            )
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Failed to discover extensions.",
            })
          })
      }
      if (msg?.type === "FETCH_SITE_RECOMMENDATIONS_FOR_SITE") {
        if (!msg.url) {
          sendResponse({ success: false, error: "Current URL is required." })
          return true
        }

        Promise.all([
          siteAuthSessionRepo.fetch(),
          preferencesRepo.fetch(),
          siteInstallRepo.fetchOrCreate(),
        ])
          .then(async ([authSession, preferences, installId]) => {
            const aiSettings = getConfiguredAiSettings(preferences)
            const cloudEnabled = preferences.cloudRecommendationEnabled !== false
            const payload = await buildSiteRecommendationPayload({
              url: msg.url!,
              pageTitle: msg.pageTitle,
              pageDescription: msg.pageDescription,
              apiBaseUrl: cloudEnabled ? getRecommendationApiBaseUrl(preferences) : "",
              authSession,
              installId,
              aiSettings: aiSettings ?? undefined,
              installedExtensions: msg.installedExtensions,
            })
            // eslint-disable-next-line no-console
            console.log("[RecommendationBackground] Site recommendations result", {
              url: msg.url,
              cloudEnabled,
              aiConfigured: Boolean(aiSettings),
              source: payload.recommendations.source,
              domain: payload.recommendations.domain,
              totalCandidates: payload.recommendations.totalCandidates,
              count: payload.recommendations.recommendations.length,
              quota: payload.recommendations.quota,
              error: payload.recommendations.error,
              recommendations: payload.recommendations.recommendations,
            })
            sendResponse(payload)
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Failed to fetch recommendations.",
            })
          })
      }
      if (msg?.type === "GET_SITE_AUTH_STATUS") {
        Promise.all([siteAuthSessionRepo.fetch(), preferencesRepo.fetch()])
          .then(([authSession, preferences]) => {
            sendResponse({
              success: true,
              auth: buildSiteAuthStatus({
                authSession,
                recommendationApiBaseUrl: getRecommendationApiBaseUrl(preferences),
                authApiConfigured: Boolean(EXT_HELPER_AUTH_API_BASE_URL),
                aiConfigured: Boolean(getConfiguredAiSettings(preferences)),
              }),
            })
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Failed to read login status.",
            })
          })
      }
      if (msg?.type === "START_SITE_AUTH_LOGIN") {
        if (!EXT_HELPER_AUTH_API_BASE_URL) {
          sendResponse({ success: false, error: "Ext Helper API base URL is not configured." })
          return true
        }
        if (msg.provider !== "github" && msg.provider !== "google") {
          sendResponse({ success: false, error: "Unsupported login provider." })
          return true
        }

        const redirectUri = browserAdapter.getRedirectUrl("auth")
        const loginUrl = buildLoginUrl({
          apiBaseUrl: EXT_HELPER_AUTH_API_BASE_URL,
          provider: msg.provider,
          redirectUri,
        })
        browserAdapter
          .launchWebAuthFlow({ url: loginUrl, interactive: true })
          .then((redirectUrl) => {
            const session = parseAuthSessionFromRedirectUrl(redirectUrl)
            if (!session) throw new Error("Login callback did not include a valid session.")
            return siteAuthSessionRepo.save(session).then(() => session)
          })
          .then(async (session) => {
            const preferences = await preferencesRepo.fetch()
            sendResponse({
              success: true,
              auth: buildSiteAuthStatus({
                authSession: session,
                recommendationApiBaseUrl: getRecommendationApiBaseUrl(preferences),
                authApiConfigured: true,
                aiConfigured: Boolean(getConfiguredAiSettings(preferences)),
              }),
            })
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Login failed.",
            })
          })
      }
      if (msg?.type === "SIGN_OUT_SITE_AUTH") {
        siteAuthSessionRepo
          .clear()
          .then(async () => {
            const preferences = await preferencesRepo.fetch()
            sendResponse({
              success: true,
              auth: buildSiteAuthStatus({
                authSession: null,
                recommendationApiBaseUrl: getRecommendationApiBaseUrl(preferences),
                authApiConfigured: Boolean(EXT_HELPER_AUTH_API_BASE_URL),
                aiConfigured: Boolean(getConfiguredAiSettings(preferences)),
              }),
            })
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Sign out failed.",
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
    const s = settings ?? (await this.getSettings())
    await browserAdapter.createAlarm(RULE_ALARM_NAME, {
      delayInMinutes: s.schedulerInterval / 60000,
      periodInMinutes: s.schedulerInterval / 60000,
    })
    logger.log(`[RuleBackground] Scheduler started with interval: ${s.schedulerInterval}ms`)
  }

  /**
   * 停止定时调度器
   */
  private async stopScheduler(): Promise<void> {
    await browserAdapter.clearAlarm(RULE_ALARM_NAME)
    logger.log("[RuleBackground] Scheduler stopped")
  }

  /**
   * 检查时间规则（仅评估 conditionGroup 中的 schedule 部分，忽略域名）
   */
  private async checkTimeRules(): Promise<void> {
    const rules = await this.getEnabledRules()
    const now = Date.now()

    const settings = await this.getSettings()
    const cooldown = settings.schedulerInterval * 2

    for (const rule of rules) {
      if (!rule.conditionGroups) continue

      const hasSchedule = rule.conditionGroups.some((g) => g.schedule !== null)
      if (!hasSchedule) continue

      if (rule.lastTriggeredAt && now - rule.lastTriggeredAt < cooldown) {
        continue
      }

      // 仅评估 schedule，不管域名（时间到了就触发）
      const shouldTrigger = rule.conditionGroups.some((g) => {
        if (!g.schedule) return false
        return ruleEngine.isScheduleMatch(g.schedule as any)
      })

      if (shouldTrigger) {
        logger.log(`[RuleBackground] Triggering time rule: ${rule.name}`)
        await ruleEngine.executeActions(rule.actions)
        await ruleEngine.recordTrigger(rule.id)
      }
    }
  }

  /**
   * 检查域名规则（基于 conditionGroups）
   */
  private async checkDomainRules(_tabId: number, url: string): Promise<void> {
    // 忽略 chrome:// 等内部页面
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return
    }

    const rules = await this.getEnabledRules()

    for (const rule of rules) {
      if (!rule.conditionGroups) continue

      const shouldTrigger = ruleEngine.evaluateConditionGroups(
        rule.conditionGroups,
        rule.conditionOperator,
        url
      )

      if (shouldTrigger) {
        logger.log(`[RuleBackground] Triggering domain rule: ${rule.name} for ${url}`)
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
   * 监听 sync 变化，当另一个 profile 修改规则时重新触发
   */
  private setupSyncListener(): void {
    browserAdapter.onSyncChanged((changes) => {
      const ruleChanged = Object.keys(changes).some(
        (key) => key === SYNC_RULES_INDEX || key.startsWith(SYNC_RULE_PREFIX)
      )
      if (ruleChanged) {
        logger.log("[RuleBackground] Sync rules changed, re-evaluating")
        this.checkTimeRules()
      }
    })
  }

  /**
   * 获取启用的规则
   */
  private async getEnabledRules(): Promise<Rule[]> {
    const rules = await rulesRepo.fetchAll()
    return rules.filter((r) => r.enabled)
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

class UsageLogBackgroundService {
  initialize(): void {
    try {
      browserAdapter.onExtensionInstalled((extension) => {
        void usageLogRepo.append(createUsageLogEvent(extension, "installed", "background"))
      })

      browserAdapter.onExtensionUninstalled((extensionId) => {
        void this.recordUninstalled(extensionId)
      })

      browserAdapter.onExtensionEnabledChanged((extension) => {
        void usageLogRepo.append(
          createUsageLogEvent(extension, extension.enabled ? "enabled" : "disabled", "browser")
        )
      })

      logger.log("[UsageLogBackground] Initialized successfully")
    } catch (error) {
      logger.error("[UsageLogBackground] Initialization failed:", error)
    }
  }

  private async recordUninstalled(extensionId: string): Promise<void> {
    const extensionName = (await usageLogRepo.findExtensionName(extensionId)) ?? extensionId
    await usageLogRepo.append(
      createUsageLogEvent({ id: extensionId, name: extensionName }, "uninstalled", "background")
    )
  }
}

// 创建并导出服务实例
export const ruleBackgroundService = new RuleBackgroundService()
export const usageLogBackgroundService = new UsageLogBackgroundService()

// 同步注册监听器（必须在任何 await 之前，确保 MV3 唤醒消息不丢失）
ruleBackgroundService.registerListeners()

// 异步初始化（调度器等）
ruleBackgroundService.initialize()
usageLogBackgroundService.initialize()
