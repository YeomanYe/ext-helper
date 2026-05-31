import type { AiSettings, Extension, GroupSuggestion, GroupSuggestionResult } from "@/types"
import { promptAiProvider } from "@/services/aiProvider"

interface SuggestExtensionsOptions {
  settings: AiSettings
  groupName: string
  extensions: Extension[]
  currentMemberIds: string[]
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const SUGGESTION_CONTAINER_KEYS = [
  "suggestions",
  "extensionIds",
  "extension_ids",
  "ids",
  "extensions",
  "recommendedExtensions",
  "recommended_extensions",
  "recommendedExtensionIds",
  "recommended_extension_ids",
  "recommendations",
  "suggestedExtensions",
  "suggested_extensions",
  "suggestedExtensionIds",
  "suggested_extension_ids",
  "matches",
  "items",
  "result",
  "data",
  "output",
  "response",
] as const

const SUGGESTION_ID_KEYS = [
  "id",
  "extensionId",
  "extensionID",
  "extension_id",
  "extId",
  "chromeExtensionId",
  "chrome_extension_id",
] as const

const SUGGESTION_NAME_KEYS = [
  "name",
  "extensionName",
  "extension_name",
  "title",
  "displayName",
  "label",
] as const

const SUGGESTION_REASON_KEYS = [
  "reason",
  "rationale",
  "why",
  "description",
  "explanation",
  "summary",
] as const

const SUGGESTION_KEY_PATTERN = [
  ...SUGGESTION_ID_KEYS,
  ...SUGGESTION_NAME_KEYS,
  ...SUGGESTION_REASON_KEYS,
  "extension",
].join("|")

const GROUP_SUGGESTIONS_STRUCTURED_OUTPUT = {
  name: "return_group_suggestions",
  description: "Return extension ids recommended for the current group.",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      suggestions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["id"],
        },
      },
    },
    required: ["suggestions"],
  },
}

const looksLikeSuggestionRecord = (record: Record<string, unknown>) =>
  [...SUGGESTION_ID_KEYS, ...SUGGESTION_NAME_KEYS].some((key) => typeof record[key] === "string") ||
  Boolean(asRecord(record.extension))

const recordMapToSuggestionItems = (record: Record<string, unknown>) =>
  Object.entries(record)
    .map(([key, value]) => {
      if (Array.isArray(value)) return null
      const valueRecord = asRecord(value)
      if (typeof value === "string") return { id: key, reason: value }
      if (value === true) return { id: key }
      if (valueRecord) return { id: key, ...valueRecord }
      return null
    })
    .filter((item): item is Record<string, unknown> => item !== null)

const extractJsonCandidateText = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? text
  const start = Math.min(
    ...[candidate.indexOf("{"), candidate.indexOf("[")].filter((index) => index >= 0)
  )
  const endObject = candidate.lastIndexOf("}")
  const endArray = candidate.lastIndexOf("]")
  const end = Math.max(endObject, endArray)
  return Number.isFinite(start) && end >= start ? candidate.slice(start, end + 1) : candidate
}

const repairLikelyJsonText = (text: string) =>
  text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/}\s*(?={)/g, "},{")
    .replace(/]\s*(?=\[)/g, "],[")
    .replace(/"\s+(?=")/g, '","')

const parseJsonText = (text: string): unknown => JSON.parse(extractJsonCandidateText(text))

const decodeLooseString = (value: string) =>
  value
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")

const collectObjectItemsFromText = (text: string): Record<string, unknown>[] => {
  const objectSnippets = text.match(/\{[^{}]*\}/g) ?? []
  return objectSnippets
    .map((snippet) => {
      const record: Record<string, unknown> = {}
      const fieldPattern = new RegExp(
        `["']?(${SUGGESTION_KEY_PATTERN})["']?\\s*:\\s*["']((?:\\\\.|[^"'\\\\])*)["']`,
        "gi"
      )
      let match = fieldPattern.exec(snippet)

      while (match) {
        record[match[1]] = decodeLooseString(match[2])
        match = fieldPattern.exec(snippet)
      }

      return looksLikeSuggestionRecord(record) ? record : null
    })
    .filter((item): item is Record<string, unknown> => item !== null)
}

