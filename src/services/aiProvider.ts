import type { AiSettings, ChromeLocalAiStatus } from "@/types"
import { getEffectiveAiProvider, normalizeAiSettings } from "@/services/aiSettings"
import { logger } from "@/utils/logger"

type JsonRecord = Record<string, unknown>
const MINI_MAX_PROVIDER_ID = "minimax"
const MODEL_SCOPE_PROVIDER_ID = "modelscope"

export interface PromptAiProviderOptions {
  debugLabel?: string
  jsonResponse?: boolean
  returnRawOnParseError?: boolean
  maxTokens?: number
  structuredOutput?: {
    name: string
    description: string
    schema: JsonRecord
  }
}

interface PromptLanguageModel {
  prompt: (input: string) => Promise<string>
}

interface ChromeLocalAiGlobal {
  languageModel?: {
    capabilities?: () => Promise<{ available?: string | boolean }>
    create?: () => Promise<PromptLanguageModel>
  }
  assistant?: {
    capabilities?: () => Promise<{ available?: string | boolean }>
    create?: () => Promise<PromptLanguageModel>
  }
}

const asRecord = (value: unknown): JsonRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null

function extractTextFromContentValue(value: unknown): string | null {
  if (typeof value === "string") return value
  if (!Array.isArray(value)) return null

  for (const item of value) {
    if (typeof item === "string" && item.trim()) return item

    const itemRecord = asRecord(item)
    if (!itemRecord) continue
    if (typeof itemRecord.text === "string" && itemRecord.text.trim()) return itemRecord.text
    if (typeof itemRecord.content === "string" && itemRecord.content.trim()) {
      return itemRecord.content
    }

    const nestedContentText = extractTextFromContentValue(itemRecord.content)
    if (nestedContentText) return nestedContentText
  }

  return null
}

function parseStructuredArguments(value: unknown): unknown | null {
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  return value === undefined ? null : value
}

function extractStructuredOutputFromProviderResponse(
  response: unknown,
  structuredOutput: PromptAiProviderOptions["structuredOutput"]
): unknown | null {
  if (!structuredOutput) return null
  const record = asRecord(response)
  if (!record) return null

  const choices = Array.isArray(record.choices) ? record.choices : []
  for (const choice of choices) {
    const message = asRecord(asRecord(choice)?.message)
    const toolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : []
    for (const toolCall of toolCalls) {
      const functionCall = asRecord(asRecord(toolCall)?.function)
      if (functionCall?.name !== structuredOutput.name) continue
      return parseStructuredArguments(functionCall.arguments)
    }
  }

  const content = Array.isArray(record.content) ? record.content : []
  for (const item of content) {
    const itemRecord = asRecord(item)
    if (!itemRecord) continue
    if (itemRecord.type !== "tool_use" || itemRecord.name !== structuredOutput.name) continue
    return parseStructuredArguments(itemRecord.input)
  }

  return null
}

function logStructuredOutput(output: unknown, options?: PromptAiProviderOptions) {
  if (!options?.debugLabel) return
  logger.log(`[AI][${options.debugLabel}] structured output:`, output)
}

function getApiBaseUrl(settings: AiSettings): string {
  const normalized = normalizeAiSettings(settings)
  return (normalized.customModelBaseUrl ?? normalized.baseUrl ?? "").trim().replace(/\/+$/, "")
}

async function createProviderHttpError(response: Response): Promise<Error> {
  const detail = await response.text().catch(() => "")
  const suffix = detail.trim() ? `: ${detail.trim().slice(0, 300)}` : ""
  return new Error(`AI provider request failed (${response.status})${suffix}`)
}

function normalizeMiniMaxOpenAiBaseUrl(rawUrl: string): string {
  const baseUrl = rawUrl.replace(/\/+$/, "")
  if (
    baseUrl.includes("/anthropic") ||
    baseUrl.endsWith("/v1") ||
    baseUrl.endsWith("/chat/completions")
  ) {
    return baseUrl
  }
  return `${baseUrl}/v1`
}

