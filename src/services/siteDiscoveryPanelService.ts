import type { Extension, AiSettings } from "@/types"
import type { SiteAuthProvider, SiteAuthSession, SiteAuthUser } from "@/services/siteAuthService"
import {
  fetchSiteRecommendations,
  type FetchSiteRecommendationsOptions,
  type SiteRecommendationResult,
} from "@/services/siteRecommendationService"
import {
  discoverInstalledExtensionsForSite,
  type SiteDiscoveryResult,
} from "@/services/siteDiscoveryService"

export { getRecommendationQuotaPointsText } from "@/services/siteRecommendationQuota"

export interface SiteAuthStatus {
  apiConfigured: boolean
  authConfigured?: boolean
  aiConfigured: boolean
  authenticated: boolean
  user: SiteAuthUser | null
  provider: SiteAuthProvider | null
}

export interface InstalledExtensionRecommendationContext {
  name: string
  description?: string
}

export interface InstalledSiteDiscoveryPayload {
  success: true
  result: SiteDiscoveryResult
  auth: SiteAuthStatus
}

export interface SiteRecommendationPayload {
  success: true
  recommendations: SiteRecommendationResult
}

export function buildSiteAuthStatus({
  authSession,
  recommendationApiBaseUrl,
  authApiConfigured,
  aiConfigured,
}: {
  authSession: SiteAuthSession | null
  recommendationApiBaseUrl: string
  authApiConfigured: boolean
  aiConfigured: boolean
}): SiteAuthStatus {
  return {
    apiConfigured: Boolean(recommendationApiBaseUrl),
    authConfigured: authApiConfigured,
    aiConfigured,
    authenticated: Boolean(authSession),
    user: authSession?.user ?? null,
    provider: authSession?.provider ?? null,
  }
}

export function buildInstalledSiteDiscoveryPayload({
  url,
  pageTitle,
  pageDescription,
  extensions,
  authSession,
  recommendationApiBaseUrl,
  authApiConfigured,
  aiConfigured,
}: {
  url: string
  pageTitle?: string
  pageDescription?: string
  extensions: Extension[]
  authSession: SiteAuthSession | null
  recommendationApiBaseUrl: string
  authApiConfigured: boolean
  aiConfigured: boolean
}): InstalledSiteDiscoveryPayload {
  return {
    success: true,
    result: discoverInstalledExtensionsForSite({
      url,
      pageTitle,
      pageDescription,
      extensions,
    }),
    auth: buildSiteAuthStatus({
      authSession,
      recommendationApiBaseUrl,
      authApiConfigured,
      aiConfigured,
    }),
  }
}

export function getInstalledExtensionsForRecommendations(
  result: SiteDiscoveryResult
): InstalledExtensionRecommendationContext[] {
  return result.matches.map((match) => ({
    name: match.extension.name,
    description: match.extension.description || undefined,
  }))
}

export async function buildSiteRecommendationPayload({
  url,
  pageTitle,
  pageDescription,
  apiBaseUrl,
  authSession,
  installId,
  aiSettings,
  installedExtensions,
  fetchRecommendations = fetchSiteRecommendations,
}: {
  url: string
  pageTitle?: string
  pageDescription?: string
  apiBaseUrl: string
  authSession: SiteAuthSession | null
  installId: string
  aiSettings?: AiSettings
  installedExtensions?: InstalledExtensionRecommendationContext[]
  fetchRecommendations?: (
    options: FetchSiteRecommendationsOptions
  ) => Promise<SiteRecommendationResult>
}): Promise<SiteRecommendationPayload> {
  return {
    success: true,
    recommendations: await fetchRecommendations({
      url,
      pageTitle,
      pageDescription,
      apiBaseUrl,
      authToken: authSession?.accessToken ?? null,
      installId,
      aiSettings,
      installedExtensions,
    }),
  }
}
