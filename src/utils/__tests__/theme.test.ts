import { beforeEach, describe, expect, it, vi } from "vitest"

describe("theme accent", () => {
  beforeEach(() => {
    vi.resetModules()
    Object.defineProperty(globalThis, "document", {
      value: {
        documentElement: {
          setAttribute: vi.fn(),
          classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
          dataset: {} as Record<string, string>,
        },
      },
      configurable: true,
    })
    Object.defineProperty(globalThis, "window", {
      value: { matchMedia: vi.fn(() => ({ matches: true })) },
      configurable: true,
    })
  })

  it("ACCENT_PRESETS exposes default + 5 presets, each with a swatch", async () => {
    const { ACCENT_PRESETS } = await import("../theme")
    const values = ACCENT_PRESETS.map((p) => p.value)
    expect(values).toEqual(["default", "violet", "cyan", "emerald", "rose", "amber"])
    expect(
      ACCENT_PRESETS.every((p) => typeof p.swatch === "string" && p.swatch.startsWith("#"))
    ).toBe(true)
  })

  it("applyAccentColorDom sets data-accent for a non-default preset", async () => {
    const { applyAccentColorDom } = await import("../theme")
    applyAccentColorDom("violet")
    expect(document.documentElement.dataset.accent).toBe("violet")
  })

  it("applyAccentColorDom clears data-accent for default", async () => {
    const { applyAccentColorDom } = await import("../theme")
    document.documentElement.dataset.accent = "cyan"
    applyAccentColorDom("default")
    expect(document.documentElement.dataset.accent).toBeUndefined()
  })
})
