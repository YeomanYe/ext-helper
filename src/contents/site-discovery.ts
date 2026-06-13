import type { SiteDiscoveryResult } from "@/services/siteDiscoveryService"
import type { SiteRecommendationResult } from "@/services/siteRecommendationService"
import { getRecommendationQuotaPointsText } from "@/services/siteRecommendationQuota"
import type { SiteAuthProvider } from "@/services/siteAuthService"
import type {
  InstalledExtensionRecommendationContext,
  SiteAuthStatus,
} from "@/services/siteDiscoveryPanelService"

export const config = {
  matches: ["http://*/*", "https://*/*"],
}

type DiscoveryResponse =
  | {
      success: true
      result: SiteDiscoveryResult
      auth?: SiteAuthStatus
    }
  | { success: false; error: string }

type RecommendationResponse =
  | {
      success: true
      recommendations: SiteRecommendationResult
    }
  | { success: false; error: string }

type AuthResponse = { success: true; auth: SiteAuthStatus } | { success: false; error: string }

const ROOT_ID = "ext-helper-site-discovery-root"
const EXTENSION_PREFERENCES_KEY = "ext-helper-preferences"
const THEME_QUERY = "(prefers-color-scheme: dark)"
const ICON_BRIDGE_REQUEST = "EXT_HELPER_ICON_TO_DATA_URL"
const ICON_BRIDGE_RESPONSE = "EXT_HELPER_ICON_DATA_URL"
const EDGE_SNAP_DISTANCE = 28
const EDGE_GAP = 12
const COLLAPSED_VISIBLE_WIDTH = 6
const DRAG_THRESHOLD = 5
const DOCK_SLIDE_MS = 190
const COLLAPSE_LOCK_MS = 360

type ExtensionTheme = "light" | "dark" | "system"
type DockEdge = "left" | "right" | null

