import type { SiteDiscoveryResult } from "@/services/siteDiscoveryService"

export const config = {
  matches: ["http://*/*", "https://*/*"],
}

type DiscoveryResponse =
  | { success: true; result: SiteDiscoveryResult }
  | { success: false; error: string }

const ROOT_ID = "ext-helper-site-discovery-root"
const EXTENSION_PREFERENCES_KEY = "ext-helper-preferences"
const THEME_QUERY = "(prefers-color-scheme: dark)"
const ICON_BRIDGE_REQUEST = "EXT_HELPER_ICON_TO_DATA_URL"
const ICON_BRIDGE_RESPONSE = "EXT_HELPER_ICON_DATA_URL"

type ExtensionTheme = "light" | "dark" | "system"

interface IconBridgeResponse {
  type?: string
  id?: number
  dataUrl?: string
  error?: string
}

interface IconBridge {
  iframe: HTMLIFrameElement
  resolveIcon: (iconUrl: string | null) => Promise<string | null>
}

function isExtensionTheme(value: unknown): value is ExtensionTheme {
  return value === "light" || value === "dark" || value === "system"
}

function resolveTheme(theme: ExtensionTheme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia(THEME_QUERY).matches ? "dark" : "light"
  }

  return theme
}

function readThemePreference(value: unknown): ExtensionTheme | null {
  if (!value || typeof value !== "object") return null
  const theme = (value as { theme?: unknown }).theme
  return isExtensionTheme(theme) ? theme : null
}

function applyHostTheme(host: HTMLElement, theme: ExtensionTheme): void {
  host.dataset.themePreference = theme
  host.dataset.theme = resolveTheme(theme)
}

function syncHostTheme(host: HTMLElement): void {
  const fallbackTheme: ExtensionTheme = "system"
  const storage = chrome.storage?.local

  if (!storage) {
    applyHostTheme(host, fallbackTheme)
    return
  }

  storage.get(EXTENSION_PREFERENCES_KEY, (result) => {
    const theme = readThemePreference(result?.[EXTENSION_PREFERENCES_KEY]) ?? fallbackTheme
    applyHostTheme(host, theme)
  })
}