function normalizeMiniMaxAnthropicBaseUrl(rawUrl: string): string {
  let baseUrl = rawUrl.replace(/\/+$/, "")
  if (!baseUrl.includes("/anthropic")) return `${baseUrl}/anthropic/v1`

  if (!baseUrl.endsWith("/anthropic/v1")) {
    if (baseUrl.endsWith("/anthropic")) {
      baseUrl = `${baseUrl}/v1`
    } else {
      baseUrl = `${baseUrl}/anthropic/v1`
    }
  }

  return baseUrl
}

function getOpenAiChatCompletionsUrl(settings: AiSettings): string {
  const normalized = normalizeAiSettings(settings)
  const baseUrl =
    normalized.customModelProviderId === MINI_MAX_PROVIDER_ID
      ? normalizeMiniMaxOpenAiBaseUrl(getApiBaseUrl(normalized))
      : getApiBaseUrl(normalized)
  if (baseUrl.endsWith("/chat/completions")) return baseUrl
  return `${baseUrl}/chat/completions`
}

function getAnthropicMessagesUrl(settings: AiSettings): string {
  const normalized = normalizeAiSettings(settings)
  const baseUrl = getApiBaseUrl(normalized)
  const parsed = new URL(baseUrl)
  const path = parsed.pathname.replace(/\/+$/, "")

  if (path.endsWith("/messages")) return baseUrl
  if (normalized.customModelProviderId === MINI_MAX_PROVIDER_ID) {
    return `${normalizeMiniMaxAnthropicBaseUrl(baseUrl)}/messages`
  }
  return `${baseUrl}/messages`
}

function isMiniMaxOpenAiEndpoint(settings: AiSettings): boolean {
  const normalized = normalizeAiSettings(settings)
  return (
    normalized.customModelProviderId === MINI_MAX_PROVIDER_ID &&
    !getApiBaseUrl(normalized).includes("/anthropic")
  )
}

function getProviderModelName(settings: AiSettings): string {
  const normalized = normalizeAiSettings(settings)
  const model = normalized.customModelName || normalized.model
  if (normalized.customModelProviderId !== MINI_MAX_PROVIDER_ID) return model
  if (model === "MiniMax-2.7") return "MiniMax-M2.7"
  if (model === "MiniMax-2.7-highspeed") return "MiniMax-M2.7-highspeed"
  if (model === "MiniMax-2.5") return "MiniMax-M2.5"
  if (model === "MiniMax-2.5-highspeed") return "MiniMax-M2.5-highspeed"
  return model
}

function getChromeLocalAi(): ChromeLocalAiGlobal | null {
  const candidate = (globalThis as { ai?: ChromeLocalAiGlobal }).ai
  return candidate ?? null
}

function extractTextFromProviderResponse(response: unknown): string {
  if (typeof response === "string") return response
  const record = asRecord(response)
  if (!record) return JSON.stringify(response)

  const choices = Array.isArray(record.choices) ? record.choices : []
  const firstChoice = asRecord(choices[0])
  const message = asRecord(firstChoice?.message)
  if (typeof message?.content === "string") return message.content
  const messageContentText = extractTextFromContentValue(message?.content)
  if (messageContentText) return messageContentText
  if (typeof firstChoice?.text === "string") return firstChoice.text

  const contentText = extractTextFromContentValue(record.content)
  if (contentText) return contentText

  if (typeof record.output_text === "string") return record.output_text
  const outputText = extractTextFromContentValue(record.output)
  if (outputText) return outputText
  if (typeof record.completion === "string") return record.completion
  return JSON.stringify(response)
}

function parseMiniMaxToolCallText(text: string): unknown | null {
  if (!text.includes("<invoke") && !text.includes("<minimax:tool_call")) return null
  const result: Record<string, unknown> = {}
  let found = false
  const paramRegex = /<parameter name="([^"]+)">([\s\S]*?)<\/parameter>/g
  let match: RegExpExecArray | null
  while ((match = paramRegex.exec(text)) !== null) {
    const name = match[1]
    const raw = match[2].trim()
    try {
      result[name] = JSON.parse(raw)
    } catch {
      result[name] = raw
    }
    found = true
  }
  return found ? result : null
}

