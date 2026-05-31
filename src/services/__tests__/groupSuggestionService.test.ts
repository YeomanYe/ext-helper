import { describe, expect, it, vi } from "vitest"
import type { AiSettings, Extension } from "@/types"

vi.mock("@/services/aiProvider", () => ({
  promptAiProvider: vi.fn(),
}))

const buildExtension = (id: string, name: string): Extension => ({
  id,
  name,
  description: `${name} description`,
  version: "1.0.0",
  versionName: null,
  enabled: true,
  iconUrl: null,
  type: "extension",
  permissions: ["tabs"],
  hostPermissions: ["https://example.com/*"],
  installType: "normal",
  mayEnable: true,
  mayDisable: true,
  disabledReason: null,
  offlineEnabled: true,
  optionsUrl: null,
  homepageUrl: null,
  updateUrl: null,
})

const settings: AiSettings = {
  enabled: true,
  provider: "openai-compatible",
  baseUrl: "https://api.example.test/v1",
  model: "fast-model",
  apiKey: "secret-key",
}

describe("groupSuggestionService", () => {
  it("normal: builds a structured payload with metadata and filters unknown ids", async () => {
    const { promptAiProvider } = await import("@/services/aiProvider")
    vi.mocked(promptAiProvider).mockResolvedValue({
      suggestions: [
        { id: "ext-a", reason: "Matches research permissions" },
        { id: "missing", reason: "Unknown" },
      ],
    })
    const { suggestExtensionsForGroup } = await import("@/services/groupSuggestionService")

    const result = await suggestExtensionsForGroup({
      settings,
      groupName: "Research",
      extensions: [buildExtension("ext-a", "Reader"), buildExtension("ext-b", "Notes")],
      currentMemberIds: ["ext-b"],
    })

    expect(result.suggestions).toEqual([
      { extensionId: "ext-a", reason: "Matches research permissions" },
    ])
    const prompt = vi.mocked(promptAiProvider).mock.calls[0][1]
    const options = vi.mocked(promptAiProvider).mock.calls[0][2]
    expect(prompt).toContain('"name":"Reader"')
    expect(prompt).toContain('"permissions":["tabs"]')
    expect(prompt).toContain('"hostPermissions":["https://example.com/*"]')
    expect(prompt).toContain('"currentMemberIds":["ext-b"]')
    expect(prompt).toContain('"candidateIds":["ext-a","ext-b"]')
    expect(options).toMatchObject({ debugLabel: "group-suggestions" })
    expect(options).toMatchObject({
      structuredOutput: {
        name: "return_group_suggestions",
        schema: expect.objectContaining({
          required: ["suggestions"],
        }),
      },
    })
  })

  it("edge: returns a recoverable empty result when the provider returns no suggestions", async () => {
    const { promptAiProvider } = await import("@/services/aiProvider")
    vi.mocked(promptAiProvider).mockResolvedValue({ suggestions: [] })
    const { suggestExtensionsForGroup } = await import("@/services/groupSuggestionService")

    await expect(
      suggestExtensionsForGroup({
        settings,
        groupName: "Empty",
        extensions: [buildExtension("ext-a", "Reader")],
        currentMemberIds: [],
      })
    ).resolves.toEqual({ suggestions: [] })
  })

  it("edge: resolves model suggestions that use extension names instead of ids", async () => {
    const { promptAiProvider } = await import("@/services/aiProvider")
    vi.mocked(promptAiProvider).mockResolvedValue({
      suggestions: [
        { name: "Reader", reason: "Matches reading work" },
        { extensionName: "Notes", reason: "Matches note taking" },
        "Unknown Name",
      ],
    })
    const { suggestExtensionsForGroup } = await import("@/services/groupSuggestionService")

    const result = await suggestExtensionsForGroup({
      settings,
      groupName: "Research",
      extensions: [buildExtension("ext-a", "Reader"), buildExtension("ext-b", "Notes")],
      currentMemberIds: [],
    })

    expect(result.suggestions).toEqual([
      { extensionId: "ext-a", reason: "Matches reading work" },
      { extensionId: "ext-b", reason: "Matches note taking" },
    ])
  })

  it("edge: does not resolve ambiguous duplicate extension names", async () => {
    const { promptAiProvider } = await import("@/services/aiProvider")
    vi.mocked(promptAiProvider).mockResolvedValue({
      suggestions: [
        { name: "Reader", reason: "Ambiguous duplicate name" },
        { id: "ext-c", reason: "Exact id still applies" },
      ],
    })
    const { suggestExtensionsForGroup } = await import("@/services/groupSuggestionService")

    const result = await suggestExtensionsForGroup({
      settings,
      groupName: "Research",
      extensions: [
        buildExtension("ext-a", "Reader"),
        buildExtension("ext-b", "Reader"),
        buildExtension("ext-c", "Notes"),
      ],
      currentMemberIds: [],
    })

    expect(result.suggestions).toEqual([{ extensionId: "ext-c", reason: "Exact id still applies" }])
  })

  it("edge: accepts common provider response aliases and fuzzy extension names", async () => {
    const { promptAiProvider } = await import("@/services/aiProvider")
    vi.mocked(promptAiProvider).mockResolvedValue({
      result: {
        recommendedExtensions: [
          { extension_id: "ext-a", rationale: "Useful for reading" },
          { title: "React Dev", why: "Short name from the model" },
          { extension: { name: "Notes" }, description: "Nested extension payload" },
          { id: "ext-a", reason: "Duplicate should be removed" },
        ],
      },
    })
    const { suggestExtensionsForGroup } = await import("@/services/groupSuggestionService")

    const result = await suggestExtensionsForGroup({
      settings,
      groupName: "Work",
      extensions: [
        buildExtension("ext-a", "Reader"),
        buildExtension("ext-b", "Notes"),
        buildExtension("ext-c", "React Developer Tools"),
      ],
      currentMemberIds: [],
    })

    expect(result.suggestions).toEqual([
      { extensionId: "ext-a", reason: "Useful for reading" },
      { extensionId: "ext-c", reason: "Short name from the model" },
      { extensionId: "ext-b", reason: "Nested extension payload" },
    ])
  })

  it("edge: accepts nested suggestion objects and id-to-reason maps", async () => {
    const { promptAiProvider } = await import("@/services/aiProvider")
    vi.mocked(promptAiProvider).mockResolvedValue({
      suggestions: {
        recommendedExtensions: [
          { extension: { title: "React Dev" }, explanation: "Frontend debugging" },
        ],
      },
      recommendations: {
        "ext-b": "Useful for notes",
      },
    })
    const { suggestExtensionsForGroup } = await import("@/services/groupSuggestionService")

    const result = await suggestExtensionsForGroup({
      settings,
      groupName: "Work",
      extensions: [
        buildExtension("ext-a", "Reader"),
        buildExtension("ext-b", "Notes"),
        buildExtension("ext-c", "React Developer Tools"),
      ],
      currentMemberIds: [],
    })

    expect(result.suggestions).toEqual([
      { extensionId: "ext-c", reason: "Frontend debugging" },
      { extensionId: "ext-b", reason: "Useful for notes" },
    ])
  })

  it("edge: recovers suggestions from malformed JSON text", async () => {
    const { promptAiProvider } = await import("@/services/aiProvider")
    vi.mocked(promptAiProvider).mockResolvedValue(
      '{"suggestions":[{"id":"ext-a","reason":"Useful for reading"} {"title":"React Dev","why":"Frontend debugging"}]}'
    )
    const { suggestExtensionsForGroup } = await import("@/services/groupSuggestionService")

    const result = await suggestExtensionsForGroup({
      settings,
      groupName: "Work",
      extensions: [
        buildExtension("ext-a", "Reader"),
        buildExtension("ext-b", "Notes"),
        buildExtension("ext-c", "React Developer Tools"),
      ],
      currentMemberIds: [],
    })

    expect(promptAiProvider).toHaveBeenCalledWith(
      settings,
      expect.any(String),
      expect.objectContaining({
        debugLabel: "group-suggestions",
        returnRawOnParseError: true,
      })
    )
    expect(result.suggestions).toEqual([
      { extensionId: "ext-a", reason: "Useful for reading" },
      { extensionId: "ext-c", reason: "Frontend debugging" },
    ])
  })
})