function createStyles(): HTMLStyleElement {
  const style = document.createElement("style")
  style.textContent = `
    :host {
      all: initial;
      color-scheme: dark;
      --eh-primary: #7c3aed;
      --eh-primary-rgb: 124 58 237;
      --eh-secondary: #a78bfa;
      --eh-cta: #f43f5e;
      --eh-cta-rgb: 244 63 94;
      --eh-accent: #22d3ee;
      --eh-accent-rgb: 34 211 238;
      --eh-success: #10b981;
      --eh-success-rgb: 16 185 129;
      --eh-warning: #fbbf24;
      --eh-warning-rgb: 251 191 36;
      --eh-bg: #0f0f23;
      --eh-bg-rgb: 15 15 35;
      --eh-bg-alt: #1a1a2e;
      --eh-surface-soft: #11162b;
      --eh-surface-raised: #1a1a2e;
      --eh-surface-inset: #0b1020;
      --eh-border: #7c3aed;
      --eh-border-rgb: 124 58 237;
      --eh-text-primary: #e2e8f0;
      --eh-text-secondary: #94a3b8;
      --eh-text-muted: #78859b;
      --eh-shadow-hard: 8px 8px 0 rgb(0 0 0 / 0.45);
      --eh-shadow-panel:
        0 0 18px rgb(var(--eh-primary-rgb) / 0.28),
        0 12px 32px rgb(0 0 0 / 0.45);
      --eh-scanline: rgb(0 0 0 / 0.16);
      font-family: "Noto Sans SC", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    :host([data-theme="light"]) {
      color-scheme: light;
      --eh-primary: #111111;
      --eh-primary-rgb: 17 17 17;
      --eh-secondary: #2d2d2d;
      --eh-cta: #ff2a6d;
      --eh-cta-rgb: 255 42 109;
      --eh-accent: #00a86b;
      --eh-accent-rgb: 0 168 107;
      --eh-success: #008f5a;
      --eh-success-rgb: 0 143 90;
      --eh-warning: #d97706;
      --eh-warning-rgb: 217 119 6;
      --eh-bg: #f8f4e8;
      --eh-bg-rgb: 248 244 232;
      --eh-bg-alt: #fffdf5;
      --eh-surface-soft: #eee7d3;
      --eh-surface-raised: #fffdf5;
      --eh-surface-inset: #e4dcc7;
      --eh-border: #111111;
      --eh-border-rgb: 17 17 17;
      --eh-text-primary: #16120f;
      --eh-text-secondary: #403a33;
      --eh-text-muted: #71675c;
      --eh-shadow-hard: 5px 5px 0 rgb(17 17 17 / 0.2);
      --eh-shadow-panel:
        5px 5px 0 rgb(17 17 17 / 0.2),
        0 0 0 1px rgb(17 17 17 / 0.08),
        0 10px 20px rgb(17 17 17 / 0.08);
      --eh-scanline: rgb(17 17 17 / 0.035);
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    .eh-trigger {
      position: fixed;
      right: 20px;
      bottom: 22px;
      z-index: 2147483647;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      height: 42px;
      padding: 0 13px 0 11px;
      border: 2px solid var(--eh-border);
      border-radius: 0;
      background: var(--eh-primary);
      color: #ffffff;
      box-shadow:
        var(--eh-shadow-hard),
        0 0 14px rgb(var(--eh-primary-rgb) / 0.45);
      font: 800 11px/1 "Noto Sans SC", "JetBrains Mono", monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition:
        transform 140ms ease,
        box-shadow 140ms ease,
        background 140ms ease,
        border-color 140ms ease;
    }

    .eh-trigger::before {
      content: "$";
      display: inline-grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border: 1px solid rgb(255 255 255 / 0.45);
      color: var(--eh-accent);
      font: 900 13px/1 "JetBrains Mono", monospace;
    }

    .eh-trigger:hover {
      border-color: var(--eh-accent);
      background: var(--eh-secondary);
      box-shadow:
        10px 10px 0 rgb(0 0 0 / 0.42),
        0 0 20px rgb(var(--eh-accent-rgb) / 0.35);
      transform: translate(-1px, -1px);
    }

    :host([data-theme="light"]) .eh-trigger {
      background: var(--eh-primary);
      box-shadow:
        var(--eh-shadow-hard),
        inset -3px -3px 0 rgb(255 255 255 / 0.12);
    }

    :host([data-theme="light"]) .eh-trigger:hover {
      background: var(--eh-accent);
      color: var(--eh-primary);
      box-shadow:
        7px 7px 0 rgb(17 17 17 / 0.22),
        inset -3px -3px 0 rgb(255 253 245 / 0.3);
    }

    .eh-panel {
      position: fixed;
      right: 20px;
      bottom: 72px;
      z-index: 2147483647;
      width: min(420px, calc(100vw - 32px));
      max-height: min(640px, calc(100vh - 96px));
      overflow: hidden;
      border: 1px solid rgb(var(--eh-accent-rgb) / 0.46);
      border-radius: 0;
      background:
        repeating-linear-gradient(
          0deg,
          transparent 0,
          transparent 2px,
          var(--eh-scanline) 2px,
          var(--eh-scanline) 3px
        ),
        linear-gradient(180deg, var(--eh-surface-raised) 0%, var(--eh-bg) 100%);
      color: var(--eh-text-primary);
      box-shadow: var(--eh-shadow-panel);
    }

    .eh-panel::before,
    .eh-panel::after {
      content: "";
      position: absolute;
      width: 13px;
      height: 13px;
      pointer-events: none;
      z-index: 1;
    }

    .eh-panel::before {
      top: -1px;
      left: -1px;
      border-top: 2px solid var(--eh-accent);
      border-left: 2px solid var(--eh-accent);
    }

    .eh-panel::after {
      right: -1px;
      bottom: -1px;
      border-right: 2px solid var(--eh-accent);
      border-bottom: 2px solid var(--eh-accent);
    }

    .eh-hidden {
      display: none;
    }

    .eh-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 14px 11px;
      border-bottom: 1px solid rgb(var(--eh-accent-rgb) / 0.18);
      background:
        linear-gradient(90deg, rgb(var(--eh-accent-rgb) / 0.08), transparent 58%),
        var(--eh-surface-raised);
    }

    .eh-eyebrow {
      margin: 0 0 6px;
      color: var(--eh-accent);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .eh-title {
      margin: 0;
      color: var(--eh-text-primary);
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.02em;
      line-height: 1.15;
      text-transform: uppercase;
    }

    .eh-subtitle {
      margin: 6px 0 0;
      color: var(--eh-text-secondary);
      font-size: 12px;
      font-weight: 600;
      line-height: 1.35;
    }

    .eh-close {
      display: inline-grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border: 1px solid rgb(var(--eh-border-rgb) / 0.42);
      border-radius: 0;
      background: var(--eh-surface-soft);
      color: var(--eh-text-secondary);
      cursor: pointer;
      font: 900 16px/1 "JetBrains Mono", monospace;
      transition:
        color 140ms ease,
        border-color 140ms ease,
        background 140ms ease;
    }

    .eh-close:hover {
      border-color: var(--eh-cta);
      background: rgb(var(--eh-cta-rgb) / 0.12);
      color: var(--eh-cta);
    }

    .eh-body {
      max-height: 478px;
      overflow: auto;
      padding: 14px 14px 16px;
    }

    .eh-state {
      padding: 16px;
      border: 1px dashed rgb(var(--eh-accent-rgb) / 0.36);
      border-radius: 0;
      background: rgb(var(--eh-accent-rgb) / 0.06);
      color: var(--eh-text-secondary);
      font-size: 13px;
      font-weight: 650;
      line-height: 1.45;
    }

    .eh-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .eh-stat {
      min-width: 0;
      border: 1px solid rgb(var(--eh-border-rgb) / 0.28);
      border-radius: 0;
      background: rgb(var(--eh-bg-rgb) / 0.42);
      padding: 9px 10px;
    }

    .eh-stat strong {
      display: block;
      color: var(--eh-text-primary);
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.02em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .eh-stat span {
      display: block;
      margin-top: 3px;
      color: var(--eh-text-muted);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .eh-list {
      display: grid;
      gap: 10px;
    }

    .eh-card {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      gap: 11px;
      border: 1px solid rgb(var(--eh-border-rgb) / 0.28);
      border-radius: 0;
      background: var(--eh-surface-raised);
      padding: 11px;
      transition:
        border-color 140ms ease,
        box-shadow 140ms ease,
        transform 140ms ease;
    }

    .eh-card:hover {
      border-color: rgb(var(--eh-accent-rgb) / 0.64);
      box-shadow: 0 0 16px rgb(var(--eh-accent-rgb) / 0.12);
      transform: translateY(-1px);
    }

    .eh-icon {
      display: inline-grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border: 1px solid rgb(var(--eh-border-rgb) / 0.28);
      border-radius: 0;
      background: var(--eh-surface-soft);
      color: var(--eh-accent);
      font: 900 13px/1 "JetBrains Mono", monospace;
      letter-spacing: 0.04em;
      overflow: hidden;
      text-transform: uppercase;
    }

    .eh-icon img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .eh-icon-fallback {
      display: inline-grid;
      place-items: center;
      width: 100%;
      height: 100%;
      background:
        linear-gradient(135deg, rgb(var(--eh-accent-rgb) / 0.16), transparent 62%),
        var(--eh-surface-soft);
    }

    .eh-card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin: 0;
      color: var(--eh-text-primary);
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.04em;
      line-height: 1.25;
      text-transform: uppercase;
    }

    .eh-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .eh-pill {
      flex: 0 0 auto;
      border: 1px solid rgb(var(--eh-success-rgb) / 0.5);
      border-radius: 0;
      padding: 4px 7px;
      background: rgb(var(--eh-success-rgb) / 0.1);
      color: var(--eh-success);
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .eh-pill.medium {
      border-color: rgb(var(--eh-warning-rgb) / 0.5);
      background: rgb(var(--eh-warning-rgb) / 0.1);
      color: var(--eh-warning);
    }

    .eh-pill.low {
      border-color: rgb(var(--eh-border-rgb) / 0.3);
      background: rgb(var(--eh-border-rgb) / 0.08);
      color: var(--eh-text-muted);
    }

    .eh-description {
      margin: 6px 0 0;
      color: var(--eh-text-secondary);
      font-size: 12px;
      font-weight: 600;
      line-height: 1.35;
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .eh-reason {
      margin: 7px 0 0;
      color: var(--eh-text-muted);
      font-size: 10px;
      font-weight: 750;
      letter-spacing: 0.06em;
      line-height: 1.35;
      text-transform: uppercase;
    }

    .eh-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .eh-chip {
      border: 1px solid rgb(var(--eh-border-rgb) / 0.22);
      border-radius: 0;
      background: rgb(var(--eh-bg-rgb) / 0.36);
      color: var(--eh-text-secondary);
      padding: 4px 7px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .eh-footer {
      border-top: 1px solid rgb(var(--eh-accent-rgb) / 0.16);
      padding: 12px 14px;
      background: rgb(var(--eh-bg-rgb) / 0.34);
    }

    .eh-query {
      margin: 0 0 8px;
      color: var(--eh-text-muted);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .eh-query-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .eh-icon-bridge {
      display: none;
    }

    .eh-body::-webkit-scrollbar {
      width: 6px;
    }

    .eh-body::-webkit-scrollbar-track {
      background: var(--eh-surface-inset);
    }

    .eh-body::-webkit-scrollbar-thumb {
      background: var(--eh-primary);
      box-shadow: 0 0 10px rgb(var(--eh-primary-rgb) / 0.45);
    }

    @media (prefers-reduced-motion: reduce) {
      .eh-trigger,
      .eh-card,
      .eh-close {
        transition: none;
      }
    }
  `
  return style
}