export function parseAiJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? text
  const start = Math.min(
    ...[candidate.indexOf("{"), candidate.indexOf("[")].filter((index) => index >= 0)
  )
  const endObject = candidate.lastIndexOf("}")
  const endArray = candidate.lastIndexOf("]")
  const end = Math.max(endObject, endArray)
  const jsonText =
    Number.isFinite(start) && end >= start ? candidate.slice(start, end + 1) : candidate
  return JSON.parse(jsonText)
}

function parseAiProviderOutput(text: string, options?: PromptAiProviderOptions): unknown {
  if (options?.debugLabel) {
    logger.log(`[AI][${options.debugLabel}] raw output:`, text)
  }
  const miniMax = parseMiniMaxToolCallText(text)
  if (miniMax !== null) return miniMax
  try {
    return parseAiJson(text)
  } catch (error) {
    if (options?.returnRawOnParseError) return text
    throw error
  }
}

export async function detectChromeLocalAiStatus(): Promise<ChromeLocalAiStatus> {
  const localAi = getChromeLocalAi()
  const factory = localAi?.languageModel ?? localAi?.assistant
  if (!factory?.capabilities || !factory?.create) {
    return { available: false, message: "Chrome Prompt API is not available in this browser." }
  }

  try {
    const capabilities = await factory.capabilities()
    const available = capabilities.available === true || capabilities.available === "readily"
    return {
      available,
      message: available ? "Chrome Prompt API is available." : "Chrome Prompt API is not ready.",
    }
  } catch {
    return { available: false, message: "Chrome Prompt API capability check failed." }
  }
}

async function promptChromeLocal(
  prompt: string,
  options?: PromptAiProviderOptions
): Promise<unknown> {
  const localAi = getChromeLocalAi()
  const factory = localAi?.languageModel ?? localAi?.assistant
  if (!factory?.create) throw new Error("Chrome local AI is not available")
  const model = await factory.create()
  return parseAiProviderOutput(await model.prompt(prompt), options)
}

async function promptOpenAiCompatible(
  settings: AiSettings,
  prompt: string,
  options?: PromptAiProviderOptions
): Promise<unknown> {
  const normalized = normalizeAiSettings(settings)
  const model = getProviderModelName(normalized)
  const apiKey = normalized.customModelApiKey || normalized.apiKey || ""
  const jsonResponse = Boolean(options?.jsonResponse || options?.structuredOutput)
  if (!getApiBaseUrl(normalized)) throw new Error("AI provider base URL is required")
  if (!model.trim()) throw new Error("AI provider model is required")
  const response = await fetch(getOpenAiChatCompletionsUrl(normalized), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Return strict JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      ...(normalized.customModelProviderId === MODEL_SCOPE_PROVIDER_ID
        ? { enable_thinking: false }
        : {}),
      ...(jsonResponse ? { response_format: { type: "json_object" } } : {}),
    }),
  })
  if (!response.ok) throw await createProviderHttpError(response)
  return parseAiProviderOutput(extractTextFromProviderResponse(await response.json()), options)
}

async function promptAnthropicCompatible(
  settings: AiSettings,
  prompt: string,
  options?: PromptAiProviderOptions
): Promise<unknown> {
  const normalized = normalizeAiSettings(settings)
  const model = getProviderModelName(normalized)
  const apiKey = normalized.customModelApiKey || normalized.apiKey || ""
  if (!getApiBaseUrl(normalized)) throw new Error("AI provider base URL is required")
  if (!model.trim()) throw new Error("AI provider model is required")
  const response = await fetch(getAnthropicMessagesUrl(normalized), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: 0.2,
      system: options?.structuredOutput
        ? "Use the required tool to return structured data. Do not write free-form text."
        : "Return strict JSON only.",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      ...(options?.structuredOutput
        ? {
            tools: [
              {
                name: options.structuredOutput.name,
                description: options.structuredOutput.description,
                input_schema: options.structuredOutput.schema,
              },
            ],
            tool_choice: { type: "tool", name: options.structuredOutput.name },
          }
        : {}),
    }),
  })
  if (!response.ok) throw await createProviderHttpError(response)
  const responsePayload = await response.json()
  logger.log("[AI][anthropic-compatible] raw response payload", responsePayload)
  const structuredOutput = extractStructuredOutputFromProviderResponse(
    responsePayload,
    options?.structuredOutput
  )
  if (structuredOutput !== null) {
    logger.log("[AI][anthropic-compatible] structured output extracted", structuredOutput)
    logStructuredOutput(structuredOutput, options)
    return structuredOutput
  }
  const extractedText = extractTextFromProviderResponse(responsePayload)
  logger.log("[AI][anthropic-compatible] fallback text extraction", extractedText)
  return parseAiProviderOutput(extractedText, options)
}

