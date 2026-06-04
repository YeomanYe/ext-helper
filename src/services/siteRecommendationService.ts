export type SiteRecommendationSource = "remote" | "fallback"

export interface SiteRecommendationRecord {
  extensionId: string
  name: string
  url: string
  iconUrl: string | null
  description: string | null
  rating: number | null
  ratingText: string | null
  usersText: string | null
  rank: number
  provider: string
  siteDomain: string
  siteLabel: string
  siteRegion?: string
  query: string
  crawledAt: string
}

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
  error?: string
}

export interface FetchSiteRecommendationsOptions {
  url: string
  apiBaseUrl?: string
  authToken?: string | null
  fallbackRecords?: readonly SiteRecommendationRecord[]
  limit?: number
  fetchImpl?: typeof fetch
}

const DEFAULT_LIMIT = 5

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

function pickBetterRecord(
  current: SiteRecommendationRecord | undefined,
  candidate: SiteRecommendationRecord
): SiteRecommendationRecord {
  if (!current) return candidate
  if (candidate.rank !== current.rank) return candidate.rank < current.rank ? candidate : current
  return (candidate.rating ?? 0) > (current.rating ?? 0) ? candidate : current
}

function recommendationFromRecord(record: SiteRecommendationRecord): SiteRecommendation {
  return {
    extensionId: record.extensionId,
    name: record.name,
    url: record.url,
    iconUrl: record.iconUrl,
    description: record.description,
    rating: record.rating,
    ratingText: record.ratingText,
    usersText: record.usersText,
    rank: record.rank,
    sourceQuery: record.query,
    reason: `Recommended from crawler data for ${record.siteLabel}.`,
  }
}

export function buildFallbackSiteRecommendations({
  url,
  records,
  limit = DEFAULT_LIMIT,
  error,
}: {
  url: string
  records: readonly SiteRecommendationRecord[]
  limit?: number
  error?: string
}): SiteRecommendationResult {
  const domain = getDomain(url)
  const byExtensionId = new Map<string, SiteRecommendationRecord>()

  for (const record of records) {
    if (normalizeDomain(record.siteDomain) !== domain) continue
    byExtensionId.set(
      record.extensionId,
      pickBetterRecord(byExtensionId.get(record.extensionId), record)
    )
  }

  const recommendations = [...byExtensionId.values()]
    .sort(
      (a, b) => a.rank - b.rank || (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name)
    )
    .slice(0, limit)
    .map(recommendationFromRecord)

  return {
    domain,
    source: "fallback",
    totalCandidates: byExtensionId.size,
    recommendations,
    ...(error ? { error } : {}),
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

function normalizeRemoteResult(value: unknown, url: string): SiteRecommendationResult {
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
    recommendations,
  }
}

export async function fetchSiteRecommendations({
  url,
  apiBaseUrl,
  authToken,
  fallbackRecords = [],
  limit = DEFAULT_LIMIT,
  fetchImpl = fetch,
}: FetchSiteRecommendationsOptions): Promise<SiteRecommendationResult> {
  const baseUrl = apiBaseUrl?.trim().replace(/\/+$/, "")
  if (!baseUrl) {
    return buildFallbackSiteRecommendations({ url, records: fallbackRecords, limit })
  }

  try {
    const requestUrl = new URL(`${baseUrl}/v1/recommendations`)
    requestUrl.searchParams.set("url", url)
    const response = await fetchImpl(requestUrl.toString(), {
      headers: {
        Accept: "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
    if (!response.ok) throw new Error(`Recommendation API failed (${response.status})`)
    return normalizeRemoteResult(await response.json(), url)
  } catch (error) {
    return buildFallbackSiteRecommendations({
      url,
      records: fallbackRecords,
      limit,
      error: error instanceof Error ? error.message : "Recommendation API failed.",
    })
  }
}