function getInitials(name: string): string {
  const words = name
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) return "EX"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function canUseImageUrl(url: string | null): url is string {
  if (!url) return false
  return (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  )
}

function createFallbackIcon(name: string): HTMLSpanElement {
  const fallback = document.createElement("span")
  fallback.className = "eh-icon-fallback"
  fallback.textContent = getInitials(name)
  return fallback
}

function createIconImage(url: string, onError: () => void): HTMLImageElement {
  const img = document.createElement("img")
  img.alt = ""
  img.src = url
  img.addEventListener("error", onError)
  return img
}

function createIconBridge(): IconBridge {
  const iframe = document.createElement("iframe")
  iframe.className = "eh-icon-bridge"
  iframe.src = chrome.runtime.getURL("resources/icon-bridge.html")

  const bridgeOrigin = new URL(iframe.src).origin
  const pending = new Map<number, (dataUrl: string | null) => void>()
  let nextId = 0
  const loaded = new Promise<void>((resolve) => {
    iframe.addEventListener("load", () => resolve(), { once: true })
    window.setTimeout(resolve, 1200)
  })

  window.addEventListener("message", (event) => {
    if (event.source !== iframe.contentWindow) return
    if (event.origin !== bridgeOrigin) return

    const message = event.data as IconBridgeResponse
    if (message.type !== ICON_BRIDGE_RESPONSE || typeof message.id !== "number") return

    const resolve = pending.get(message.id)
    if (!resolve) return

    pending.delete(message.id)
    resolve(message.dataUrl ?? null)
  })

  return {
    iframe,
    resolveIcon: async (iconUrl) => {
      if (!iconUrl || !iframe.contentWindow) return null
      await loaded

      return await new Promise((resolve) => {
        const id = nextId++
        pending.set(id, resolve)
        iframe.contentWindow?.postMessage(
          {
            type: ICON_BRIDGE_REQUEST,
            id,
            iconUrl,
          },
          bridgeOrigin
        )
        window.setTimeout(() => {
          if (!pending.has(id)) return
          pending.delete(id)
          resolve(null)
        }, 1800)
      })
    },
  }
}

