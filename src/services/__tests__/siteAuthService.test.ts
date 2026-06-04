import { describe, expect, it } from "vitest"
import { buildLoginUrl, normalizeAuthSession } from "@/services/siteAuthService"

describe("buildLoginUrl", () => {
  it("builds a provider login URL with extension redirect URI", () => {
    const url = buildLoginUrl({
      apiBaseUrl: "https://api.example.com/",
      provider: "github",
      redirectUri: "https://abc.chromiumapp.org/",
    })

    expect(url).toBe(
      "https://api.example.com/v1/auth/github?redirect_uri=https%3A%2F%2Fabc.chromiumapp.org%2F"
    )
  })
})

describe("normalizeAuthSession", () => {
  it("accepts a valid session payload", () => {
    expect(
      normalizeAuthSession({
        accessToken: "token-1",
        provider: "google",
        user: {
          id: "user-1",
          email: "user@example.com",
          name: "User",
          avatarUrl: "https://example.com/avatar.png",
        },
        expiresAt: 1893456000000,
      })
    ).toMatchObject({
      accessToken: "token-1",
      provider: "google",
      user: { id: "user-1", email: "user@example.com" },
    })
  })

  it("returns null for invalid payloads", () => {
    expect(normalizeAuthSession({ accessToken: "", provider: "github" })).toBeNull()
    expect(normalizeAuthSession({ accessToken: "token", provider: "password" })).toBeNull()
    expect(normalizeAuthSession(null)).toBeNull()
  })
})
