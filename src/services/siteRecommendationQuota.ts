import type { SiteRecommendationResult } from "@/services/siteRecommendationService"

export function getRecommendationQuotaPointsText(
  recommendations: SiteRecommendationResult | undefined,
  loading = false
): string {
  if (loading) return "..."
  if (!recommendations?.quota) return "n/a"
  return `${recommendations.quota.remaining}/${recommendations.quota.limit}`
}
