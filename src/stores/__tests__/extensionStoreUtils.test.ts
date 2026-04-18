import { describe, expect, it } from "vitest"
import { buildHistoryMeta } from "@/stores/extensionStoreUtils"
import type { Extension } from "@/types"

const makeSnapshot = (id: string): Extension[] => [
  {
    id,
    name: `Ext-${id}`,
    description: "",
    version: "1.0",
    enabled: true,
    iconUrl: null,
    permissions: [],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null,
  },
]

describe("buildHistoryMeta", () => {
  it("normal: returns correct meta for non-empty history and future", () => {
    const history = [makeSnapshot("a"), makeSnapshot("b")]
    const future = [makeSnapshot("c")]
    const meta = buildHistoryMeta(history, future)

    expect(meta.canUndo).toBe(true)
    expect(meta.canRedo).toBe(true)
    expect(meta.undoCount).toBe(2)
    expect(meta.redoCount).toBe(1)
    expect(meta.history).toHaveLength(2)
    expect(meta.future).toHaveLength(1)
  })

  it("normal: returns canUndo=false and canRedo=false for empty arrays", () => {
    const meta = buildHistoryMeta([], [])
    expect(meta.canUndo).toBe(false)
    expect(meta.canRedo).toBe(false)
    expect(meta.undoCount).toBe(0)
    expect(meta.redoCount).toBe(0)
  })

  it("normal: preserves future array unchanged while capping history", () => {
    const history = Array.from({ length: 5 }, (_, i) => makeSnapshot(String(i)))
    const future = [makeSnapshot("f1"), makeSnapshot("f2")]
    const meta = buildHistoryMeta(history, future)

    expect(meta.future).toHaveLength(2)
    expect(meta.history).toHaveLength(5)
  })

  it("edge: caps history at MAX_HISTORY (20) entries", () => {
    const history = Array.from({ length: 25 }, (_, i) => makeSnapshot(String(i)))
    const meta = buildHistoryMeta(history, [])

    expect(meta.history).toHaveLength(20)
    expect(meta.undoCount).toBe(20)
    expect(meta.canUndo).toBe(true)
  })

  it("edge: retains most recent entries when capping", () => {
    const history = Array.from({ length: 25 }, (_, i) => makeSnapshot(String(i)))
    const meta = buildHistoryMeta(history, [])

    // Should keep entries 5-24 (the last 20)
    expect(meta.history[0]).toEqual(history[5])
    expect(meta.history[19]).toEqual(history[24])
  })

  it("edge: history exactly at limit (20) is not truncated", () => {
    const history = Array.from({ length: 20 }, (_, i) => makeSnapshot(String(i)))
    const meta = buildHistoryMeta(history, [])

    expect(meta.history).toHaveLength(20)
  })

  it("abnormal: history with 0 entries returns canUndo=false", () => {
    const meta = buildHistoryMeta([], [makeSnapshot("x")])
    expect(meta.canUndo).toBe(false)
    expect(meta.undoCount).toBe(0)
  })
})
