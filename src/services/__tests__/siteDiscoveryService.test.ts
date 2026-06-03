import { describe, expect, it } from "vitest"
import type { Extension } from "@/types"
import { discoverInstalledExtensionsForSite } from "@/services/siteDiscoveryService"

const createExtension = (overrides: Partial<Extension>): Extension => ({
  id: overrides.id ?? "id",
  name: overrides.name ?? "Extension",
  description: overrides.description ?? "",
  version: overrides.version ?? "1.0.0",
  versionName: overrides.versionName ?? null,
  enabled: overrides.enabled ?? true,
  iconUrl: overrides.iconUrl ?? null,
  type: overrides.type ?? "extension",
  permissions: overrides.permissions ?? [],
  hostPermissions: overrides.hostPermissions ?? [],
  installType: overrides.installType ?? "normal",
  mayEnable: overrides.mayEnable ?? true,
  mayDisable: overrides.mayDisable ?? true,
  disabledReason: overrides.disabledReason ?? null,
  offlineEnabled: overrides.offlineEnabled ?? false,
  optionsUrl: overrides.optionsUrl ?? null,
  homepageUrl: overrides.homepageUrl ?? null,
  updateUrl: overrides.updateUrl ?? null,
})

describe("discoverInstalledExtensionsForSite", () => {
  it("ranks direct host permissions above broad metadata matches for the current site", () => {
    const result = discoverInstalledExtensionsForSite({
      url: "https://www.notion.so/acme/engineering-wiki",
      pageTitle: "Engineering wiki - Notion",
      pageDescription: "A workspace for notes, documents, and team knowledge",
      extensions: [
        createExtension({
          id: "generic",
          name: "Workspace Notes",
          description: "Adds better notes and workspace tools on every website",
          hostPermissions: ["<all_urls>"],
        }),
        createExtension({
          id: "site-helper",
          name: "Notion Boost",
          description: "Improve document navigation",
          hostPermissions: ["https://www.notion.so/*"],
        }),
      ],
    })

    expect(result.domain).toBe("notion.so")
    expect(result.pageType).toBe("Current site")
    expect(result.matches.map((match) => match.extension.id)).toEqual(["site-helper", "generic"])
    expect(result.matches[0].confidence).toBe("high")
  })

  it("does not recommend unrelated extensions without host or keyword signals", () => {
    const result = discoverInstalledExtensionsForSite({
      url: "https://linear.app/acme/issue/ENG-123",
      pageTitle: "Fix checkout bug - Linear",
      extensions: [
        createExtension({
          id: "calendar-helper",
          name: "Calendar Helper",
          description: "Calendar scheduling and meeting templates",
          hostPermissions: ["https://calendar.google.com/*"],
        }),
      ],
    })

    expect(result.matches).toEqual([])
    expect(result.pageType).toBe("Current site")
    expect(result.exploreQueries.length).toBeGreaterThan(0)
  })

  it("does not show broad all-sites extensions unless page metadata also matches", () => {
    const result = discoverInstalledExtensionsForSite({
      url: "https://figma.com/file/abc",
      pageTitle: "Design system - Figma",
      extensions: [
        createExtension({
          id: "broad-unrelated",
          name: "Generic Clipper",
          description: "Clip any page",
          hostPermissions: ["<all_urls>"],
        }),
        createExtension({
          id: "broad-related",
          name: "Figma Design Helper",
          description: "Design system inspection tools",
          hostPermissions: ["<all_urls>"],
        }),
      ],
    })

    expect(result.matches.map((match) => match.extension.id)).toEqual(["broad-related"])
  })
})
