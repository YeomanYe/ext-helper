import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AiSettings } from "@/types"
import { fetchSiteRecommendations } from "@/services/siteRecommendationService"
import { promptAiProvider } from "@/services/aiProvider"

vi.mock("@/services/aiProvider", () => ({
  promptAiProvider: vi.fn(),
}))

const aiSettings: AiSettings = {
  enabled: true,
  provider: "openai-compatible",
  customModelProvider: "anthropic-compatible",
  customModelProviderId: "minimax",
  customModelBaseUrl: "https://api.minimax.io/anthropic",
  customModelName: "MiniMax-M2.7",
  customModelApiKey: "secret-key",
  model: "MiniMax-M2.7",
  apiKey: "secret-key",
}

describe("fetchSiteRecommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("uses the remote API when an API base URL is configured", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        domain: "github.com",
        source: "remote",
        totalCandidates: 2,
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
          {
            extensionId: "second-helper",
            name: "Second Helper",
            url: "https://chromewebstore.google.com/detail/second-helper/id",
            iconUrl: null,
            description: "Another remote recommendation",
            rating: 4,
            ratingText: null,
            usersText: "500 users",
            rank: 2,
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
      installId: "install-1",
      aiSettings,
      limit: 1,
      fetchImpl,
    })

    expect(result.source).toBe("remote")
    expect(result.totalCandidates).toBe(2)
    expect(result.recommendations.map((item) => item.extensionId)).toEqual(["remote-helper"])
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/v1/recommendations?url=https%3A%2F%2Fgithub.com%2F&limit=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-1",
          "X-Ext-Helper-Install-Id": "install-1",
        }),
      })
    )
    expect(promptAiProvider).not.toHaveBeenCalled()
  })

  it("normalizes remote quota metadata", async () => {
    const resetsAt = "2026-06-05T00:00:00.000Z"
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        domain: "github.com",
        source: "remote",
        totalCandidates: 0,
        recommendations: [],
        quota: {
          limit: 3,
          remaining: 2,
          resetsAt,
        },
      }),
    })

    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      apiBaseUrl: "https://api.example.com",
      installId: "install-1",
      fetchImpl,
    })

    expect(result.quota).toEqual({
      limit: 3,
      remaining: 2,
      resetsAt,
    })
  })

  it("uses configured AI recommendations when the remote service is not configured", async () => {
    vi.mocked(promptAiProvider).mockResolvedValue({
      recommendations: [
        {
          name: "Refined GitHub",
          url: "https://chromewebstore.google.com/detail/refined-github/hlepfoohegkhhmjieoechaddaejaokhf",
          description: "Simplifies and enhances GitHub.",
          reason: "Adds focused workflow improvements for GitHub pages.",
          sourceQuery: "github productivity",
        },
        {
          name: "Octotree",
          description: "Adds a repository code tree.",
          reason: "Helps navigate GitHub repositories.",
        },
      ],
    })

    const result = await fetchSiteRecommendations({
      url: "https://www.github.com/pulls",
      pageTitle: "Pull requests",
      aiSettings,
      installedExtensions: [{ name: "Ext Helper", description: "Manage extensions" }],
      limit: 2,
      fetchImpl: vi.fn(),
    })

    expect(result.source).toBe("ai")
    expect(result.domain).toBe("github.com")
    expect(result.recommendations).toHaveLength(2)
    expect(result.recommendations[0]).toMatchObject({
      extensionId: "hlepfoohegkhhmjieoechaddaejaokhf",
      name: "Refined GitHub",
      url: "https://chromewebstore.google.com/detail/refined-github/hlepfoohegkhhmjieoechaddaejaokhf",
      sourceQuery: "github productivity",
    })
    expect(result.recommendations[1]).toMatchObject({
      extensionId: "ai-octotree",
      url: "https://chromewebstore.google.com/search/Octotree",
    })
    expect(promptAiProvider).toHaveBeenCalledWith(
      aiSettings,
      expect.stringContaining("recommend-chrome-extensions-for-current-website"),
      expect.objectContaining({
        debugLabel: "site-recommendations",
        returnRawOnParseError: true,
      })
    )
  })

  it("returns no recommendations when neither remote service nor AI is configured", async () => {
    const fetchImpl = vi.fn()

    const result = await fetchSiteRecommendations({
      url: "https://www.github.com/pulls",
      fetchImpl,
    })

    expect(result).toEqual({
      domain: "github.com",
      source: "remote",
      totalCandidates: 0,
      recommendations: [],
      error: "Recommendation service and AI provider are not configured.",
    })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(promptAiProvider).not.toHaveBeenCalled()
  })

  it("returns no recommendations when the AI provider fails", async () => {
    vi.mocked(promptAiProvider).mockRejectedValue(new Error("model unavailable"))

    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      aiSettings,
    })

    expect(result).toEqual({
      domain: "github.com",
      source: "ai",
      totalCandidates: 0,
      recommendations: [],
      error: "model unavailable",
    })
  })

  it("returns no recommendations when the remote API is unavailable", async () => {
    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      apiBaseUrl: "https://api.example.com",
      fetchImpl: vi.fn().mockRejectedValue(new Error("network down")),
    })

    expect(result).toEqual({
      domain: "github.com",
      source: "remote",
      totalCandidates: 0,
      recommendations: [],
      error: "network down",
    })
  })

  it("falls back to AI when remote returns empty and preserves quota metadata", async () => {
    const resetsAt = "2026-06-08T00:00:00.000Z"
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        domain: "github.com",
        source: "remote",
        totalCandidates: 0,
        recommendations: [],
        quota: { limit: 3, remaining: 1, resetsAt },
      }),
    })
    vi.mocked(promptAiProvider).mockResolvedValue({
      recommendations: [
        {
          name: "Refined GitHub",
          url: "https://chromewebstore.google.com/detail/refined-github/hlepfoohegkhhmjieoechaddaejaokhf",
          reason: "Adds GitHub workflow improvements.",
        },
      ],
    })

    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      apiBaseUrl: "https://api.example.com",
      installId: "install-1",
      aiSettings,
      fetchImpl,
    })

    expect(result.source).toBe("ai")
    expect(result.recommendations).toHaveLength(1)
    expect(result.quota).toEqual({ limit: 3, remaining: 1, resetsAt })
    expect(promptAiProvider).toHaveBeenCalled()
  })

  it("falls back to AI when remote quota is exhausted and surfaces the limit info", async () => {
    const resetsAt = "2026-06-08T00:00:00.000Z"
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        domain: "github.com",
        source: "remote",
        totalCandidates: 0,
        recommendations: [],
        error: "Daily recommendation limit reached.",
        quota: { limit: 3, remaining: 0, resetsAt },
      }),
    })
    vi.mocked(promptAiProvider).mockResolvedValue({
      recommendations: [
        {
          name: "Octotree",
          reason: "Repository navigation tree.",
        },
      ],
    })

    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      apiBaseUrl: "https://api.example.com",
      installId: "install-1",
      aiSettings,
      fetchImpl,
    })

    expect(result.source).toBe("ai")
    expect(result.recommendations).toHaveLength(1)
    expect(result.quota).toEqual({ limit: 3, remaining: 0, resetsAt })
  })

  it("falls back to AI when the remote API errors out", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"))
    vi.mocked(promptAiProvider).mockResolvedValue({
      recommendations: [
        {
          name: "Dark Reader",
          reason: "Dark mode for any site.",
        },
      ],
    })

    const result = await fetchSiteRecommendations({
      url: "https://github.com/",
      apiBaseUrl: "https://api.example.com",
      aiSettings,
      fetchImpl,
    })

    expect(result.source).toBe("ai")
    expect(result.recommendations[0]?.name).toBe("Dark Reader")
  })
})