const collectArrayStringItemsFromText = (text: string): { id: string; name: string }[] => {
  const items: { id: string; name: string }[] = []
  const arrayPattern = new RegExp(
    `["'](?:${SUGGESTION_CONTAINER_KEYS.join("|")})["']\\s*:\\s*\\[([\\s\\S]*?)\\]`,
    "gi"
  )
  let arrayMatch = arrayPattern.exec(text)

  while (arrayMatch) {
    const valuePattern = /["']((?:\\.|[^"'\\])*)["']/g
    let valueMatch = valuePattern.exec(arrayMatch[1])
    while (valueMatch) {
      const value = decodeLooseString(valueMatch[1])
      items.push({ id: value, name: value })
      valueMatch = valuePattern.exec(arrayMatch[1])
    }
    arrayMatch = arrayPattern.exec(text)
  }

  return items
}

const collectTextSuggestionItems = (text: string): unknown[] => {
  for (const candidate of [text, repairLikelyJsonText(text)]) {
    try {
      const items = collectSuggestionItems(parseJsonText(candidate))
      if (items.length > 0) return items
    } catch {
      // Fall through to text extraction.
    }
  }

  const objectItems = collectObjectItemsFromText(text)
  if (objectItems.length > 0) return objectItems

  return collectArrayStringItemsFromText(text)
}

const collectSuggestionItems = (value: unknown, depth = 0): unknown[] => {
  if (typeof value === "string") return collectTextSuggestionItems(value)
  if (Array.isArray(value)) return value

  const record = asRecord(value)
  if (!record) return []
  if (looksLikeSuggestionRecord(record)) return [record]
  if (depth >= 3) return []

  const items: unknown[] = []

  for (const key of SUGGESTION_CONTAINER_KEYS) {
    const nestedValue = record[key]
    if (Array.isArray(nestedValue)) {
      items.push(...nestedValue)
      continue
    }

    const nestedRecord = asRecord(nestedValue)
    if (!nestedRecord) continue

    const nestedItems = collectSuggestionItems(nestedRecord, depth + 1)
    if (nestedItems.length > 0) {
      items.push(...nestedItems)
      continue
    }

    items.push(...recordMapToSuggestionItems(nestedRecord))
  }

  if (items.length === 0 && depth > 0) {
    items.push(...recordMapToSuggestionItems(record))
  }

  return items
}

function normalizeSuggestions(value: unknown): { id?: string; name?: string; reason?: string }[] {
  const rawSuggestions = collectSuggestionItems(value)

  return rawSuggestions
    .map((item) => {
      if (typeof item === "string") return { id: item, name: item }
      const itemRecord = asRecord(item)
      const nestedExtension = asRecord(itemRecord?.extension)
      const id =
        SUGGESTION_ID_KEYS.map((key) => itemRecord?.[key]).find(
          (candidate) => typeof candidate === "string"
        ) ??
        (typeof itemRecord?.extension === "string" ? itemRecord.extension : undefined) ??
        nestedExtension?.id ??
        nestedExtension?.extensionId
      const name =
        SUGGESTION_NAME_KEYS.map((key) => itemRecord?.[key]).find(
          (candidate) => typeof candidate === "string"
        ) ??
        SUGGESTION_NAME_KEYS.map((key) => nestedExtension?.[key]).find(
          (candidate) => typeof candidate === "string"
        )
      const reason = SUGGESTION_REASON_KEYS.map((key) => itemRecord?.[key]).find(
        (candidate) => typeof candidate === "string"
      )
      if (typeof id !== "string" && typeof name !== "string") return null
      return {
        id: typeof id === "string" ? id : undefined,
        name: typeof name === "string" ? name : undefined,
        reason: typeof reason === "string" ? reason : undefined,
      }
    })
    .filter((item): item is { id?: string; name?: string; reason?: string } => item !== null)
}

