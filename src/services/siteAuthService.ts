import { browserAdapter } from "@/services/browser/adapter"

export type SiteAuthProvider = "github" | "google"

export interface SiteAuthUser {
  id: string
  email?: string
  name?: string
  avatarUrl?: string
}

export interface SiteAuthSession {
  accessToken: string
  provider: SiteAuthProvider
  user: SiteAuthUser
  expiresAt?: number
  updatedAt: number
}

export const SITE_AUTH_SESSION_STORAGE_KEY = "ext-helper-auth-session"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value))

const parseString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined

const isSiteAuthProvider = (value: unknown): value is SiteAuthProvider =>
  value === "github" || value === "google"

export function normalizeAuthSession(value: unknown): SiteAuthSession | null {
  if (!isRecord(value)) return null

  const accessToken = parseString(value.accessToken)
  const provider = value.provider
  const user = isRecord(value.user) ? value.user : null
  const userId = parseString(user?.id)

  if (!accessToken || !isSiteAuthProvider(provider) || !userId) return null

  const expiresAt = typeof value.expiresAt === "number" ? value.expiresAt : undefined
  const updatedAt = typeof value.updatedAt === "number" ? value.updatedAt : Date.now()

  return {
    accessToken,
    provider,
    user: {
      id: userId,
      email: parseString(user?.email),
      name: parseString(user?.name),
      avatarUrl: parseString(user?.avatarUrl),
    },
    expiresAt,
    updatedAt,
  }
}

export function buildLoginUrl({
  apiBaseUrl,
  provider,
  redirectUri,
}: {
  apiBaseUrl: string
  provider: SiteAuthProvider
  redirectUri: string
}): string {
  const baseUrl = apiBaseUrl.trim().replace(/\/+$/, "")
  const url = new URL(`${baseUrl}/v1/auth/${provider}`)
  url.searchParams.set("redirect_uri", redirectUri)
  return url.toString()
}

export function parseAuthSessionFromRedirectUrl(redirectUrl: string): SiteAuthSession | null {
  const parsed = new URL(redirectUrl)
  const encodedSession = parsed.searchParams.get("session")
  const accessToken = parsed.searchParams.get("access_token")
  const provider = parsed.searchParams.get("provider")
  const userId = parsed.searchParams.get("user_id")

  if (encodedSession) {
    try {
      return normalizeAuthSession(JSON.parse(decodeURIComponent(encodedSession)))
    } catch {
      return null
    }
  }

  return normalizeAuthSession({
    accessToken,
    provider,
    user: {
      id: userId,
      email: parsed.searchParams.get("email") ?? undefined,
      name: parsed.searchParams.get("name") ?? undefined,
      avatarUrl: parsed.searchParams.get("avatar_url") ?? undefined,
    },
    expiresAt: Number(parsed.searchParams.get("expires_at")) || undefined,
  })
}

export const siteAuthSessionRepo = {
  async fetch(): Promise<SiteAuthSession | null> {
    return normalizeAuthSession(await browserAdapter.getStorage(SITE_AUTH_SESSION_STORAGE_KEY))
  },

  async save(session: SiteAuthSession): Promise<void> {
    await browserAdapter.setStorage(SITE_AUTH_SESSION_STORAGE_KEY, {
      ...session,
      updatedAt: Date.now(),
    })
  },

  async clear(): Promise<void> {
    await browserAdapter.removeStorage(SITE_AUTH_SESSION_STORAGE_KEY)
  },
}