async function testOpenAiCompatible(settings: AiSettings): Promise<void> {
  const normalized = normalizeAiSettings(settings)
  const model = getProviderModelName(normalized)
  const apiKey = normalized.customModelApiKey || normalized.apiKey || ""
  if (!getApiBaseUrl(normalized)) throw new Error("AI provider base URL is required")
  if (!model.trim()) throw new Error("AI provider model is required")
  const response = await fetch(getOpenAiChatCompletionsUrl(normalized), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with exactly the text OK." }],
      max_tokens: 20,
      temperature: 0.2,
      ...(normalized.customModelProviderId === MODEL_SCOPE_PROVIDER_ID
        ? { enable_thinking: false }
        : {}),
    }),
  })
  if (!response.ok) throw await createProviderHttpError(response)
}

async function testAnthropicCompatible(settings: AiSettings): Promise<void> {
  const normalized = normalizeAiSettings(settings)
  const model = getProviderModelName(normalized)
  const apiKey = normalized.customModelApiKey || normalized.apiKey || ""
  if (!getApiBaseUrl(normalized)) throw new Error("AI provider base URL is required")
  if (!model.trim()) throw new Error("AI provider model is required")
  const response = await fetch(getAnthropicMessagesUrl(normalized), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: 20,
      temperature: 0.2,
      system: "You are a connectivity checker. Reply with a short plain-text acknowledgement.",
      messages: [
        { role: "user", content: [{ type: "text", text: "Reply with exactly the text OK." }] },
      ],
    }),
  })
  if (!response.ok) throw await createProviderHttpError(response)
}

export async function promptAiProvider(
  settings: AiSettings,
  prompt: string,
  options?: PromptAiProviderOptions
): Promise<unknown> {
  const normalized = normalizeAiSettings(settings)
  const effectiveProvider = getEffectiveAiProvider(normalized)
  if (effectiveProvider === "manual") throw new Error("Manual mode is active")

  if (effectiveProvider === "chrome-local") return promptChromeLocal(prompt, options)
  if (isMiniMaxOpenAiEndpoint(normalized)) {
    return promptOpenAiCompatible(normalized, prompt, options)
  }
  if (normalized.customModelProvider === "anthropic-compatible") {
    return promptAnthropicCompatible(normalized, prompt, options)
  }
  return promptOpenAiCompatible(normalized, prompt, options)
}

export async function testAiProvider(settings: AiSettings): Promise<ChromeLocalAiStatus> {
  const normalized = normalizeAiSettings(settings)
  if (normalized.provider === "chrome-local") return detectChromeLocalAiStatus()

  const effectiveProvider = getEffectiveAiProvider(normalized)
  if (effectiveProvider === "manual") {
    return { available: false, message: "Manual mode does not call AI." }
  }

  try {
    if (isMiniMaxOpenAiEndpoint(normalized)) {
      await testOpenAiCompatible(normalized)
    } else if (normalized.customModelProvider === "anthropic-compatible") {
      await testAnthropicCompatible(normalized)
    } else {
      await testOpenAiCompatible(normalized)
    }
    return { available: true, message: "AI provider connection succeeded." }
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : "AI provider connection failed.",
    }
  }
}
