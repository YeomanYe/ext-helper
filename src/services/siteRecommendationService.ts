import type { AiSettings, RecommendationQuota } from "@/types"
import { promptAiProvider } from "@/services/aiProvider"

type JsonRecord = Record<string, unknown>

export type SiteRecommendationSource = "remote" | "ai"

export interface SiteRecommendation {
  extensionId: string
  name: string
  url: string
  iconUrl: string | null
  description: string | null
  rating: number | null
  ratingText: string | null
  usersText: string | null
  rank: number
  sourceQuery: string
  reason: string
}

export interface SiteRecommendationResult {
  domain: string
  source: SiteRecommendationSource
  totalCandidates: number
  recommendations: SiteRecommendation[]
  quota?: RecommendationQuota
  error?: string
}

export interface FetchSiteRecommendationsOptions {
  url: string
  pageTitle?: string
  pageDescription?: string
  apiBaseUrl?: string
  authToken?: string | null
  installId?: string | null
  aiSettings?: AiSettings
  installedExtensions?: readonly {
    name: string
    description?: string
  }[]
  limit?: number
  fetchImpl?: typeof fetch
}

export const DEFAULT_RECOMMENDATION_API_BASE_URL =
  "https://ext-helper-recommendations.ming13821007683.workers.dev"

export function resolveRecommendationApiBaseUrl(override?: string | null): string {
  const trimmedOverride = override?.trim()
  if (trimmedOverride) return trimmedOverride.replace(/\/+$/, "")
  const envOverride = process.env.PLASMO_PUBLIC_EXT_HELPER_API_BASE_URL?.trim()
  return (envOverride || DEFAULT_RECOMMENDATION_API_BASE_URL).replace(/\/+$/, "")
}

const DEFAULT_LIMIT = 10

const AI_RECOMMENDATION_STRUCTURED_OUTPUT = {
  name: "return_site_extension_recommendations",
  description: "Return browser extension recommendations for the current website.",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            url: { type: "string" },
            description: { type: "string" },
            reason: { type: "string" },
            sourceQuery: { type: "string" },
          },
          required: ["name", "reason"],
        },
      },
    },
    required: ["recommendations"],
  },
}

const asRecord = (value: unknown): JsonRecord | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
}

function getDomain(url: string): string {
  try {
    return normalizeDomain(new URL(url).hostname)
  } catch {
    return normalizeDomain(url)
  }
}

function emptyResult(
  url: string,
  source: SiteRecommendationSource,
  error?: string
): SiteRecommendationResult {
  return {
    domain: getDomain(url),
    source,
    totalCandidates: 0,
    recommendations: [],
    ...(error ? { error } : {}),
  }
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "extension"
  )
}

function getChromeWebStoreSearchUrl(name: string): string {
  return `https://chromewebstore.google.com/search/${encodeURIComponent(name)}`
}

function extractChromeExtensionId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/detail\/[^/]+\/([a-p]{32})(?:\/|$)/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function normalizeRemoteRecommendation(value: unknown): SiteRecommendation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (typeof record.extensionId !== "string" || typeof record.name !== "string") return null
  if (typeof record.url !== "string") return null

  return {
    extensionId: record.extensionId,
    name: record.name,
    url: record.url,
    iconUrl: typeof record.iconUrl === "string" ? record.iconUrl : null,
    description: typeof record.description === "string" ? record.description : null,
    rating: typeof record.rating === "number" ? record.rating : null,
    ratingText: typeof record.ratingText === "string" ? record.ratingText : null,
    usersText: typeof record.usersText === "string" ? record.usersText : null,
    rank: typeof record.rank === "number" ? record.rank : 0,
    sourceQuery: typeof record.sourceQuery === "string" ? record.sourceQuery : "",
    reason: typeof record.reason === "string" ? record.reason : "Recommended for this site.",
  }
}

function normalizeQuota(value: unknown): RecommendationQuota | undefined {
  const record = asRecord(value)
  if (!record) return undefined
  if (
    typeof record.limit !== "number" ||
    typeof record.remaining !== "number" ||
    typeof record.resetsAt !== "string"
  ) {
    return undefined
  }

  return {
    limit: record.limit,
    remaining: record.remaining,
    resetsAt: record.resetsAt,
  }
}

function normalizeRemoteResult(
  value: unknown,
  url: string,
  limit: number
): SiteRecommendationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Recommendation API returned an invalid payload.")
  }

  const record = value as Record<string, unknown>
  const recommendations = Array.isArray(record.recommendations)
    ? record.recommendations
        .map(normalizeRemoteRecommendation)
        .filter((item): item is SiteRecommendation => item !== null)
    : []

  return {
    domain: typeof record.domain === "string" ? normalizeDomain(record.domain) : getDomain(url),
    source: "remote",
    totalCandidates:
      typeof record.totalCandidates === "number" ? record.totalCandidates : recommendations.length,
    recommendations: recommendations.slice(0, limit),
    ...(typeof record.error === "string" ? { error: record.error } : {}),
    ...(normalizeQuota(record.quota) ? { quota: normalizeQuota(record.quota) } : {}),
  }
}

