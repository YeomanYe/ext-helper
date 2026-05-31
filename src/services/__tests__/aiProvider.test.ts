import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AiSettings } from "@/types"

const openAiSettings: AiSettings = {
  enabled: true,
  provider: "openai-compatible",
  customModelProvider: "openai-compatible",
  customModelProviderId: "custom-openai",
  customModelBaseUrl: "https://api.example.test/v1",
  customModelName: "fast-model",
  customModelApiKey: "secret-key",
  baseUrl: "https://api.example.test/v1",
  model: "fast-model",
  apiKey: "secret-key",
}

const groupSuggestionsStructuredOutput = {
  name: "return_group_suggestions",
  description: "Return extension ids recommended for a group.",
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

describe("aiProvider", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("normal: calls an OpenAI compatible provider and parses JSON text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"suggestions":[{"id":"ext-1"}]}' } }],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    const result = await promptAiProvider(openAiSettings, "Return JSON")

    expect(result).toEqual({ suggestions: [{ id: "ext-1" }] })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer secret-key" }),
      })
    )
  })

  it("normal: requests OpenAI-compatible JSON mode for structured output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"suggestions":[{"id":"ext-1"}]}' } }],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    const result = await promptAiProvider(openAiSettings, "Return JSON", {
      structuredOutput: groupSuggestionsStructuredOutput,
    })

    expect(result).toEqual({ suggestions: [{ id: "ext-1" }] })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      response_format: { type: "json_object" },
    })
  })

  it("edge: reports local Chrome model unavailable without throwing browser API errors", async () => {
    const { detectChromeLocalAiStatus, promptAiProvider } = await import("@/services/aiProvider")

    await expect(detectChromeLocalAiStatus()).resolves.toMatchObject({ available: false })
    await expect(
      promptAiProvider({ enabled: true, provider: "chrome-local", model: "" }, "Return JSON")
    ).rejects.toThrow(/manual mode/i)
  })

  it("edge: rejects missing remote configuration before calling fetch", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    await expect(
      promptAiProvider({ enabled: true, provider: "openai-compatible", model: "" }, "Return JSON")
    ).rejects.toThrow(/model/i)
    await expect(
      promptAiProvider(
        {
          enabled: true,
          provider: "openai-compatible",
          customModelProvider: "openai-compatible",
          customModelProviderId: "custom-openai",
          customModelBaseUrl: "",
          customModelName: "fast-model",
          model: "fast-model",
        },
        "Return JSON"
      )
    ).rejects.toThrow(/base URL/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("normal: normalizes MiniMax Anthropic base URL and request body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: '{"suggestions":[{"id":"ext-1"}]}' }],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    const result = await promptAiProvider(
      {
        enabled: true,
        provider: "openai-compatible",
        customModelProvider: "anthropic-compatible",
        customModelProviderId: "minimax",
        customModelBaseUrl: "https://api.minimax.io/anthropic",
        customModelName: "MiniMax-2.7",
        customModelApiKey: "secret-key",
        model: "MiniMax-2.7",
      },
      "Return JSON"
    )

    expect(result).toEqual({ suggestions: [{ id: "ext-1" }] })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.minimax.io/anthropic/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "secret-key",
          "anthropic-version": "2023-06-01",
        }),
        body: expect.stringContaining('"system":"Return strict JSON only."'),
      })
    )
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      model: "MiniMax-M2.7",
      messages: [{ role: "user", content: [{ type: "text", text: "Return JSON" }] }],
    })
  })

  it("normal: forces Anthropic-compatible structured output with tool_choice", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            type: "tool_use",
            id: "toolu_1",
            name: "return_group_suggestions",
            input: { suggestions: [{ id: "ext-1", reason: "Matches the group" }] },
          },
        ],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    const result = await promptAiProvider(
      {
        enabled: true,
        provider: "openai-compatible",
        customModelProvider: "anthropic-compatible",
        customModelProviderId: "minimax",
        customModelBaseUrl: "https://api.minimax.io/anthropic",
        customModelName: "MiniMax-2.7",
        customModelApiKey: "secret-key",
        model: "MiniMax-2.7",
      },
      "Return JSON",
      { structuredOutput: groupSuggestionsStructuredOutput }
    )

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(result).toEqual({ suggestions: [{ id: "ext-1", reason: "Matches the group" }] })
    expect(requestBody).toMatchObject({
      tools: [
        {
          name: "return_group_suggestions",
          description: "Return extension ids recommended for a group.",
          input_schema: groupSuggestionsStructuredOutput.schema,
        },
      ],
      tool_choice: { type: "tool", name: "return_group_suggestions" },
    })
  })

  it("edge: reads the first text block from Anthropic-style content arrays", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          { type: "thinking", thinking: "consider candidates" },
          { type: "text", text: '{"suggestions":[{"id":"ext-1"}]}' },
        ],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    const result = await promptAiProvider(
      {
        enabled: true,
        provider: "openai-compatible",
        customModelProvider: "anthropic-compatible",
        customModelProviderId: "minimax",
        customModelBaseUrl: "https://api.minimax.io/anthropic",
        customModelName: "MiniMax-2.7",
        customModelApiKey: "secret-key",
        model: "MiniMax-2.7",
      },
      "Return JSON"
    )

    expect(result).toEqual({ suggestions: [{ id: "ext-1" }] })
  })

  it("normal: tests remote providers without requiring JSON output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "OK" } }],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { testAiProvider } = await import("@/services/aiProvider")

    await expect(testAiProvider(openAiSettings)).resolves.toMatchObject({
      available: true,
      message: "AI provider connection succeeded.",
    })
  })

  it("normal: logs raw provider output when a debug label is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"suggestions":[{"id":"ext-1"}]}' } }],
      }),
    })
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined)
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    await promptAiProvider(openAiSettings, "Return JSON", { debugLabel: "group-suggestions" })

    expect(consoleLog).toHaveBeenCalledWith(
      "[AI][group-suggestions] raw output:",
      '{"suggestions":[{"id":"ext-1"}]}'
    )
  })

  it("edge: can return raw model output when JSON parsing fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"suggestions":[{"id":"ext-1"} {"id":"ext-2"}]}' } }],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    const result = await promptAiProvider(openAiSettings, "Return JSON", {
      returnRawOnParseError: true,
    })

    expect(result).toBe('{"suggestions":[{"id":"ext-1"} {"id":"ext-2"}]}')
  })

  it("normal: supports MiniMax OpenAI-compatible base URL too", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"suggestions":[{"id":"ext-1"}]}' } }],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const { promptAiProvider } = await import("@/services/aiProvider")

    await promptAiProvider(
      {
        enabled: true,
        provider: "openai-compatible",
        customModelProvider: "openai-compatible",
        customModelProviderId: "minimax",
        customModelBaseUrl: "https://api.minimax.io",
        customModelName: "MiniMax-M2.7",
        customModelApiKey: "secret-key",
        model: "MiniMax-M2.7",
      },
      "Return JSON"
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.minimax.io/v1/chat/completions",
      expect.objectContaining({ method: "POST" })
    )
  })
})
