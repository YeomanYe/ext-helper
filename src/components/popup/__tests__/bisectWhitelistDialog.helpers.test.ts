import { describe, it, expect } from "vitest"
import type { Extension } from "@/types"
import {
  visibleExtensions,
  countCandidates,
  toggleSelection,
} from "@/components/popup/bisectWhitelistDialog.helpers"

function makeExt(over: Partial<Extension>): Extension {
  return {
    id: "ext-1",
    name: "Ext 1",
    enabled: true,
    mayDisable: true,
    icon: "",
    description: "",
    version: "1.0.0",
    installType: "normal",
    type: "extension",
    ...over,
  } as Extension
}

describe("visibleExtensions", () => {
  it("normal: keeps extensions where mayDisable is true", () => {
    const exts = [makeExt({ id: "a" }), makeExt({ id: "b" })]
    expect(visibleExtensions(exts).map((e) => e.id)).toEqual(["a", "b"])
  })

  it("edge: hides extensions where mayDisable === false", () => {
    const exts = [makeExt({ id: "a" }), makeExt({ id: "b", mayDisable: false })]
    expect(visibleExtensions(exts).map((e) => e.id)).toEqual(["a"])
  })
})

describe("countCandidates", () => {
  it("normal: counts enabled non-whitelisted visible extensions", () => {
    const exts = [
      makeExt({ id: "a", enabled: true }),
      makeExt({ id: "b", enabled: true }),
      makeExt({ id: "c", enabled: true }),
    ]
    expect(countCandidates(exts, ["b"])).toBe(2)
  })

  it("edge: ignores disabled extensions", () => {
    const exts = [makeExt({ id: "a", enabled: true }), makeExt({ id: "b", enabled: false })]
    expect(countCandidates(exts, [])).toBe(1)
  })

  it("edge: ignores mayDisable=false extensions", () => {
    const exts = [
      makeExt({ id: "a", enabled: true }),
      makeExt({ id: "b", enabled: true, mayDisable: false }),
    ]
    expect(countCandidates(exts, [])).toBe(1)
  })

  it("edge: returns 0 when all enabled visible exts are whitelisted", () => {
    const exts = [makeExt({ id: "a", enabled: true }), makeExt({ id: "b", enabled: true })]
    expect(countCandidates(exts, ["a", "b"])).toBe(0)
  })
})

describe("toggleSelection", () => {
  it("normal: adds an id when missing", () => {
    expect(toggleSelection(["a"], "b")).toEqual(["a", "b"])
  })

  it("normal: removes an id when present", () => {
    expect(toggleSelection(["a", "b"], "a")).toEqual(["b"])
  })

  it("edge: returns a new array (does not mutate)", () => {
    const sel = ["a"]
    const next = toggleSelection(sel, "b")
    expect(next).not.toBe(sel)
    expect(sel).toEqual(["a"])
  })
})
