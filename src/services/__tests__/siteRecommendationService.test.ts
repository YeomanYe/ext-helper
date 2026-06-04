import { describe, expect, it, vi } from "vitest"
import {
  buildFallbackSiteRecommendations,
  fetchSiteRecommendations,
} from "@/services/siteRecommendationService"

const records = [
  {
    extensionId: "octotree",
    name: "Octotree",
    url: "https://chromewebstore.google.com/detail/octotree/octotree",
    iconUrl: "https://example.com/octotree.png",
    description: "GitHub code tree",
    rating: 4.8,
    ratingText: "Average rating 4.8 out of 5 stars.",
    usersText: "100,000 users",
    rank: 2,
    provider: "chrome-web-store-search",
    siteDomain: "github.com",
    siteLabel: "GitHub",
    siteRegion: "international",
    query: "github",
    crawledAt: "2026-06-03T12:00:00.000Z",
  },
  {
    extensionId: "refined-github",
    name: "Refined GitHub",
    url: "https://chromewebstore.google.com/detail/refined-github/refined",
    iconUrl: null,
    description: "Simplifies the GitHub interface",
    rating: 4.9,
    ratingText: "Average rating 4.9 out of 5 stars.",
    usersText: "200,000 users",
    rank: 1,
    provider: "chrome-web-store-search",
    siteDomain: "github.com",
    siteLabel: "GitHub",
    siteRegion: "international",
    query: "github productivity",
    crawledAt: "2026-06-03T12:00:00.000Z",
  },
  {
    extensionId: "refined-github",
    name: "Refined GitHub",
    url: "https://chromewebstore.google.com/detail/refined-github/refined",
    iconUrl: null,
    description: "Duplicate result with lower rank",
    rating: 4.9,
    ratingText: "Average rating 4.9 out of 5 stars.",
    usersText: "200,000 users",
    rank: 7,
    provider: "chrome-web-store-search",
    siteDomain: "github.com",
    siteLabel: "GitHub",
    siteRegion: "international",
    query: "github code review",
    crawledAt: "2026-06-03T12:00:00.000Z",
  },
  {
    extensionId: "notion-helper",
    name: "Notion Helper",
    url: "https://chromewebstore.google.com/detail/notion-helper/notion",
    iconUrl: null,
    description: "Notion tools",
    rating: 4.2,
    ratingText: null,
    usersText: "10,000 users",
    rank: 1,
    provider: "chrome-web-store-search",
    siteDomain: "notion.so",
    siteLabel: "Notion",
    siteRegion: "international",
    query: "notion",
    crawledAt: "2026-06-03T12:00:00.000Z",
  },
] as const

describe("buildFallbackSiteRecommendations", () => {
  it("returns deduped crawler recommendations for the current domain ordered by rank", () => {
    const result = buildFallbackSiteRecommendations({
      url: "https://www.github.com/pulls",
      records,
      limit: 5,
    })

    expect(result.domain).toBe("github.com")
    expect(result.source).toBe("fallback")
    expect(result.recommendations.map((item) => item.extensionId)).toEqual([
      "refined-github",
      "octotree",
    ])
    expect(result.recommendations[0]).toMatchObject({
      name: "Refined GitHub",
      rank: 1,
      sourceQuery: "github productivity",
      reason: "Recommended from crawler data for GitHub.",
    })
  })

  it("returns an empty fallback result when the crawler has no domain match", () => {
    const result = buildFallbackSiteRecommendations({
      url: "https://linear.app/acme",
      records,
    })

    expect(result.domain).toBe("linear.app")
    expect(result.recommendations).toEqual([])
    expect(result.totalCandidates).toBe(0)
  })
})

describe("fetchSiteRecommendations", () => {
  it("uses the remote API when an API base URL is configured", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        domain: "github.com",
        source: "remote",
        totalCandidates: 1,
        recommendations: [
          {
            extensionId: "remote-helper",
            name: "Remote Helper",
            url: "https://chromewebstore.google.com/detail/remote-helper/id",
            iconUrl: null,
            description: "Remote recommendation",
            rating: 5,
            ratingText: null,
            usersText: "1,000 users",
            rank: 1,
            sourceQuery: "github",
            reason: "Remote match",
          },
        ],
      }),
    })

    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      apiBaseUrl: "https://api.example.com",
      authToken: "token-1",
      fallbackRecords: records,
      fetchImpl,
    })

    expect(result.source).toBe("remote")
    expect(result.recommendations[0].extensionId).toBe("remote-helper")
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/v1/recommendations?url=https%3A%2F%2Fgithub.com%2F",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      })
    )
  })

  it("falls back to crawler data when the remote API is unavailable", async () => {
    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      apiBaseUrl: "https://api.example.com",
      fallbackRecords: records,
      fetchImpl: vi.fn().mockRejectedValue(new Error("network down")),
    })

    expect(result.source).toBe("fallback")
    expect(result.recommendations.map((item) => item.extensionId)).toEqual([
      "refined-github",
      "octotree",
    ])
    expect(result.error).toBe("network down")
  })
})
