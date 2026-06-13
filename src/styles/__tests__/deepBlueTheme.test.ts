import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const globalsCss = readFileSync(new URL("../globals.css", import.meta.url), "utf8")
const siteDiscoverySource = readFileSync(
  new URL("../../contents/site-discovery.ts", import.meta.url),
  "utf8"
)
const tailwindConfig = readFileSync(new URL("../../../tailwind.config.ts", import.meta.url), "utf8")

describe("deep blue dark theme", () => {
  it("uses the same navy base in the popup and content-script panel", () => {
    expect(globalsCss).toContain("--punk-bg: #06111f")
    expect(siteDiscoverySource).toContain("--eh-bg: #06111f")
  })

  it("does not keep the old purple accent tokens", () => {
    const oldPurpleTokens = /#(?:7c3aed|a78bfa)\b|neon-purple/i

    expect(globalsCss).not.toMatch(oldPurpleTokens)
    expect(siteDiscoverySource).not.toMatch(oldPurpleTokens)
    expect(tailwindConfig).not.toMatch(oldPurpleTokens)
  })
})
