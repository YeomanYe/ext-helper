import { describe, expect, it } from "vitest"
import { shouldFocusSearchFromFindShortcut } from "@/components/popup/searchShortcut"

function keydown(
  overrides: Partial<Parameters<typeof shouldFocusSearchFromFindShortcut>[0]>
): Parameters<typeof shouldFocusSearchFromFindShortcut>[0] {
  return {
    key: "f",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target: null,
    ...overrides,
  }
}

describe("shouldFocusSearchFromFindShortcut", () => {
  it("normal: should accept Ctrl+F", () => {
    expect(shouldFocusSearchFromFindShortcut(keydown({ ctrlKey: true }))).toBe(true)
  })

  it("normal: should accept Cmd+F", () => {
    expect(shouldFocusSearchFromFindShortcut(keydown({ metaKey: true }))).toBe(true)
  })

  it("edge: should ignore editable targets", () => {
    const input = { tagName: "INPUT", isContentEditable: false } as HTMLElement

    expect(shouldFocusSearchFromFindShortcut(keydown({ ctrlKey: true, target: input }))).toBe(false)
  })

  it("edge: should ignore shortcuts with extra modifiers", () => {
    expect(shouldFocusSearchFromFindShortcut(keydown({ ctrlKey: true, shiftKey: true }))).toBe(
      false
    )
    expect(shouldFocusSearchFromFindShortcut(keydown({ metaKey: true, altKey: true }))).toBe(false)
  })
})
