import type {
  Group,
  ImportExportDomain,
  ImportExportPayload,
  ImportExportPreferences,
  ParsedImportExportPayload,
  UsageLogEvent,
} from "@/types"
import type { Rule } from "@/rules/types"
import { groupsRepo } from "@/services/groupsRepo"
import { preferencesRepo } from "@/services/preferencesRepo"
import { rulesRepo } from "@/services/rulesRepo"
import { usageLogRepo } from "@/services/usageLogRepo"

export const IMPORT_EXPORT_SCHEMA_VERSION = 1

export const IMPORT_EXPORT_DOMAINS: {
  domain: ImportExportDomain
  label: string
}[] = [
  { domain: "groups", label: "Groups" },
  { domain: "rules", label: "Rules" },
  { domain: "preferences", label: "Preferences" },
  { domain: "usageLog", label: "UsageLogEvents" },
]

const DOMAIN_LABELS = new Map(IMPORT_EXPORT_DOMAINS.map((item) => [item.domain, item.label]))
const DEFAULT_DOMAINS = IMPORT_EXPORT_DOMAINS.map((item) => item.domain)

export class ImportExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImportExportError"
  }
}

interface CreateExportPayloadOptions {
  domains?: ImportExportDomain[]
  now?: () => Date
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === "string"
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean"
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const assertString = (value: unknown, path: string) => {
  if (!isString(value)) throw new ImportExportError(`${path} must be a string`)
}

const assertBoolean = (value: unknown, path: string) => {
  if (!isBoolean(value)) throw new ImportExportError(`${path} must be a boolean`)
}

const assertNumber = (value: unknown, path: string) => {
  if (!isNumber(value)) throw new ImportExportError(`${path} must be a number`)
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const validateGroup = (value: unknown, index: number): Group => {
  if (!isRecord(value)) throw new ImportExportError(`groups[${index}] must be an object`)
  assertString(value.id, `groups[${index}].id`)
  assertString(value.name, `groups[${index}].name`)
  assertString(value.color, `groups[${index}].color`)
  assertString(value.icon, `groups[${index}].icon`)
  if (!Array.isArray(value.extensionIds) || !value.extensionIds.every(isString)) {
    throw new ImportExportError(`groups[${index}].extensionIds must be a string array`)
  }
  assertNumber(value.createdAt, `groups[${index}].createdAt`)
  assertNumber(value.updatedAt, `groups[${index}].updatedAt`)
  assertBoolean(value.isExpanded, `groups[${index}].isExpanded`)
  assertNumber(value.order, `groups[${index}].order`)
  if (value.iconUrl !== undefined && !isString(value.iconUrl)) {
    throw new ImportExportError(`groups[${index}].iconUrl must be a string`)
  }
  return clone(value as unknown as Group)
}

const validateRule = (value: unknown, index: number): Rule => {
  if (!isRecord(value)) throw new ImportExportError(`rules[${index}] must be an object`)
  assertString(value.id, `rules[${index}].id`)
  assertString(value.name, `rules[${index}].name`)
  assertBoolean(value.enabled, `rules[${index}].enabled`)
  if (!Array.isArray(value.conditionGroups)) {
    throw new ImportExportError(`rules[${index}].conditionGroups must be an array`)
  }
  if (value.conditionOperator !== "AND" && value.conditionOperator !== "OR") {
    throw new ImportExportError(`rules[${index}].conditionOperator is invalid`)
  }
  if (!Array.isArray(value.actions)) {
    throw new ImportExportError(`rules[${index}].actions must be an array`)
  }
  assertNumber(value.priority, `rules[${index}].priority`)
  assertNumber(value.createdAt, `rules[${index}].createdAt`)
  assertNumber(value.updatedAt, `rules[${index}].updatedAt`)
  assertNumber(value.triggerCount, `rules[${index}].triggerCount`)
  return clone(value as unknown as Rule)
}

const validatePreferences = (value: unknown): ImportExportPreferences => {
  if (!isRecord(value)) throw new ImportExportError("preferences must be an object")
  const preferences: ImportExportPreferences = {}
  if (value.theme !== undefined) {
    if (value.theme !== "light" && value.theme !== "dark" && value.theme !== "system") {
      throw new ImportExportError("preferences.theme is invalid")
    }
    preferences.theme = value.theme
  }
  if (value.compactMode !== undefined) {
    assertBoolean(value.compactMode, "preferences.compactMode")
    if (isBoolean(value.compactMode)) preferences.compactMode = value.compactMode
  }
  if (value.showDisabled !== undefined) {
    assertBoolean(value.showDisabled, "preferences.showDisabled")
    if (isBoolean(value.showDisabled)) preferences.showDisabled = value.showDisabled
  }
  if (value.viewMode !== undefined) {
    if (value.viewMode !== "compact" && value.viewMode !== "card" && value.viewMode !== "detail") {
      throw new ImportExportError("preferences.viewMode is invalid")
    }
    preferences.viewMode = value.viewMode
  }
  return preferences
}

const validateUsageLogEvent = (value: unknown, index: number): UsageLogEvent => {
  if (!isRecord(value)) throw new ImportExportError(`usageLog[${index}] must be an object`)
  assertString(value.id, `usageLog[${index}].id`)
  assertString(value.extensionId, `usageLog[${index}].extensionId`)
  assertString(value.extensionName, `usageLog[${index}].extensionName`)
  if (
    value.action !== "enabled" &&
    value.action !== "disabled" &&
    value.action !== "installed" &&
    value.action !== "uninstalled"
  ) {
    throw new ImportExportError(`usageLog[${index}].action is invalid`)
  }
  assertNumber(value.timestamp, `usageLog[${index}].timestamp`)
  if (value.source !== "popup" && value.source !== "browser" && value.source !== "background") {
    throw new ImportExportError(`usageLog[${index}].source is invalid`)
  }
  if (value.iconUrl !== undefined && value.iconUrl !== null && !isString(value.iconUrl)) {
    throw new ImportExportError(`usageLog[${index}].iconUrl must be a string or null`)
  }
  return clone(value as unknown as UsageLogEvent)
}

const validatePayload = (value: unknown): ImportExportPayload => {
  if (!isRecord(value)) throw new ImportExportError("Backup file must contain an object")
  if (value.schemaVersion !== IMPORT_EXPORT_SCHEMA_VERSION) {
    throw new ImportExportError("Backup version is not compatible with this Ext Helper version")
  }
  assertString(value.exportedAt, "exportedAt")
  if (!isString(value.exportedAt) || Number.isNaN(Date.parse(value.exportedAt))) {
    throw new ImportExportError("exportedAt must be an ISO date")
  }
  if (!isRecord(value.data)) throw new ImportExportError("data must be an object")

  const data: ImportExportPayload["data"] = {}
  if (value.data.groups !== undefined) {
    if (!Array.isArray(value.data.groups)) throw new ImportExportError("groups must be an array")
    data.groups = value.data.groups.map(validateGroup)
  }
  if (value.data.rules !== undefined) {
    if (!Array.isArray(value.data.rules)) throw new ImportExportError("rules must be an array")
    data.rules = value.data.rules.map(validateRule)
  }
  if (value.data.preferences !== undefined) {
    data.preferences = validatePreferences(value.data.preferences)
  }
  if (value.data.usageLog !== undefined) {
    if (!Array.isArray(value.data.usageLog)) {
      throw new ImportExportError("usageLog must be an array")
    }
    data.usageLog = value.data.usageLog.map(validateUsageLogEvent)
  }

  if (Object.keys(data).length === 0) {
    throw new ImportExportError("Backup file does not contain importable data")
  }

  return {
    schemaVersion: IMPORT_EXPORT_SCHEMA_VERSION,
    exportedAt: value.exportedAt,
    data,
  }
}

export async function createExportPayload({
  domains = DEFAULT_DOMAINS,
  now = () => new Date(),
}: CreateExportPayloadOptions = {}): Promise<ImportExportPayload> {
  const selected = new Set(domains)
  const data: ImportExportPayload["data"] = {}

  if (selected.has("groups")) data.groups = await groupsRepo.fetchAll()
  if (selected.has("rules")) data.rules = await rulesRepo.fetchAll()
  if (selected.has("preferences")) {
    const preferences = await preferencesRepo.fetch()
    data.preferences = {
      ...(preferences.theme !== undefined ? { theme: preferences.theme } : {}),
      ...(preferences.compactMode !== undefined ? { compactMode: preferences.compactMode } : {}),
      ...(preferences.showDisabled !== undefined ? { showDisabled: preferences.showDisabled } : {}),
      ...(preferences.viewMode !== undefined ? { viewMode: preferences.viewMode } : {}),
    }
  }
  if (selected.has("usageLog")) data.usageLog = await usageLogRepo.fetchAll()

  return {
    schemaVersion: IMPORT_EXPORT_SCHEMA_VERSION,
    exportedAt: now().toISOString(),
    data,
  }
}

export function buildImportPreview(
  payload: ImportExportPayload
): ParsedImportExportPayload["preview"] {
  return {
    schemaVersion: payload.schemaVersion,
    exportedAt: payload.exportedAt,
    compatible: payload.schemaVersion === IMPORT_EXPORT_SCHEMA_VERSION,
    domains: IMPORT_EXPORT_DOMAINS.filter(({ domain }) => payload.data[domain] !== undefined).map(
      ({ domain }) => {
        const value = payload.data[domain]
        return {
          domain,
          label: DOMAIN_LABELS.get(domain) ?? domain,
          count: Array.isArray(value) ? value.length : Object.keys(value ?? {}).length,
          selected: true,
        }
      }
    ),
  }
}

export function parseImportPayload(text: string): ParsedImportExportPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new ImportExportError("Import file must be valid JSON")
  }

  const payload = validatePayload(parsed)
  return {
    payload,
    preview: buildImportPreview(payload),
  }
}

export async function importSelectedDomains(
  payload: ImportExportPayload,
  domains: ImportExportDomain[]
): Promise<void> {
  const validated = validatePayload(payload)
  const selected = new Set(domains)

  if (selected.has("groups") && validated.data.groups) {
    await groupsRepo.saveAll(validated.data.groups)
  }
  if (selected.has("rules") && validated.data.rules) {
    await rulesRepo.saveAll(validated.data.rules)
  }
  if (selected.has("preferences") && validated.data.preferences) {
    await preferencesRepo.save(validated.data.preferences)
  }
  if (selected.has("usageLog") && validated.data.usageLog) {
    await usageLogRepo.replaceAll(validated.data.usageLog)
  }
}
