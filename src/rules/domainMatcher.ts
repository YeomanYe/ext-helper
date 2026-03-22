// ============================================================
// 域名匹配器
// ============================================================

import type { MatchMode } from "./types"

/**
 * 从 URL 提取 hostname
 */
function extractHostname(url: string): string {
  try {
    // 处理 chrome:// 或其他非 http(s) 协议
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return ""
    }
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ""
  }
}

/**
 * 通配符匹配 (*.example.com -> api.github.com)
 */
function wildcardMatch(pattern: string, hostname: string): boolean {
  // 转换通配符为正则
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // 转义特殊字符
    .replace(/^\*\./, "") // 移除前导 *. -> .example.com

  // 检查是否以 . + pattern 结尾
  const regex = new RegExp(`(\\.${regexPattern})$`, "i")
  return regex.test(hostname) || hostname === regexPattern
}

/**
 * 正则匹配
 */
function regexMatch(pattern: string, hostname: string): boolean {
  try {
    const regex = new RegExp(pattern, "i")
    return regex.test(hostname)
  } catch {
    return false
  }
}

/**
 * 根据模式匹配 hostname
 */
function match(pattern: string, mode: MatchMode, hostname: string): boolean {
  if (!pattern || !hostname) return false

  switch (mode) {
    case "exact":
      return hostname === pattern

    case "contains":
      return hostname.includes(pattern)

    case "wildcard":
      return wildcardMatch(pattern, hostname)

    case "regex":
      return regexMatch(pattern, hostname)

    default:
      return false
  }
}

export const domainMatcher = {
  /**
   * 检查 URL 是否匹配模式
   */
  matches(pattern: string, mode: MatchMode, url: string): boolean {
    const hostname = extractHostname(url)
    return match(pattern, mode, hostname)
  },

  /**
   * 提取 URL 的域名
   */
  extractHostname,

  /**
   * 验证模式是否有效
   */
  validatePattern(pattern: string, mode: MatchMode): boolean {
    if (!pattern.trim()) return false

    if (mode === "regex") {
      try {
        new RegExp(pattern)
        return true
      } catch {
        return false
      }
    }

    return true
  },
}
