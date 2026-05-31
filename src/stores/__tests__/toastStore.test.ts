import { describe, expect, it } from "vitest"

describe("toastStore", () => {
  it("normal: adds dismissible toast messages with defaults", async () => {
    const { createToastStore, DEFAULT_TOAST_DURATION_MS } = await import("../toastStore")
    const store = createToastStore()

    const id = store.getState().showToast({ message: "AI returned no matching extensions" })

    expect(store.getState().toasts).toEqual([
      {
        id,
        message: "AI returned no matching extensions",
        variant: "info",
        durationMs: DEFAULT_TOAST_DURATION_MS,
      },
    ])

    store.getState().dismissToast(id)
    expect(store.getState().toasts).toEqual([])
  })

  it("edge: keeps only the latest toast messages", async () => {
    const { createToastStore, MAX_TOAST_COUNT } = await import("../toastStore")
    const store = createToastStore()

    Array.from({ length: MAX_TOAST_COUNT + 2 }).forEach((_, index) => {
      store.getState().showToast({ message: `Toast ${index}` })
    })

    expect(store.getState().toasts).toHaveLength(MAX_TOAST_COUNT)
    expect(store.getState().toasts.map((toast) => toast.message)).toEqual([
      "Toast 2",
      "Toast 3",
      "Toast 4",
    ])
  })
})