interface TriggerPosition {
  x: number
  y: number
  edge: DockEdge
  collapsed: boolean
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  moved: boolean
}

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
      --eh-primary: #2563eb;
      --eh-primary-rgb: 37 99 235;
      --eh-secondary: #60a5fa;
      --eh-cta: #fb7185;
      --eh-cta-rgb: 251 113 133;
      --eh-accent: #38bdf8;
      --eh-accent-rgb: 56 189 248;
      --eh-success: #10b981;
      --eh-success-rgb: 16 185 129;
      --eh-warning: #fbbf24;
      --eh-warning-rgb: 251 191 36;
      --eh-bg: #06111f;
      --eh-bg-rgb: 6 17 31;
      --eh-bg-alt: #0b1b33;
      --eh-surface-soft: #0e223d;
      --eh-surface-soft-rgb: 14 34 61;
      --eh-surface-raised: #102844;
      --eh-surface-inset: #030a14;
      --eh-border: #3b82f6;
      --eh-border-rgb: 59 130 246;
      --eh-text-primary: #e6f3ff;
      --eh-text-secondary: #a7bdd5;
      --eh-text-muted: #7188a3;
      --eh-shadow-hard: 8px 8px 0 rgb(0 0 0 / 0.45);
      --eh-shadow-panel:
        0 0 18px rgb(var(--eh-accent-rgb) / 0.2),
        0 12px 32px rgb(0 0 0 / 0.45);
      --eh-scanline: rgb(103 232 249 / 0.045);
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
      --eh-surface-soft-rgb: 238 231 211;
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
      left: var(--eh-trigger-x, calc(100vw - 154px));
      top: var(--eh-trigger-y, calc(100vh - 64px));
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
      white-space: nowrap;
      cursor: grab;
      touch-action: none;
      user-select: none;
      transition:
        clip-path 160ms ease,
        left 160ms ease,
        box-shadow 140ms ease,
        background 140ms ease,
        border-color 140ms ease,
        transform 160ms ease;
    }

    .eh-trigger::before {
      content: "$";
      display: inline-grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border: 1px solid rgb(255 255 255 / 0.45);
      color: currentColor;
      font: 900 13px/1 "JetBrains Mono", monospace;
    }

    .eh-trigger::after {
      content: "";
      position: absolute;
      inset: -8px;
    }

    .eh-trigger:hover {
      border-color: var(--eh-border);
      background: var(--eh-primary);
      box-shadow:
        var(--eh-shadow-hard),
        0 0 14px rgb(var(--eh-primary-rgb) / 0.45);
      transform: translate(-1px, -1px);
    }

    .eh-trigger:active,
    .eh-trigger.is-dragging {
      cursor: grabbing;
    }

    .eh-trigger.is-dragging {
      transition: none;
      border-color: var(--eh-border);
      background: var(--eh-primary);
      color: #ffffff;
      box-shadow:
        var(--eh-shadow-hard),
        0 0 14px rgb(var(--eh-primary-rgb) / 0.45);
      transform: scale(1.02);
    }

    .eh-trigger.is-collapsing:not(.is-collapsed),
    .eh-trigger.is-collapsing:not(.is-collapsed):hover {
      border-color: var(--eh-border);
      background: var(--eh-primary);
      color: #ffffff;
      box-shadow:
        var(--eh-shadow-hard),
        0 0 14px rgb(var(--eh-primary-rgb) / 0.45);
      transform: translateX(0);
    }

    .eh-trigger.is-collapsed {
      min-width: 112px;
      color: transparent;
      overflow: hidden;
      text-shadow: none;
    }

    .eh-trigger.is-collapsed[data-edge="left"] {
      background: var(--eh-primary);
      clip-path: inset(0 0 0 calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px));
      transform: translateX(calc(-100% + ${COLLAPSED_VISIBLE_WIDTH}px));
      box-shadow:
        3px 0 0 rgb(0 0 0 / 0.32),
        0 0 14px rgb(var(--eh-primary-rgb) / 0.36);
      animation: eh-collapse-left 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .eh-trigger.is-collapsed[data-edge="right"] {
      background: var(--eh-primary);
      clip-path: inset(0 calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px) 0 0);
      transform: translateX(calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px));
      box-shadow:
        -3px 0 0 rgb(0 0 0 / 0.32),
        0 0 14px rgb(var(--eh-primary-rgb) / 0.36);
      animation: eh-collapse-right 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .eh-trigger.is-collapsed::before {
      opacity: 0;
    }

    .eh-trigger.is-collapsed:hover,
    .eh-trigger.is-collapsed:focus-visible,
    .eh-trigger.is-open {
      background: var(--eh-primary);
      border-color: var(--eh-border);
      clip-path: inset(0);
      transform: translateX(0);
      color: #ffffff;
    }

    .eh-trigger.is-collapsed:hover::before,
    .eh-trigger.is-collapsed:focus-visible::before,
    .eh-trigger.is-open::before {
      opacity: 1;
    }

    .eh-trigger.is-collapsing.is-collapsed[data-edge="left"]:hover,
    .eh-trigger.is-collapsing.is-collapsed[data-edge="left"]:focus-visible {
      background: var(--eh-primary);
      clip-path: inset(0 0 0 calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px));
      transform: translateX(calc(-100% + ${COLLAPSED_VISIBLE_WIDTH}px));
      color: transparent;
    }

    .eh-trigger.is-collapsing.is-collapsed[data-edge="right"]:hover,
    .eh-trigger.is-collapsing.is-collapsed[data-edge="right"]:focus-visible {
      background: var(--eh-primary);
      clip-path: inset(0 calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px) 0 0);
      transform: translateX(calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px));
      color: transparent;
    }

    .eh-trigger.is-collapsing.is-collapsed:hover::before,
    .eh-trigger.is-collapsing.is-collapsed:focus-visible::before {
      opacity: 0;
    }

    :host([data-theme="light"]) .eh-trigger {
      background: var(--eh-surface-raised);
      color: var(--eh-text-primary);
      border-color: var(--eh-primary);
      box-shadow:
        var(--eh-shadow-hard),
        inset -3px -3px 0 rgb(17 17 17 / 0.05);
    }

    :host([data-theme="light"]) .eh-trigger::before {
      border-color: rgb(17 17 17 / 0.34);
    }

    :host([data-theme="light"]) .eh-trigger:hover {
      background: var(--eh-surface-raised);
      color: var(--eh-text-primary);
      box-shadow:
        var(--eh-shadow-hard),
        inset -3px -3px 0 rgb(17 17 17 / 0.05);
    }

    :host([data-theme="light"]) .eh-trigger.is-dragging,
    :host([data-theme="light"]) .eh-trigger.is-dragging:hover,
    :host([data-theme="light"]) .eh-trigger.is-collapsing:not(.is-collapsed),
    :host([data-theme="light"]) .eh-trigger.is-collapsing:not(.is-collapsed):hover {
      border-color: var(--eh-primary);
      background: var(--eh-surface-raised);
      color: var(--eh-text-primary);
      box-shadow:
        var(--eh-shadow-hard),
        inset -3px -3px 0 rgb(17 17 17 / 0.05);
    }

    :host([data-theme="light"]) .eh-trigger.is-collapsed {
      color: transparent;
      box-shadow:
        3px 0 0 rgb(17 17 17 / 0.22),
        0 0 0 1px rgb(17 17 17 / 0.08);
    }

    :host([data-theme="light"]) .eh-trigger.is-collapsed[data-edge="left"] {
      background: var(--eh-surface-raised);
    }

    :host([data-theme="light"]) .eh-trigger.is-collapsed[data-edge="right"] {
      background: var(--eh-surface-raised);
    }

    :host([data-theme="light"]) .eh-trigger.is-collapsed:hover,
    :host([data-theme="light"]) .eh-trigger.is-collapsed:focus-visible,
    :host([data-theme="light"]) .eh-trigger.is-open {
      background: var(--eh-surface-raised);
      border-color: var(--eh-primary);
      color: var(--eh-text-primary);
    }

    :host([data-theme="light"]) .eh-trigger.is-collapsing.is-collapsed:hover,
    :host([data-theme="light"]) .eh-trigger.is-collapsing.is-collapsed:focus-visible {
      background: var(--eh-surface-raised);
      color: transparent;
    }

    :host([data-theme="light"]) .eh-trigger.is-collapsing.is-collapsed[data-edge="right"]:hover,
    :host([data-theme="light"]) .eh-trigger.is-collapsing.is-collapsed[data-edge="right"]:focus-visible {
      background: var(--eh-surface-raised);
    }

    @keyframes eh-collapse-left {
      from {
        clip-path: inset(0);
        transform: translateX(0);
      }
      to {
        clip-path: inset(0 0 0 calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px));
        transform: translateX(calc(-100% + ${COLLAPSED_VISIBLE_WIDTH}px));
      }
    }

    @keyframes eh-collapse-right {
      from {
        clip-path: inset(0);
        transform: translateX(0);
      }
      to {
        clip-path: inset(0 calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px) 0 0);
        transform: translateX(calc(100% - ${COLLAPSED_VISIBLE_WIDTH}px));
      }
    }

    .eh-panel {
      position: fixed;
      left: var(--eh-panel-x, calc(100vw - 440px));
      top: var(--eh-panel-y, calc(100vh - 560px));
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      width: min(420px, calc(100vw - 32px));
      height: min(660px, calc(100vh - 32px));
      overflow: hidden;
      border: 1px solid rgb(var(--eh-accent-rgb) / 0.46);
      border-radius: 0;
      background:
        radial-gradient(circle at 8% 0%, rgb(var(--eh-primary-rgb) / 0.16), transparent 38%),
        radial-gradient(circle at 100% 18%, rgb(var(--eh-accent-rgb) / 0.1), transparent 34%),
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

    :host([data-theme="light"]) .eh-panel {
      border: 2px solid var(--eh-primary);
      box-shadow:
        var(--eh-shadow-panel),
        inset 4px 0 0 rgb(var(--eh-accent-rgb) / 0.75);
    }

    :host([data-theme="light"]) .eh-panel::before {
      border-top-color: var(--eh-primary);
      border-left-color: var(--eh-primary);
    }

    :host([data-theme="light"]) .eh-panel::after {
      border-right-color: var(--eh-primary);
      border-bottom-color: var(--eh-primary);
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

    :host([data-theme="light"]) .eh-header {
      border-bottom-color: rgb(var(--eh-border-rgb) / 0.4);
      background:
        linear-gradient(90deg, rgb(var(--eh-accent-rgb) / 0.1), transparent 58%),
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
      flex: 1 1 auto;
      min-height: 0;
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

    .eh-loading {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .eh-loading::before {
      content: "";
      width: 13px;
      height: 13px;
      border: 2px solid rgb(var(--eh-accent-rgb) / 0.24);
      border-top-color: var(--eh-accent);
      animation: eh-spin 720ms linear infinite;
    }

    @keyframes eh-spin {
      to {
        transform: rotate(360deg);
      }
    }

    .eh-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
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
      gap: 8px;
    }

    .eh-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid rgb(var(--eh-border-rgb) / 0.3);
      background: transparent;
      margin-top: 14px;
      padding: 8px 10px 0;
    }

    .eh-tab {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
      border: 0;
      border-bottom: 2px solid transparent;
      border-radius: 0;
      background: transparent;
      color: var(--eh-text-muted);
      cursor: pointer;
      font: 900 13px/1 "Noto Sans SC", "JetBrains Mono", monospace;
      letter-spacing: 0.08em;
      padding: 0 10px 9px;
      text-align: left;
      text-transform: uppercase;
      transition:
        border-color 140ms ease,
        color 140ms ease;
    }

    .eh-tab:hover {
      color: var(--eh-text-primary);
    }

    .eh-tab[aria-selected="true"] {
      border-bottom-color: var(--eh-accent);
      color: var(--eh-accent);
    }

    .eh-tab-count {
      display: inline-grid;
      min-width: 18px;
      height: 18px;
      place-items: center;
      border: 1px solid rgb(var(--eh-border-rgb) / 0.28);
      background: rgb(var(--eh-surface-soft-rgb) / 0.72);
      color: inherit;
      font: 900 10px/1 "JetBrains Mono", monospace;
      padding: 0 4px;
    }

    .eh-tab-panel[hidden] {
      display: none;
    }

    .eh-section {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }

    .eh-section:first-child {
      margin-top: 0;
    }

    .eh-section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin: 0;
      color: var(--eh-text-primary);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .eh-card {
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 10px;
      border: 1px solid rgb(var(--eh-border-rgb) / 0.28);
      border-radius: 0;
      background: var(--eh-surface-raised);
      color: inherit;
      min-height: 86px;
      padding: 8px;
      text-decoration: none;
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
      width: 38px;
      height: 38px;
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
      margin: 5px 0 0;
      color: var(--eh-text-secondary);
      font-size: 12px;
      font-weight: 600;
      line-height: 1.35;
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
    }

    .eh-reason {
      margin: 5px 0 0;
      color: var(--eh-text-muted);
      font-size: 10px;
      font-weight: 750;
      letter-spacing: 0.06em;
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .eh-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
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
      flex: 0 0 auto;
      border-top: 1px solid rgb(var(--eh-accent-rgb) / 0.16);
      padding: 12px 14px;
      background: rgb(var(--eh-bg-rgb) / 0.34);
    }

    :host([data-theme="light"]) .eh-footer {
      border-top-color: rgb(var(--eh-border-rgb) / 0.28);
      background: rgb(var(--eh-bg-rgb) / 0.58);
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
      flex-wrap: nowrap;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .eh-query-list .eh-chip {
      flex: 0 0 auto;
    }

    .eh-footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 12px;
    }

    .eh-auth-copy {
      min-width: 0;
      color: var(--eh-text-muted);
      font-size: 10px;
      font-weight: 750;
      letter-spacing: 0.06em;
      line-height: 1.35;
      text-transform: uppercase;
    }

    .eh-actions {
      display: inline-flex;
      flex: 0 0 auto;
      gap: 6px;
    }

    .eh-action {
      border: 1px solid rgb(var(--eh-border-rgb) / 0.42);
      border-radius: 0;
      background: var(--eh-surface-raised);
      color: var(--eh-text-primary);
      cursor: pointer;
      font: 900 10px/1 "Noto Sans SC", "JetBrains Mono", monospace;
      letter-spacing: 0.08em;
      padding: 7px 9px;
      text-transform: uppercase;
    }

    .eh-action:hover {
      border-color: var(--eh-primary);
      background: var(--eh-surface-soft);
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

      .eh-trigger.is-collapsed {
        animation: none;
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

function createSectionTitle(title: string, chipText?: string): HTMLElement {
  const heading = document.createElement("h3")
  heading.className = "eh-section-title"
  const label = document.createElement("span")
  label.textContent = title
  heading.append(label)

  if (chipText) {
    const chip = document.createElement("span")
    chip.className = "eh-chip"
    chip.textContent = chipText
    heading.append(chip)
  }

  return heading
}

function createTabButton({
  id,
  panelId,
  label,
  selected,
}: {
  id: string
  panelId: string
  label: string
  selected: boolean
}): HTMLButtonElement {
  const button = document.createElement("button")
  button.id = id
  button.className = "eh-tab"
  button.type = "button"
  button.role = "tab"
  button.setAttribute("aria-controls", panelId)
  button.setAttribute("aria-selected", String(selected))
  button.innerHTML = `
    <span></span>
    <span class="eh-tab-count"></span>
  `
  button.querySelector("span")!.textContent = label
  return button
}

function createTabPanel({
  id,
  labelledBy,
  selected,
}: {
  id: string
  labelledBy: string
  selected: boolean
}): HTMLElement {
  const panel = document.createElement("section")
  panel.id = id
  panel.className = "eh-section eh-tab-panel"
  panel.role = "tabpanel"
  panel.setAttribute("aria-labelledby", labelledBy)
  panel.hidden = !selected
  return panel
}

function wireTabs(tabs: HTMLButtonElement[], panels: HTMLElement[]): void {
  const selectTab = (activeIndex: number) => {
    tabs.forEach((tab, index) => {
      tab.setAttribute("aria-selected", String(index === activeIndex))
    })
    panels.forEach((panel, index) => {
      panel.hidden = index !== activeIndex
    })
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index))
  })
}

function createInstalledMatchCard(
  match: SiteDiscoveryResult["matches"][number],
  iconBridge: IconBridge
): HTMLElement {
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
  return card
}

function createRecommendedCard(
  recommendation: SiteRecommendationResult["recommendations"][number],
  iconBridge: IconBridge
): HTMLElement {
  const card = document.createElement("a")
  card.className = "eh-card"
  card.href = recommendation.url
  card.target = "_blank"
  card.rel = "noreferrer"

  const content = document.createElement("div")
  content.innerHTML = `
    <h3 class="eh-card-title">
      <span class="eh-name"></span>
      <span class="eh-pill">rec</span>
    </h3>
    <p class="eh-description"></p>
    <p class="eh-reason"></p>
    <div class="eh-meta">
      <span class="eh-chip"></span>
      <span class="eh-chip"></span>
      <span class="eh-chip"></span>
    </div>
  `
  content.querySelector(".eh-name")!.textContent = recommendation.name
  content.querySelector(".eh-description")!.textContent =
    recommendation.description || "No description provided by Chrome Web Store."
  content.querySelector(".eh-reason")!.textContent = recommendation.reason
  const chips = content.querySelectorAll<HTMLElement>(".eh-meta .eh-chip")
  chips[0]!.textContent = recommendation.rating
    ? `${recommendation.rating.toFixed(1)} stars`
    : "rating n/a"
  chips[1]!.textContent = recommendation.usersText ?? "users n/a"
  chips[2]!.textContent = recommendation.sourceQuery || `rank ${recommendation.rank}`

  card.append(createIcon(recommendation.name, recommendation.iconUrl, iconBridge), content)
  return card
}

function renderResult(
  body: HTMLElement,
  footer: HTMLElement,
  result: SiteDiscoveryResult,
  iconBridge: IconBridge,
  recommendations: SiteRecommendationResult | undefined,
  auth: SiteAuthStatus | undefined,
  actions: {
    onLogin: (provider: SiteAuthProvider) => void
    onSignOut: () => void
  },
  options: {
    recommendationsLoading?: boolean
    activePanelId?: string
  } = {}
): void {
  body.replaceChildren()
  footer.replaceChildren()
  const selectedPanelId = options.activePanelId ?? "eh-panel-installed"
  const recommendedCount = options.recommendationsLoading
    ? "..."
    : String(recommendations?.recommendations.length ?? 0)
  const pointsText = getRecommendationQuotaPointsText(
    recommendations,
    options.recommendationsLoading
  )

  const summary = document.createElement("div")
  summary.className = "eh-summary"
  summary.innerHTML = `
    <div class="eh-stat"><strong>${result.matches.length}</strong><span>matches</span></div>
    <div class="eh-stat"><strong>${recommendedCount}</strong><span>recommended</span></div>
    <div class="eh-stat"><strong>${pointsText}</strong><span>points</span></div>
  `
  body.append(summary)

  const tabs = document.createElement("div")
  tabs.className = "eh-tabs"
  tabs.role = "tablist"

  const recommendedTab = createTabButton({
    id: "eh-tab-recommended",
    panelId: "eh-panel-recommended",
    label: "Recommended",
    selected: selectedPanelId === "eh-panel-recommended",
  })
  const installedTab = createTabButton({
    id: "eh-tab-installed",
    panelId: "eh-panel-installed",
    label: "Installed",
    selected: selectedPanelId !== "eh-panel-recommended",
  })
  installedTab.querySelector(".eh-tab-count")!.textContent = String(result.matches.length)
  recommendedTab.querySelector(".eh-tab-count")!.textContent = recommendedCount
  tabs.append(installedTab, recommendedTab)

  const recommendationSection = createTabPanel({
    id: "eh-panel-recommended",
    labelledBy: "eh-tab-recommended",
    selected: selectedPanelId === "eh-panel-recommended",
  })
  recommendationSection.append(
    createSectionTitle(
      "Recommended extensions",
      recommendations?.recommendations.length ? recommendations.source : undefined
    )
  )
  if (options.recommendationsLoading) {
    recommendationSection.append(createLoadingState("Searching recommendations for this site..."))
  } else if (!recommendations || recommendations.recommendations.length === 0) {
    const empty = document.createElement("div")
    empty.className = "eh-state"
    if (!auth?.apiConfigured && !auth?.aiConfigured) {
      empty.textContent = "Recommendation service or AI provider is not configured yet."
    } else if (recommendations?.error) {
      empty.textContent = "Recommendation service is unavailable. Try again later."
    } else {
      empty.textContent = "No recommendations are available for this site yet."
    }
    recommendationSection.append(empty)
  } else {
    const list = document.createElement("div")
    list.className = "eh-list"
    recommendations.recommendations.forEach((recommendation) => {
      list.append(createRecommendedCard(recommendation, iconBridge))
    })
    recommendationSection.append(list)
  }

  const installedSection = createTabPanel({
    id: "eh-panel-installed",
    labelledBy: "eh-tab-installed",
    selected: selectedPanelId !== "eh-panel-recommended",
  })
  installedSection.append(
    createSectionTitle("Installed matches", `${result.totalExtensions} installed`)
  )

  if (result.matches.length === 0) {
    const empty = document.createElement("div")
    empty.className = "eh-state"
    empty.textContent =
      "No installed extensions look specific to this site yet. Check recommendations below."
    installedSection.append(empty)
  } else {
    const list = document.createElement("div")
    list.className = "eh-list"
    for (const match of result.matches) {
      list.append(createInstalledMatchCard(match, iconBridge))
    }
    installedSection.append(list)
  }

  wireTabs([installedTab, recommendedTab], [installedSection, recommendationSection])
  body.append(tabs, installedSection, recommendationSection)

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

  const footerRow = document.createElement("div")
  footerRow.className = "eh-footer-row"
  const authCopy = document.createElement("p")
  authCopy.className = "eh-auth-copy"
  if (auth?.authenticated) {
    authCopy.textContent = `Signed in${auth.user?.email ? ` as ${auth.user.email}` : ""}`
  } else if (auth?.authConfigured) {
    authCopy.textContent = "Sign in to unlock server recommendations"
  } else if (auth?.apiConfigured) {
    authCopy.textContent = "Using server recommendations"
  } else if (auth?.aiConfigured) {
    authCopy.textContent = "Using AI recommendations"
  } else {
    authCopy.textContent = "Recommendation service or AI provider is not configured"
  }

  const actionGroup = document.createElement("div")
  actionGroup.className = "eh-actions"
  if (auth?.authenticated) {
    const signOut = document.createElement("button")
    signOut.className = "eh-action"
    signOut.type = "button"
    signOut.textContent = "Sign out"
    signOut.addEventListener("click", actions.onSignOut)
    actionGroup.append(signOut)
  } else if (auth?.authConfigured) {
    ;(["github", "google"] as const).forEach((provider) => {
      const button = document.createElement("button")
      button.className = "eh-action"
      button.type = "button"
      button.textContent = provider
      button.addEventListener("click", () => actions.onLogin(provider))
      actionGroup.append(button)
    })
  }

  footerRow.append(authCopy, actionGroup)
  footer.append(queryTitle, queryList, footerRow)
}

function renderState(body: HTMLElement, message: string): void {
  body.replaceChildren()
  const state = document.createElement("div")
  state.className = "eh-state"
  state.textContent = message
  body.append(state)
}

function renderLoadingState(body: HTMLElement, message: string): void {
  body.replaceChildren(createLoadingState(message))
}

function createLoadingState(message: string): HTMLElement {
  const state = document.createElement("div")
  state.className = "eh-state eh-loading"
  state.setAttribute("role", "status")
  state.textContent = message
  return state
}

function getActivePanelId(body: HTMLElement): string | undefined {
  return (
    body
      .querySelector<HTMLButtonElement>('.eh-tab[aria-selected="true"]')
      ?.getAttribute("aria-controls") ?? undefined
  )
}

function getInstalledExtensionsForRecommendations(
  result: SiteDiscoveryResult
): InstalledExtensionRecommendationContext[] {
  return result.matches.map((match) => ({
    name: match.extension.name,
    description: match.extension.description || undefined,
  }))
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

function getDefaultTriggerPosition(trigger: HTMLElement): TriggerPosition {
  const width = trigger.offsetWidth || 136
  const height = trigger.offsetHeight || 42
  return {
    x: Math.max(EDGE_GAP, window.innerWidth - width - 20),
    y: Math.max(EDGE_GAP, window.innerHeight - height - 22),
    edge: null,
    collapsed: false,
  }
}

function clampTriggerPosition(
  position: Pick<TriggerPosition, "x" | "y">,
  trigger: HTMLElement
): Pick<TriggerPosition, "x" | "y"> {
  const width = trigger.offsetWidth || 136
  const height = trigger.offsetHeight || 42
  return {
    x: Math.min(
      Math.max(EDGE_GAP, position.x),
      Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP)
    ),
    y: Math.min(
      Math.max(EDGE_GAP, position.y),
      Math.max(EDGE_GAP, window.innerHeight - height - EDGE_GAP)
    ),
  }
}

function getDockedPosition(
  position: Pick<TriggerPosition, "x" | "y">,
  trigger: HTMLElement
): TriggerPosition {
  const width = trigger.offsetWidth || 136
  const rightDistance = window.innerWidth - (position.x + width)

  if (position.x <= EDGE_SNAP_DISTANCE) {
    return {
      x: 0,
      y: position.y,
      edge: "left",
      collapsed: true,
    }
  }

  if (rightDistance <= EDGE_SNAP_DISTANCE) {
    return {
      x: window.innerWidth - width,
      y: position.y,
      edge: "right",
      collapsed: true,
    }
  }

  const clamped = clampTriggerPosition(position, trigger)
  return {
    x: clamped.x,
    y: clamped.y,
    edge: null,
    collapsed: false,
  }
}

function applyTriggerPosition(trigger: HTMLElement, position: TriggerPosition): void {
  trigger.style.setProperty("--eh-trigger-x", `${Math.round(position.x)}px`)
  trigger.style.setProperty("--eh-trigger-y", `${Math.round(position.y)}px`)
  trigger.dataset.edge = position.edge ?? ""
  trigger.classList.toggle("is-collapsed", position.collapsed)
}

function expandDockedPosition(trigger: HTMLElement, position: TriggerPosition): TriggerPosition {
  if (position.edge === "left") {
    return { ...position, x: EDGE_GAP, collapsed: false }
  }

  if (position.edge === "right") {
    const width = trigger.offsetWidth || 136
    return { ...position, x: window.innerWidth - width - EDGE_GAP, collapsed: false }
  }

  return { ...position, collapsed: false }
}

function updatePanelPosition(panel: HTMLElement, trigger: HTMLElement): void {
  if (panel.classList.contains("eh-hidden")) return

  const triggerRect = trigger.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const margin = 16
  const gap = 12
  const panelWidth = panelRect.width || Math.min(420, window.innerWidth - 32)
  const panelHeight = panelRect.height || Math.min(640, window.innerHeight - 96)
  const x = Math.min(
    Math.max(margin, triggerRect.left),
    Math.max(margin, window.innerWidth - panelWidth - margin)
  )
  const preferredY = triggerRect.top - panelHeight - gap
  const y =
    preferredY >= margin
      ? preferredY
      : Math.min(
          triggerRect.bottom + gap,
          Math.max(margin, window.innerHeight - panelHeight - margin)
        )

  panel.style.setProperty("--eh-panel-x", `${Math.round(x)}px`)
  panel.style.setProperty("--eh-panel-y", `${Math.round(y)}px`)
}

async function requestDiscovery(): Promise<DiscoveryResponse> {
  return await chrome.runtime.sendMessage({
    type: "DISCOVER_INSTALLED_EXTENSIONS_FOR_SITE",
    url: location.href,
    pageTitle: document.title,
    pageDescription: getMetaDescription(),
  })
}

async function requestRecommendations(
  installedExtensions: InstalledExtensionRecommendationContext[]
): Promise<RecommendationResponse> {
  return await chrome.runtime.sendMessage({
    type: "FETCH_SITE_RECOMMENDATIONS_FOR_SITE",
    url: location.href,
    pageTitle: document.title,
    pageDescription: getMetaDescription(),
    installedExtensions,
  })
}

async function requestLogin(provider: SiteAuthProvider): Promise<AuthResponse> {
  return await chrome.runtime.sendMessage({
    type: "START_SITE_AUTH_LOGIN",
    provider,
  })
}

async function requestSignOut(): Promise<AuthResponse> {
  return await chrome.runtime.sendMessage({
    type: "SIGN_OUT_SITE_AUTH",
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
  trigger.title = "Drag to move. Drop on the screen edge to tuck it into the side."
  trigger.setAttribute("aria-label", "Open Ext Helper site discovery. Drag to move.")

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
  let triggerPosition: TriggerPosition | null = null
  let dragState: DragState | null = null
  let suppressNextClick = false
  let collapseTimer: number | null = null
  let collapseUnlockTimer: number | null = null

  const clearCollapseAnimation = () => {
    if (collapseTimer !== null) {
      window.clearTimeout(collapseTimer)
      collapseTimer = null
    }
    if (collapseUnlockTimer !== null) {
      window.clearTimeout(collapseUnlockTimer)
      collapseUnlockTimer = null
    }
    trigger.classList.remove("is-collapsing")
  }

  const setTriggerPosition = (nextPosition: TriggerPosition) => {
    triggerPosition = nextPosition
    applyTriggerPosition(trigger, triggerPosition)
    window.requestAnimationFrame(() => updatePanelPosition(panel, trigger))
  }

  const settleTriggerPosition = (nextPosition: TriggerPosition) => {
    clearCollapseAnimation()

    if (!nextPosition.collapsed) {
      setTriggerPosition(nextPosition)
      return
    }

    trigger.classList.add("is-collapsing")
    setTriggerPosition({ ...nextPosition, collapsed: false })
    collapseTimer = window.setTimeout(() => {
      setTriggerPosition(nextPosition)
      collapseTimer = null
      collapseUnlockTimer = window.setTimeout(() => {
        trigger.classList.remove("is-collapsing")
        collapseUnlockTimer = null
      }, COLLAPSE_LOCK_MS)
    }, DOCK_SLIDE_MS)
  }

  const ensureTriggerPosition = (): TriggerPosition => {
    if (!triggerPosition) {
      triggerPosition = getDefaultTriggerPosition(trigger)
      applyTriggerPosition(trigger, triggerPosition)
    }

    return triggerPosition
  }

  const loadPanel = async () => {
    renderLoadingState(body, "Scanning installed extensions for this site...")
    footer.replaceChildren()
    const response = await requestDiscovery().catch((error) => ({
      success: false as const,
      error: error instanceof Error ? error.message : "Discovery failed.",
    }))
    if (response.success) {
      renderResult(
        body,
        footer,
        response.result,
        iconBridge,
        undefined,
        response.auth,
        {
          onLogin: (provider) => {
            void handleLogin(provider)
          },
          onSignOut: () => {
            void handleSignOut()
          },
        },
        { recommendationsLoading: true }
      )
      updatePanelPosition(panel, trigger)

      const recommendationResponse = await requestRecommendations(
        getInstalledExtensionsForRecommendations(response.result)
      ).catch((error) => ({
        success: false as const,
        error: error instanceof Error ? error.message : "Recommendation lookup failed.",
      }))
      const recommendations: SiteRecommendationResult = recommendationResponse.success
        ? recommendationResponse.recommendations
        : {
            domain: response.result.domain,
            source: "remote",
            totalCandidates: 0,
            recommendations: [],
            error: recommendationResponse.error,
          }
      renderResult(
        body,
        footer,
        response.result,
        iconBridge,
        recommendations,
        response.auth,
        {
          onLogin: (provider) => {
            void handleLogin(provider)
          },
          onSignOut: () => {
            void handleSignOut()
          },
        },
        { activePanelId: getActivePanelId(body) }
      )
    } else {
      renderState(body, response.error)
    }
    updatePanelPosition(panel, trigger)
  }

  const handleLogin = async (provider: SiteAuthProvider) => {
    renderState(body, `Opening ${provider} login...`)
    footer.replaceChildren()
    const response = await requestLogin(provider).catch((error) => ({
      success: false as const,
      error: error instanceof Error ? error.message : "Login failed.",
    }))
    if (!response.success) {
      renderState(body, response.error)
      return
    }
    await loadPanel()
  }

  const handleSignOut = async () => {
    renderState(body, "Signing out...")
    footer.replaceChildren()
    const response = await requestSignOut().catch((error) => ({
      success: false as const,
      error: error instanceof Error ? error.message : "Sign out failed.",
    }))
    if (!response.success) {
      renderState(body, response.error)
      return
    }
    await loadPanel()
  }

  const openPanel = async () => {
    clearCollapseAnimation()
    ensureTriggerPosition()
    trigger.classList.add("is-open")
    panel.classList.remove("eh-hidden")
    updatePanelPosition(panel, trigger)
    await loadPanel()
  }

  const closePanel = () => {
    trigger.classList.remove("is-open")
    panel.classList.add("eh-hidden")
  }

  trigger.addEventListener("click", async () => {
    if (suppressNextClick) {
      suppressNextClick = false
      return
    }

    if (!panel.classList.contains("eh-hidden")) {
      closePanel()
      return
    }

    await openPanel()
  })

  trigger.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return

    clearCollapseAnimation()
    ensureTriggerPosition()

    const rect = trigger.getBoundingClientRect()
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    }
    trigger.setPointerCapture(event.pointerId)
    trigger.classList.add("is-dragging")
  })

  trigger.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    if (!dragState.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return

    dragState.moved = true
    const clamped = clampTriggerPosition(
      {
        x: event.clientX - dragState.offsetX,
        y: event.clientY - dragState.offsetY,
      },
      trigger
    )
    setTriggerPosition({ x: clamped.x, y: clamped.y, edge: null, collapsed: false })
  })

  trigger.addEventListener("pointerup", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return

    trigger.releasePointerCapture(event.pointerId)
    trigger.classList.remove("is-dragging")
    if (dragState.moved && triggerPosition) {
      suppressNextClick = true
      window.setTimeout(() => {
        suppressNextClick = false
      }, 0)
      settleTriggerPosition(getDockedPosition(triggerPosition, trigger))
    }
    dragState = null
  })

  trigger.addEventListener("pointercancel", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return

    trigger.releasePointerCapture(event.pointerId)
    trigger.classList.remove("is-dragging")
    dragState = null
  })

  close.addEventListener("click", closePanel)

  window.addEventListener("resize", () => {
    const currentPosition = ensureTriggerPosition()
    const expanded = currentPosition.collapsed
      ? expandDockedPosition(trigger, currentPosition)
      : currentPosition
    setTriggerPosition(getDockedPosition(expanded, trigger))
  })

  shadow.append(createStyles(), iconBridge.iframe, trigger, panel)
  document.documentElement.append(host)
  setTriggerPosition(getDefaultTriggerPosition(trigger))
}

mount()
