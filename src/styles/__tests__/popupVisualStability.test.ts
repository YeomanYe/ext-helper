import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const globalsCss = readFileSync(new URL("../globals.css", import.meta.url), "utf8")
const extensionListSource = readFileSync(
  new URL("../../components/extension/ExtensionList.tsx", import.meta.url),
  "utf8"
)
const ambientPulseClass = "animate-" + "pulse"
const popupOverlayPattern =
  /body::(?:before|after)\s*{[^}]*position:\s*fixed[^}]*z-index:\s*999[89][^}]*}/s

describe("popup visual stability CSS", () => {
  it("does not load remote fonts from extension popup CSS", () => {
    expect(globalsCss).not.toMatch(/@import\s+url\(["']?https?:/i)
  })

  it("does not render full-screen CRT overlays above the popup", () => {
    expect(globalsCss).not.toMatch(popupOverlayPattern)
  })

  it("does not keep continuous CRT keyframes in global CSS", () => {
    expect(globalsCss).not.toMatch(/@keyframes\s+(?:flicker|glitch-[12])/)
  })

  it("does not pulse extension loading skeletons", () => {
    expect(extensionListSource).not.toContain(ambientPulseClass)
  })
})
