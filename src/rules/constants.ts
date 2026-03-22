// ============================================================
// 规则系统常量
// ============================================================

export const RULES_STORAGE_KEY = "ext-helper-rules"
export const RULE_SETTINGS_KEY = "ext-helper-rule-settings"

export const DEFAULT_RULE_SETTINGS = {
  enableScheduler: true,
  schedulerInterval: 60000, // 1分钟
  enableDomainDetection: true,
  domainDetectionDebounce: 1000, // 1秒防抖
}

export const RULE_ALARM_NAME = "rule-check-alarm"
