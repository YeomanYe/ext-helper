import { describe, expect, it, vi } from "vitest"
import type { Extension } from "@/types"
import type { SiteAuthSession } from "@/services/siteAuthService"
import {
  buildInstalledSiteDiscoveryPayload,
  buildSiteRecommendationPayload,
  getRecommendationQuotaPointsText,
  getInstalledExtensionsForRecommendations,
} from "@/services/siteDiscoveryPanelService"

const createExtension = (overrides: Partial<Extension>): Extension => ({
  id: overrides.id ?? "id",
  name: overrides.name ?? "Extension",
  description: overrides.description ?? "",
  version: overrides.version ?? "1.0.0",
  versionName: overrides.versionName ?? null,
  enabled: overrides.enabled ?? true,
  iconUrl: overrides.iconUrl ?? null,
  type: overrides.type ?? "extension",
  permissions: overrides.permissions ?? [],
  hostPermissions: overrides.hostPermissions ?? [],
  installType: overrides.installType ?? "normal",
  mayEnable: overrides.mayEnable ?? true,
  mayDisable: overrides.mayDisable ?? true,
  disabledReason: overrides.disabledReason ?? null,
  offlineEnabled: overrides.offlineEnabled ?? false,
  optionsUrl: overrides.optionsUrl ?? null,
  homepageUrl: overrides.homepageUrl ?? null,
  updateUrl: overrides.updateUrl ?? null,
})

const authSession: SiteAuthSession = {
  accessToken: "token-1",
  provider: "github",
  user: { id: "user-1", email: "user@example.com" },
  updatedAt: 1,
}

describe("site discovery panel payloads", () => {
  it("builds the installed-extension payload without waiting for recommendations", () => {
    const payload = buildInstalledSiteDiscoveryPayload({
      url: "https://github.com/acme/repo",
      pageTitle: "GitHub repo",
      pageDescription: "Code hosting",
      extensions: [
        createExtension({
          id: "github-helper",
          name: "GitHub Helper",
          description: "Improve GitHub code review",
          hostPermissions: ["https://github.com/*"],
        }),
      ],
      authSession,
      recommendationApiBaseUrl: "https://api.example.com",
      authApiConfigured: true,
      aiConfigured: false,
    })

    expect(payload.result.matches.map((match) => match.extension.id)).toEqual(["github-helper"])
    expect(payload.auth).toMatchObject({
      apiConfigured: true,
      authConfigured: true,
      aiConfigured: false,
      authenticated: true,
      provider: "github",
      user: { email: "user@example.com" },
    })
  })

  it("passes installed matches to the separate recommendation request", async () => {
    const fetchRecommendations = vi.fn().mockResolvedValue({
      domain: "github.com",
      source: "remote",
      totalCandidates: 0,
      recommendations: [],
    })
    const installedExtensions = [{ name: "GitHub Helper", description: "Improve GitHub" }]

    const payload = await buildSiteRecommendationPayload({
      url: "https://github.com/acme/repo",
      pageTitle: "GitHub repo",
      pageDescription: "Code hosting",
      apiBaseUrl: "https://api.example.com",
      authSession,
      installId: "install-1",
      aiSettings: undefined,
      installedExtensions,
      fetchRecommendations,
    })

    expect(payload.recommendations.source).toBe("remote")
    expect(fetchRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://github.com/acme/repo",
        pageTitle: "GitHub repo",
        pageDescription: "Code hosting",
        apiBaseUrl: "https://api.example.com",
        authToken: "token-1",
        installId: "install-1",
        aiSettings: undefined,
        installedExtensions,
      })
    )
  })

  it("extracts recommendation context from installed matches", () => {
    const payload = buildInstalledSiteDiscoveryPayload({
      url: "https://github.com/acme/repo",
      extensions: [
        createExtension({
          id: "github-helper",
          name: "GitHub Helper",
          description: "Improve GitHub code review",
          hostPermissions: ["https://github.com/*"],
        }),
      ],
      authSession: null,
      recommendationApiBaseUrl: "",
      authApiConfigured: false,
      aiConfigured: true,
    })

    expect(getInstalledExtensionsForRecommendations(payload.result)).toEqual([
      { name: "GitHub Helper", description: "Improve GitHub code review" },
    ])
  })

  it("formats recommendation quota as user points for the panel", () => {
    expect(getRecommendationQuotaPointsText(undefined, true)).toBe("...")
    expect(
      getRecommendationQuotaPointsText({
        domain: "github.com",
        source: "remote",
        totalCandidates: 0,
        recommendations: [],
        quota: {
          limit: 3,
          remaining: 2,
          resetsAt: "2026-06-06T00:00:00.000Z",
        },
      })
    ).toBe("2/3")
    expect(
      getRecommendationQuotaPointsText({
        domain: "github.com",
        source: "ai",
        totalCandidates: 0,
        recommendations: [],
      })
    ).toBe("n/a")
  })
})