function createIcon(name: string, url: string | null, iconBridge: IconBridge): HTMLElement {
  const icon = document.createElement("span")
  icon.className = "eh-icon"
  icon.title = name
  icon.append(createFallbackIcon(name))

  if (canUseImageUrl(url)) {
    icon.replaceChildren(createIconImage(url, () => icon.replaceChildren(createFallbackIcon(name))))
    return icon
  }

  void iconBridge.resolveIcon(url).then((dataUrl) => {
    if (!dataUrl) return
    icon.replaceChildren(
      createIconImage(dataUrl, () => icon.replaceChildren(createFallbackIcon(name)))
    )
  })

  return icon
}

function renderResult(
  body: HTMLElement,
  footer: HTMLElement,
  result: SiteDiscoveryResult,
  iconBridge: IconBridge
): void {
  body.replaceChildren()
  footer.replaceChildren()

  const summary = document.createElement("div")
  summary.className = "eh-summary"
  summary.innerHTML = `
    <div class="eh-stat"><strong>${result.domain}</strong><span>site</span></div>
    <div class="eh-stat"><strong>${result.matches.length}</strong><span>matches</span></div>
    <div class="eh-stat"><strong>${result.totalExtensions}</strong><span>installed</span></div>
  `
  body.append(summary)

  if (result.matches.length === 0) {
    const empty = document.createElement("div")
    empty.className = "eh-state"
    empty.textContent =
      "No installed extensions look specific to this site yet. Try Explore More below."
    body.append(empty)
  } else {
    const list = document.createElement("div")
    list.className = "eh-list"
    for (const match of result.matches) {
      const card = document.createElement("article")
      card.className = "eh-card"

      const content = document.createElement("div")
      const permissionText =
        match.permissionSignals.length > 0
          ? match.permissionSignals.slice(0, 2).join(" / ")
          : "metadata"
      content.innerHTML = `
        <h3 class="eh-card-title">
          <span class="eh-name"></span>
          <span class="eh-pill ${match.confidence}">${match.confidence}</span>
        </h3>
        <p class="eh-description"></p>
        <p class="eh-reason"></p>
        <div class="eh-meta">
          <span class="eh-chip">${match.extension.enabled ? "Enabled" : "Disabled"}</span>
          <span class="eh-chip">v${match.extension.version}</span>
          <span class="eh-chip"></span>
        </div>
      `
      content.querySelector(".eh-name")!.textContent = match.extension.name
      content.querySelector(".eh-description")!.textContent =
        match.extension.description || "No description provided by this extension."
      content.querySelector(".eh-reason")!.textContent =
        match.reasons[0] ?? "Looks useful for this page."
      content.querySelector(".eh-meta .eh-chip:last-child")!.textContent = permissionText

      card.append(createIcon(match.extension.name, match.extension.iconUrl, iconBridge), content)
      list.append(card)
    }
    body.append(list)
  }

  const queryTitle = document.createElement("p")
  queryTitle.className = "eh-query"
  queryTitle.textContent = "Explore more"
  const queryList = document.createElement("div")
  queryList.className = "eh-query-list"
  result.exploreQueries.forEach((query) => {
    const chip = document.createElement("span")
    chip.className = "eh-chip"
    chip.textContent = query
    queryList.append(chip)
  })

  footer.append(queryTitle, queryList)
}