const normalizeLookupKey = (value: string) => value.trim().toLowerCase()
const normalizeLooseKey = (value: string) => normalizeLookupKey(value).replace(/[^a-z0-9]+/g, "")

const buildUniqueLookup = (
  extensions: Extension[],
  normalize: (value: string) => string
): Map<string, string | null> => {
  const lookup = new Map<string, string | null>()
  extensions.forEach((extension) => {
    const key = normalize(extension.name)
    if (!key) return
    lookup.set(key, lookup.has(key) ? null : extension.id)
  })
  return lookup
}

export function buildGroupSuggestionPrompt({
  groupName,
  extensions,
  currentMemberIds,
}: Omit<SuggestExtensionsOptions, "settings">): string {
  const candidateIds = extensions.map((extension) => extension.id)
  const payload = {
    task: "suggest-extension-ids-for-group",
    instructions: [
      "Return JSON only.",
      "Use only candidate extension ids.",
      "Do not suggest unknown ids.",
      "Prefer extensions whose name, description, permissions, and hostPermissions match the group name.",
    ],
    groupName,
    currentMemberIds,
    candidateIds,
    extensions: extensions.map((extension) => ({
      id: extension.id,
      name: extension.name,
      description: extension.description,
      permissions: extension.permissions,
      hostPermissions: extension.hostPermissions,
      enabled: extension.enabled,
    })),
    responseShape: {
      suggestions: [{ id: "extension-id", reason: "short reason" }],
    },
  }

  return JSON.stringify(payload)
}

export async function suggestExtensionsForGroup({
  settings,
  groupName,
  extensions,
  currentMemberIds,
}: SuggestExtensionsOptions): Promise<GroupSuggestionResult> {
  const extensionById = new Map(extensions.map((extension) => [extension.id, extension] as const))
  const extensionIdByName = buildUniqueLookup(extensions, normalizeLookupKey)
  const extensionIdByLooseName = buildUniqueLookup(extensions, normalizeLooseKey)
  const resolveExtensionId = (value?: string) => {
    if (!value) return null
    const trimmedValue = value.trim()
    if (!trimmedValue) return null
    if (extensionById.has(trimmedValue)) return trimmedValue

    const lookupKey = normalizeLookupKey(trimmedValue)
    const looseKey = normalizeLooseKey(trimmedValue)
    const exactMatch = extensionIdByName.get(lookupKey)
    if (exactMatch) return exactMatch
    if (!looseKey) return null

    const looseMatch = extensionIdByLooseName.get(looseKey)
    if (looseMatch) return looseMatch

    const fuzzyMatches = extensions.filter((extension) => {
      const candidate = normalizeLooseKey(extension.name)
      if (!candidate) return false
      return candidate.includes(looseKey) || looseKey.includes(candidate)
    })

    return fuzzyMatches.length === 1 ? fuzzyMatches[0].id : null
  }
  const prompt = buildGroupSuggestionPrompt({ groupName, extensions, currentMemberIds })
  const response = await promptAiProvider(settings, prompt, {
    debugLabel: "group-suggestions",
    returnRawOnParseError: true,
    structuredOutput: GROUP_SUGGESTIONS_STRUCTURED_OUTPUT,
  })
  const seenExtensionIds = new Set<string>()
  const suggestions: GroupSuggestion[] = normalizeSuggestions(response)
    .map((suggestion) => {
      const extensionId = resolveExtensionId(suggestion.id) ?? resolveExtensionId(suggestion.name)

      if (!extensionId) return null
      if (seenExtensionIds.has(extensionId)) return null
      seenExtensionIds.add(extensionId)

      return {
        extensionId,
        reason: suggestion.reason || "Suggested for this group",
      }
    })
    .filter((suggestion): suggestion is GroupSuggestion => suggestion !== null)

  return { suggestions }
}
