import type { AiSettings, AiStatus, CustomModelProvider } from "@/types"
import { getKnownModelProviderPreset, getModelProviderPreset } from "@/services/modelProviders"

export const defaultAiSettings: AiSettings = {
  enabled: true,
  provider: "chrome-local",
  aiStatus: "unavailable",
  downloadProgress: 0,
  hasCloudKey: false,
  customModelProvider: "openai-compatible",
  customModelProviderId: "openai",
  customModelBaseUrl: "https://api.openai.com/v1",
  customModelName: "gpt-4o-mini",
  customModelApiKey: "",
  model: "",
  lastTestStatus: "idle",
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value))

const parseString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback

const parseNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const parseAiStatus = (value: unknown): AiStatus =>
  value === "available" ||
  value === "downloading" ||
  value === "downloadable" ||
  value === "unavailable"
    ? value
    : defaultAiSettings.aiStatus!

const parseCustomModelProvider = (
  value: unknown,
  fallback: CustomModelProvider
): CustomModelProvider =>
  value === "openai-compatible" || value === "anthropic-compatible" ? value : fallback

export function normalizeAiSettings(value: unknown): AiSettings {
  if (!isRecord(value)) return defaultAiSettings

  const legacyProvider = value.provider
  const provider =
    legacyProvider === "chrome-local" ||
    legacyProvider === "openai-compatible" ||
    legacyProvider === "manual"
      ? legacyProvider
      : legacyProvider === "anthropic-compatible"
        ? "openai-compatible"
        : defaultAiSettings.provider

  const rawProviderId =
    typeof value.customModelProviderId === "string"
      ? value.customModelProviderId
      : provider === "openai-compatible" && legacyProvider === "anthropic-compatible"
        ? "anthropic"
        : defaultAiSettings.customModelProviderId
  const preset =
    getKnownModelProviderPreset(rawProviderId) ??
    getModelProviderPreset(defaultAiSettings.customModelProviderId)
  const legacyBaseUrl = parseString(value.baseUrl, "")
  const legacyModel = parseString(value.model, "")
  const legacyApiKey = parseString(value.apiKey, "")
  const customModelApiKey = parseString(value.customModelApiKey, legacyApiKey)
  const enabled = typeof value.enabled === "boolean" ? value.enabled : provider !== "manual"

  return {
    enabled: provider !== "manual" && enabled,
    provider,
    aiStatus: parseAiStatus(value.aiStatus),
    downloadProgress: Math.max(
      0,
      Math.min(100, parseNumber(value.downloadProgress, defaultAiSettings.downloadProgress!))
    ),
    hasCloudKey:
      typeof value.hasCloudKey === "boolean"
        ? value.hasCloudKey
        : customModelApiKey.trim().length > 0,
    customModelProvider: parseCustomModelProvider(value.customModelProvider, preset.protocol),
    customModelProviderId: preset.id,
    customModelBaseUrl: parseString(
      value.customModelBaseUrl,
      typeof value.baseUrl === "string" ? legacyBaseUrl : preset.defaultBaseUrl
    ),
    customModelName: parseString(
      value.customModelName,
      typeof value.model === "string" ? legacyModel : preset.defaultModel
    ),
    customModelApiKey,
    baseUrl: parseString(value.customModelBaseUrl, legacyBaseUrl || preset.defaultBaseUrl),
    model: parseString(value.customModelName, legacyModel || preset.defaultModel),
    apiKey: customModelApiKey,
    lastTestStatus:
      value.lastTestStatus === "success" || value.lastTestStatus === "error"
        ? value.lastTestStatus
        : "idle",
    lastTestMessage: typeof value.lastTestMessage === "string" ? value.lastTestMessage : undefined,
  }
}

export function getEffectiveAiProvider(settings: AiSettings): AiSettings["provider"] {
  if (!settings.enabled || settings.provider === "manual") return "manual"
  if (settings.provider === "chrome-local" && settings.aiStatus === "unavailable") return "manual"
  return settings.provider
}