function renderState(body: HTMLElement, message: string): void {
  body.replaceChildren()
  const state = document.createElement("div")
  state.className = "eh-state"
  state.textContent = message
  body.append(state)
}

function getMetaDescription(): string {
  const selectors = [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
  ]

  for (const selector of selectors) {
    const content = document.querySelector<HTMLMetaElement>(selector)?.content?.trim()
    if (content) return content
  }

  return ""
}

async function requestDiscovery(): Promise<DiscoveryResponse> {
  return await chrome.runtime.sendMessage({
    type: "DISCOVER_INSTALLED_EXTENSIONS_FOR_SITE",
    url: location.href,
    pageTitle: document.title,
    pageDescription: getMetaDescription(),
  })
}

function mount(): void {
  if (document.getElementById(ROOT_ID)) return

  const host = document.createElement("div")
  host.id = ROOT_ID
  syncHostTheme(host)

  const mediaQuery = window.matchMedia(THEME_QUERY)
  const handleSystemThemeChange = () => {
    if (host.dataset.themePreference === "system") {
      host.dataset.theme = resolveTheme("system")
    }
  }
  mediaQuery.addEventListener("change", handleSystemThemeChange)
  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local") return
    if (!changes[EXTENSION_PREFERENCES_KEY]) return
    const theme = readThemePreference(changes[EXTENSION_PREFERENCES_KEY].newValue) ?? "system"
    applyHostTheme(host, theme)
  })

  const shadow = host.attachShadow({ mode: "open" })
  const iconBridge = createIconBridge()

  const trigger = document.createElement("button")
  trigger.className = "eh-trigger"
  trigger.type = "button"
  trigger.textContent = "Ext Helper"

  const panel = document.createElement("section")
  panel.className = "eh-panel eh-hidden"
  panel.innerHTML = `
    <header class="eh-header">
      <div>
        <p class="eh-eyebrow">Current site discovery</p>
        <h2 class="eh-title">Installed extensions for this site</h2>
        <p class="eh-subtitle">Metadata match / local inventory</p>
      </div>
      <button class="eh-close" type="button" aria-label="Close">&times;</button>
    </header>
    <div class="eh-body"></div>
    <footer class="eh-footer"></footer>
  `

  const body = panel.querySelector<HTMLElement>(".eh-body")!
  const footer = panel.querySelector<HTMLElement>(".eh-footer")!
  const close = panel.querySelector<HTMLButtonElement>(".eh-close")!

  trigger.addEventListener("click", async () => {
    panel.classList.toggle("eh-hidden")
    if (panel.classList.contains("eh-hidden")) return
    renderState(body, "Scanning installed extensions for this site...")
    footer.replaceChildren()
    const response = await requestDiscovery().catch((error) => ({
      success: false as const,
      error: error instanceof Error ? error.message : "Discovery failed.",
    }))
    if (response.success) {
      renderResult(body, footer, response.result, iconBridge)
    } else {
      renderState(body, response.error)
    }
  })

  close.addEventListener("click", () => panel.classList.add("eh-hidden"))

  shadow.append(createStyles(), iconBridge.iframe, trigger, panel)
  document.documentElement.append(host)
}

mount()
