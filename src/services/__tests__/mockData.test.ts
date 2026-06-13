import { afterEach, describe, expect, it, vi } from "vitest"
import { isDevMode } from "@/services/mockData"

function stubLocation(protocol: string, href: string) {
  vi.stubGlobal("window", {
    location: {
      protocol,
      href,
    },
  })
}

describe("isDevMode", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("normal: should use mock data for http web preview", () => {
    stubLocation("http:", "http://localhost:4173/")

    expect(isDevMode()).toBe(true)
  })

  it("normal: should use real extension APIs for Chrome extension pages", () => {
    stubLocation("chrome-extension:", "chrome-extension://extension-id/popup.html")

    expect(isDevMode()).toBe(false)
  })

  it("normal: should use real extension APIs for Firefox extension pages", () => {
    stubLocation("moz-extension:", "moz-extension://extension-id/popup.html")

    expect(isDevMode()).toBe(false)
  })
})
