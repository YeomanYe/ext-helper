import { beforeEach, describe, expect, it, vi } from "vitest"

type ExtensionInfoListener = (info: chrome.management.ExtensionInfo) => void

function createEvent<T>() {
  const listeners: T[] = []
  return {
    listeners,
    addListener: vi.fn((listener: T) => {
      listeners.push(listener)
    }),
    removeListener: vi.fn((listener: T) => {
      const index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    }),
  }
}

function createExtensionInfo(enabled: boolean): chrome.management.ExtensionInfo {
  return {
    id: "ext-1",
    name: "Test Extension",
    description: "Test description",
    version: "1.0.0",
    enabled,
    type: "extension",
    installType: "normal",
    permissions: [],
    hostPermissions: [],
  } as chrome.management.ExtensionInfo
}

describe("browserAdapter", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("normal: listens to Chrome management enabled and disabled events", async () => {
    const onEnabled = createEvent<ExtensionInfoListener>()
    const onDisabled = createEvent<ExtensionInfoListener>()
    vi.stubGlobal("browser", {
      management: { onEnabled, onDisabled },
    })

    const { browserAdapter } = await import("@/services/browser/adapter")
    const callback = vi.fn()
    const unsubscribe = browserAdapter.onExtensionEnabledChanged(callback)

    onEnabled.listeners[0](createExtensionInfo(false))
    onDisabled.listeners[0](createExtensionInfo(true))
    unsubscribe()

    expect(callback).toHaveBeenNthCalledWith(1, expect.objectContaining({ enabled: true }))
    expect(callback).toHaveBeenNthCalledWith(2, expect.objectContaining({ enabled: false }))
    expect(onEnabled.removeListener).toHaveBeenCalled()
    expect(onDisabled.removeListener).toHaveBeenCalled()
  })

  it("edge: supports a combined enabled-changed event when provided by a polyfill", async () => {
    const onEnabledChanged = createEvent<ExtensionInfoListener>()
    vi.stubGlobal("browser", {
      management: { onEnabledChanged },
    })

    const { browserAdapter } = await import("@/services/browser/adapter")
    const callback = vi.fn()
    const unsubscribe = browserAdapter.onExtensionEnabledChanged(callback)

    onEnabledChanged.listeners[0](createExtensionInfo(true))
    unsubscribe()

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    expect(onEnabledChanged.removeListener).toHaveBeenCalled()
  })

  it("edge: no-ops when management enabled events are unavailable", async () => {
    vi.stubGlobal("browser", {
      management: {},
    })

    const { browserAdapter } = await import("@/services/browser/adapter")

    expect(() => {
      const unsubscribe = browserAdapter.onExtensionEnabledChanged(vi.fn())
      unsubscribe()
    }).not.toThrow()
  })
})
