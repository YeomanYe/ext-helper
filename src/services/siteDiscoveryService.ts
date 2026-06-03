import type { Extension } from "@/types"

export type SiteDiscoveryConfidence = "high" | "medium" | "low"

export interface SiteDiscoveryMatch {
  extension: Extension
  confidence: SiteDiscoveryConfidence
  score: number
  reasons: string[]
  permissionSignals: string[]
}

export interface SiteDiscoveryResult {
  domain: string
  pageType: string
  totalExtensions: number
  matches: SiteDiscoveryMatch[]
  exploreQueries: string[]
}

const MIN_MATCH_SCORE = 24
const MAX_MATCHES = 8
const MAX_KEYWORDS = 16

const STOP_WORDS = new Set([
  "www",
  "com",
  "org",
  "net",
  "app",
  "dev",
  "io",
  "co",
  "cn",
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "your",
  "you",
  "page",
  "site",
  "home",
  "login",
  "signin",
  "sign",
  "account",
  "dashboard",
])

const normalize = (value: string) => value.trim().toLowerCase()

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return normalize(url).replace(/^www\./, "")
  }
}

function getPathText(url: string): string {
  try {
    return new URL(url).pathname.replace(/[/-]/g, " ")
  } catch {
    return ""
  }
}

function getComparableText(extension: Extension): string {
  return normalize(
    [
      extension.name,
      extension.description,
      extension.permissions.join(" "),
      extension.hostPermissions.join(" "),
      extension.homepageUrl ?? "",
      extension.optionsUrl ?? "",
    ].join(" ")
  )
}

function getHostPattern(pattern: string): string {
  const value = normalize(pattern)
  if (value === "<all_urls>") return "*"

  const withoutScheme = value.replace(/^(\*|https?|file|ftp):\/\//, "")
  return withoutScheme.split("/")[0].replace(/^www\./, "")
}

function isBroadHostPermission(pattern: string): boolean {
  const host = getHostPattern(pattern)
  return host === "*" || host === "*.*"
}

function hostPermissionMatchesDomain(pattern: string, domain: string): boolean {
  const host = getHostPattern(pattern)
  if (!host || isBroadHostPermission(pattern)) return false
  if (host === domain) return true
  if (host.startsWith("*.")) {
    const suffix = host.slice(2)
    return domain === suffix || domain.endsWith(`.${suffix}`)
  }

  return host.includes(domain)
}

function confidenceFromScore(score: number): SiteDiscoveryConfidence {
  if (score >= 60) return "high"
  if (score >= 35) return "medium"
  return "low"
}

function extractKeywords({
  url,
  domain,
  pageTitle,
  pageDescription,
}: {
  url: string
  domain: string
  pageTitle?: string
  pageDescription?: string
}): string[] {
  const source = normalize(
    [domain.replace(/\./g, " "), getPathText(url), pageTitle ?? "", pageDescription ?? ""].join(" ")
  )
  const tokens = source.match(/[a-z0-9][a-z0-9-]{2,}/g) ?? []
  const unique = new Set<string>()

  for (const token of tokens) {
    const compact = token.replace(/^-+|-+$/g, "")
    if (compact.length < 3 || compact.length > 32) continue
    if (/^\d+$/.test(compact)) continue
    if (STOP_WORDS.has(compact)) continue
    unique.add(compact)
    if (unique.size >= MAX_KEYWORDS) break
  }

  return [...unique]
}

function rankExtensionForSite(
  extension: Extension,
  domain: string,
  keywords: string[]
): SiteDiscoveryMatch | null {
  const text = getComparableText(extension)
  const reasons: string[] = []
  const permissionSignals: string[] = []
  let score = 0

  const directHostPermissions = extension.hostPermissions.filter(
    (permission) =>
      !isBroadHostPermission(permission) && hostPermissionMatchesDomain(permission, domain)
  )
  if (directHostPermissions.length > 0) {
    score += 55
    reasons.push("Has host permission for this site")
    permissionSignals.push(...directHostPermissions.slice(0, 2))
  }

  if (extension.hostPermissions.some(isBroadHostPermission)) {
    score += 8
    permissionSignals.push("<all_urls>")
  }

  const keywordHits = keywords.filter((keyword) => text.includes(keyword))
  if (keywordHits.length > 0) {
    score += Math.min(36, keywordHits.length * 12)
    reasons.push(`Matches page keywords: ${keywordHits.slice(0, 3).join(", ")}`)
  }

  if (extension.enabled) {
    score += 6
    reasons.push("Currently enabled")
  }

  if (extension.optionsUrl) {
    score += 3
  }

  if (score < MIN_MATCH_SCORE) return null

  return {
    extension,
    confidence: confidenceFromScore(score),
    score,
    reasons,
    permissionSignals,
  }
}

function buildExploreQueries(domain: string, keywords: string[]): string[] {
  const subject = keywords.slice(0, 3).join(" ") || domain
  return [
    `${domain} Chrome extension`,
    `${subject} browser extension`,
    `${subject} productivity extension`,
  ].filter((query, index, queries) => queries.indexOf(query) === index)
}

export function discoverInstalledExtensionsForSite({
  url,
  pageTitle,
  pageDescription,
  extensions,
}: {
  url: string
  pageTitle?: string
  pageDescription?: string
  extensions: Extension[]
}): SiteDiscoveryResult {
  const domain = getHostname(url)
  const keywords = extractKeywords({ url, domain, pageTitle, pageDescription })
  const matches = extensions
    .map((extension) => rankExtensionForSite(extension, domain, keywords))
    .filter((match): match is SiteDiscoveryMatch => match !== null)
    .sort((a, b) => b.score - a.score || a.extension.name.localeCompare(b.extension.name))
    .slice(0, MAX_MATCHES)

  return {
    domain,
    pageType: "Current site",
    totalExtensions: extensions.length,
    matches,
    exploreQueries: buildExploreQueries(domain, keywords),
  }
}
