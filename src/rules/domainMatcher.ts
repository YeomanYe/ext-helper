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
  // 裸 * = 匹配所有网站
  if (pattern === "*") return true

  // 先移除 *. 前缀，再转义（避免转义后 /^\*\./ 匹配失败的 bug）
  const isSubdomainWildcard = pattern.startsWith("*.")
  const domainPart = isSubdomainWildcard ? pattern.slice(2) : pattern
  const escapedDomain = domainPart.replace(/[.+?^${}()|[\]\\]/g, "\\$&")

  if (isSubdomainWildcard) {
    // *.github.com 只匹配子域名（不含根域名本身）
    const regex = new RegExp(`\\.${escapedDomain}$`, "i")
    return regex.test(hostname)
  }

  // 无通配符：精确匹配域名
  return hostname === domainPart
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