function normalizeAiRecommendation(
  value: unknown,
  index: number,
  seenIds: Set<string>
): SiteRecommendation | null {
  const record = asRecord(value)
  if (!record) return null

  const name =
    typeof record.name === "string"
      ? record.name.trim()
      : typeof record.title === "string"
        ? record.title.trim()
        : ""
  if (!name) return null

  const rawUrl = typeof record.url === "string" ? record.url.trim() : ""
  const url = rawUrl.startsWith("http") ? rawUrl : getChromeWebStoreSearchUrl(name)
  const extensionId =
    (typeof record.extensionId === "string" && record.extensionId.trim()) ||
    extractChromeExtensionId(url) ||
    `ai-${slugify(name)}`
  if (seenIds.has(extensionId)) return null
  seenIds.add(extensionId)

  const description =
    typeof record.description === "string" && record.description.trim()
      ? record.description.trim()
      : null

  return {
    extensionId,
    name,
    url,
    iconUrl: null,
    description,
    rating: null,
    ratingText: null,
    usersText: null,
    rank: index + 1,
    sourceQuery:
      typeof record.sourceQuery === "string" && record.sourceQuery.trim()
        ? record.sourceQuery.trim()
        : "AI recommendation",
    reason:
      typeof record.reason === "string" && record.reason.trim()
        ? record.reason.trim()
        : "Recommended by AI for this site.",
  }
}

function tryParseJsonArrayTolerant(text: string): unknown[] | null {
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    return null
  } catch {
    // Truncated JSON — extract all complete top-level objects via brace matching
    const items: unknown[] = []
    let depth = 0
    let start = -1
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (ch === "{") {
        if (depth === 0) start = i
        depth++
      } else if (ch === "}") {
        depth--
        if (depth === 0 && start !== -1) {
          try {
            items.push(JSON.parse(text.slice(start, i + 1)))
          } catch {
            // skip malformed object
          }
          start = -1
        }
      }
    }
    return items.length > 0 ? items : null
  }
}

function getAiRecommendationItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (!record) return []
  const candidates = [
    record.recommendations,
    record.extensions,
    record.items,
    record.results,
    record.data,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (typeof candidate === "string") {
      const parsed = tryParseJsonArrayTolerant(candidate)
      if (parsed) return parsed
    }
  }
  return []
}

function normalizeAiResult(value: unknown, url: string, limit: number): SiteRecommendationResult {
  const seenIds = new Set<string>()
  const recommendations = getAiRecommendationItems(value)
    .map((item, index) => normalizeAiRecommendation(item, index, seenIds))
    .filter((item): item is SiteRecommendation => item !== null)
    .slice(0, limit)

  return {
    domain: getDomain(url),
    source: "ai",
    totalCandidates: recommendations.length,
    recommendations,
  }
}

export function buildAiSiteRecommendationPrompt({
  url,
  pageTitle,
  pageDescription,
  installedExtensions = [],
  limit = DEFAULT_LIMIT,
}: {
  url: string
  pageTitle?: string
  pageDescription?: string
  installedExtensions?: FetchSiteRecommendationsOptions["installedExtensions"]
  limit?: number
}): string {
  const payload = {
    task: "recommend-chrome-extensions-for-current-website",
    instructions: [
      "Return JSON only.",
      "Recommend Chrome Web Store extensions useful for the current website and user workflow.",
      "Prefer real, well-known Chrome extensions.",
      "Do not recommend extensions already installed by name.",
      "If you are not confident about an exact Chrome Web Store detail URL, use the Chrome Web Store search URL for that extension name.",
      `Return at most ${limit} recommendations.`,
    ],
    currentPage: {
      url,
      domain: getDomain(url),
      title: pageTitle ?? "",
      description: pageDescription ?? "",
    },
    installedExtensions: installedExtensions.map((extension) => ({
      name: extension.name,
      description: extension.description ?? "",
    })),
    responseShape: {
      recommendations: [
        {
          name: "extension name",
          url: "https://chromewebstore.google.com/detail/... or https://chromewebstore.google.com/search/...",
          description: "short Chrome Web Store style description",
          reason: "why it helps on this website",
          sourceQuery: "query or site signal used",
        },
      ],
    },
  }

  return JSON.stringify(payload)
}

async function fetchAiSiteRecommendations({
  url,
  pageTitle,
  pageDescription,
  aiSettings,
  installedExtensions,
  limit,
  quota,
}: Omit<FetchSiteRecommendationsOptions, "apiBaseUrl" | "authToken" | "fetchImpl"> & {
  aiSettings: AiSettings
  limit: number
  quota?: RecommendationQuota
}): Promise<SiteRecommendationResult> {
  try {
    const response = await promptAiProvider(
      aiSettings,
      buildAiSiteRecommendationPrompt({
        url,
        pageTitle,
        pageDescription,
        installedExtensions,
        limit,
      }),
      {
        debugLabel: "site-recommendations",
        returnRawOnParseError: true,
        maxTokens: 4096,
        structuredOutput: AI_RECOMMENDATION_STRUCTURED_OUTPUT,
      }
    )
    // eslint-disable-next-line no-console
    console.log("[RecommendationAI] Raw AI response", { url, response })
    const result = normalizeAiResult(response, url, limit)
    // eslint-disable-next-line no-console
    console.log("[RecommendationAI] Normalized result", result)
    return quota ? { ...result, quota } : result
  } catch (error) {
    return {
      ...emptyResult(
        url,
        "ai",
        error instanceof Error ? error.message : "AI recommendations failed."
      ),
      ...(quota ? { quota } : {}),
    }
  }
}

async function fetchRemoteSiteRecommendations({
  url,
  pageTitle,
  pageDescription,
  baseUrl,
  authToken,
  installId,
  limit,
  fetchImpl,
}: {
  url: string
  pageTitle?: string
  pageDescription?: string
  baseUrl: string
  authToken?: string | null
  installId?: string | null
  limit: number
  fetchImpl: typeof fetch
}): Promise<SiteRecommendationResult> {
  try {
    const requestUrl = new URL(`${baseUrl}/v1/recommendations`)
    requestUrl.searchParams.set("url", url)
    requestUrl.searchParams.set("limit", String(limit))
    if (pageTitle) requestUrl.searchParams.set("title", pageTitle)
    if (pageDescription) requestUrl.searchParams.set("description", pageDescription)
    const response = await fetchImpl(requestUrl.toString(), {
      headers: {
        Accept: "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(installId ? { "X-Ext-Helper-Install-Id": installId } : {}),
      },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      if (payload && typeof payload === "object") {
        return normalizeRemoteResult(payload, url, limit)
      }
      throw new Error(`Recommendation API failed (${response.status})`)
    }
    return normalizeRemoteResult(payload, url, limit)
  } catch (error) {
    return emptyResult(
      url,
      "remote",
      error instanceof Error ? error.message : "Recommendation API failed."
    )
  }
}

function filterInstalledExtensions(
  result: SiteRecommendationResult,
  installedExtensions: FetchSiteRecommendationsOptions["installedExtensions"]
): SiteRecommendationResult {
  if (!installedExtensions || installedExtensions.length === 0) return result
  const installedNames = new Set(installedExtensions.map((e) => e.name.trim().toLowerCase()))
  const filtered = result.recommendations.filter(
    (r) => !installedNames.has(r.name.trim().toLowerCase())
  )
  if (filtered.length === result.recommendations.length) return result
  return { ...result, recommendations: filtered }
}

export async function fetchSiteRecommendations({
  url,
  pageTitle,
  pageDescription,
  apiBaseUrl,
  authToken,
  installId,
  aiSettings,
  installedExtensions,
  limit = DEFAULT_LIMIT,
  fetchImpl = fetch,
}: FetchSiteRecommendationsOptions): Promise<SiteRecommendationResult> {
  const baseUrl = apiBaseUrl?.trim().replace(/\/+$/, "")

  if (baseUrl) {
    const remote = await fetchRemoteSiteRecommendations({
      url,
      pageTitle,
      pageDescription,
      baseUrl,
      authToken,
      installId,
      limit,
      fetchImpl,
    })
    if (remote.recommendations.length > 0) {
      return filterInstalledExtensions(remote, installedExtensions)
    }

    if (aiSettings) {
      const ai = await fetchAiSiteRecommendations({
        url,
        pageTitle,
        pageDescription,
        aiSettings,
        installedExtensions,
        limit,
        quota: remote.quota,
      })
      return filterInstalledExtensions(ai, installedExtensions)
    }

    return remote
  }

  if (aiSettings) {
    const ai = await fetchAiSiteRecommendations({
      url,
      pageTitle,
      pageDescription,
      aiSettings,
      installedExtensions,
      limit,
    })
    return filterInstalledExtensions(ai, installedExtensions)
  }

  return emptyResult(url, "remote", "Recommendation service and AI provider are not configured.")
}
