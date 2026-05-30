// Plasmo injects webextension-polyfill at build time, so `browser.*` works
// uniformly across Chrome, Edge, and Firefox — no manual branching needed.
//
// At runtime `browser` is the polyfill (Promise-based, Firefox-style API).
// We import @types/chrome and treat `browser.*` as having Chrome shape — the
// polyfill makes Chrome's namespace Promise-returning so the shapes match.
import type { BrowserType, Extension } from "@/types"
import { logger } from "@/utils/logger"

// Both `chrome` (Plasmo / Chrome / Edge) and `browser` (Firefox / polyfill) are
// injected as globals by the browser runtime. We type both as Chrome's API
// shape — the polyfill normalizes Firefox's namespace to match.
declare const chrome: typeof globalThis extends { chrome: infer C } ? C : never
declare const browser: typeof chrome

type ExtensionInfo = chrome.management.ExtensionInfo
type StorageChange = chrome.storage.StorageChange
type Alarm = chrome.alarms.Alarm
type Tab = chrome.tabs.Tab

export class BrowserError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = "BrowserError"
  }
}

/**
 * Wrap a browser-API call in a try/catch that throws BrowserError with a
 * caller-supplied message. Cuts the boilerplate that used to repeat at every call site.
 */
async function withBrowserError<T>(op: () => Promise<T>, message: string): Promise<T> {
  try {
    return await op()
  } catch (error) {
    throw new BrowserError(message, error instanceof Error ? error.message : "Unknown error")
  }
}

function detectBrowser(): BrowserType {
  if (typeof browser !== "undefined" && browser.runtime?.id) {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) return "firefox"
    const ua = navigator.userAgent
    if (ua.includes("Edg/")) return "edge"
    return "chrome"
  }
  return "unknown"
}

function isManifestV3(): boolean {
  try {
    return browser.runtime.getManifest().manifest_version === 3
  } catch {
    return false
  }
}

function getManifestVersion(): string {
  try {
    return browser.runtime.getManifest().version
  } catch {
    return ""
  }
}

// ---------- Management API ----------

// Real Chrome ExtensionInfo has extra fields (versionName / mayEnable /
// disabledReason) that @types/chrome 0.0.270 doesn't list. Loose typing
// is contained to this single boundary helper; the rest of the codebase
// consumes the typed Extension shape.
interface RawExtensionInfo {
  id: string
  name: string
  description?: string
  version: string
  versionName?: string
  enabled: boolean
  icons?: Array<{ url: string }>
  type: string
  permissions?: string[]
  hostPermissions?: string[]
  installType: string
  mayEnable?: boolean
  mayDisable?: boolean
  disabledReason?: string | null
  offlineEnabled?: boolean
  optionsUrl?: string
  homepageUrl?: string
  updateUrl?: string
}

function formatExtension(ext: ExtensionInfo): Extension {
  const raw = ext as unknown as RawExtensionInfo
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || "",
    version: raw.version,
    versionName: raw.versionName ?? null,
    enabled: raw.enabled,
    iconUrl: raw.icons?.[0]?.url ?? null,
    type: raw.type as Extension["type"],
    permissions: raw.permissions ?? [],
    hostPermissions: raw.hostPermissions ?? [],
    installType: raw.installType as Extension["installType"],
    mayEnable: raw.mayEnable ?? true,
    mayDisable: raw.mayDisable ?? true,
    disabledReason: (raw.disabledReason ?? null) as Extension["disabledReason"],
    offlineEnabled: raw.offlineEnabled ?? false,
    optionsUrl: raw.optionsUrl ?? null,
    homepageUrl: raw.homepageUrl ?? null,
    updateUrl: raw.updateUrl ?? null,
  }
}

async function getExtensions(): Promise<Extension[]> {
  return withBrowserError(async () => {
    const selfId = browser.runtime?.id ?? null
    const extensions = await browser.management.getAll()
    return extensions
      .filter((ext) => ext.type === "extension" && ext.id !== selfId)
      .map(formatExtension)
  }, "Failed to get extensions")
}

async function setExtensionEnabled(id: string, enabled: boolean): Promise<void> {
  return withBrowserError(
    () => browser.management.setEnabled(id, enabled),
    `Failed to ${enabled ? "enable" : "disable"} extension`
  )
}

async function uninstallExtension(id: string): Promise<void> {
  return withBrowserError(
    () => browser.management.uninstall(id),
    "Failed to uninstall extension"
  )
}

async function openOptionsPage(optionsUrl: string): Promise<void> {
  return withBrowserError(
    async () => {
      await browser.tabs.create({ url: optionsUrl })
    },
    "Failed to open options page"
  )
}

function onExtensionInstalled(callback: (info: Extension) => void): () => void {
  const handler = (info: ExtensionInfo) => callback(formatExtension(info))
  browser.management.onInstalled.addListener(handler)
  return () => browser.management.onInstalled.removeListener(handler)
}

function onExtensionUninstalled(callback: (id: string) => void): () => void {
  // Chrome fires with id string, Firefox with ExtensionInfo object — normalize to id
  const handler = (info: string | ExtensionInfo) =>
    callback(typeof info === "string" ? info : info.id)
  browser.management.onUninstalled.addListener(handler)
  return () => browser.management.onUninstalled.removeListener(handler)
}

function onExtensionEnabledChanged(callback: (info: Extension) => void): () => void {
  const handler = (info: ExtensionInfo) => callback(formatExtension(info))
  // @types/chrome (as of 0.0.270) doesn't list onEnabledChanged — it exists in real Chrome.
  const mgmt = browser.management as typeof browser.management & {
    onEnabledChanged: chrome.events.Event<(info: ExtensionInfo) => void>
  }
  mgmt.onEnabledChanged.addListener(handler)
  return () => mgmt.onEnabledChanged.removeListener(handler)
}

// ---------- Storage API ----------

async function getStorage<T = unknown>(key: string): Promise<T | undefined> {
  return withBrowserError(async () => {
    const result = await browser.storage.local.get(key)
    return result[key] as T | undefined
  }, "Failed to get storage")
}

async function setStorage(key: string, value: unknown): Promise<void> {
  return withBrowserError(
    () => browser.storage.local.set({ [key]: value }),
    "Failed to set storage"
  )
}

async function getSyncStorage<T = unknown>(key: string): Promise<T | undefined> {
  return withBrowserError(async () => {
    const result = await browser.storage.sync.get(key)
    return result[key] as T | undefined
  }, "Failed to get sync storage")
}

async function setSyncStorage(key: string, value: unknown): Promise<void> {
  return withBrowserError(
    () => browser.storage.sync.set({ [key]: value }),
    "Failed to set sync storage"
  )
}

async function removeSyncStorage(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  return withBrowserError(
    () => browser.storage.sync.remove(keys),
    "Failed to remove sync storage"
  )
}

type SyncChangeCallback = (changes: Record<string, StorageChange>) => void

function onSyncChanged(callback: SyncChangeCallback): () => void {
  const handler = (changes: Record<string, StorageChange>, area: string) => {
    if (area === "sync") callback(changes)
  }
  browser.storage.onChanged.addListener(handler)
  return () => browser.storage.onChanged.removeListener(handler)
}

// ---------- Tabs API ----------

async function getCurrentTabUrl(): Promise<string | null> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    return tabs[0]?.url || null
  } catch (error) {
    logger.error("Failed to get current tab URL:", error)
    return null
  }
}

async function getCurrentTabId(): Promise<number | null> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    return tabs[0]?.id ?? null
  } catch (error) {
    logger.error("Failed to get current tab ID:", error)
    return null
  }
}

async function getTab(tabId: number): Promise<{ url?: string } | null> {
  try {
    return await browser.tabs.get(tabId)
  } catch {
    return null
  }
}

type TabUpdatedCallback = (
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: Tab
) => void
type TabActivatedCallback = (activeInfo: chrome.tabs.TabActiveInfo) => void

function onTabUpdated(callback: TabUpdatedCallback): () => void {
  browser.tabs.onUpdated.addListener(callback)
  return () => browser.tabs.onUpdated.removeListener(callback)
}

function onTabActivated(callback: TabActivatedCallback): () => void {
  browser.tabs.onActivated.addListener(callback)
  return () => browser.tabs.onActivated.removeListener(callback)
}

// ---------- Alarms API ----------

async function createAlarm(
  name: string,
  options: { delayInMinutes?: number; periodInMinutes?: number }
): Promise<void> {
  try {
    await browser.alarms.create(name, options)
  } catch (error) {
    logger.error("Failed to create alarm:", error)
  }
}

async function clearAlarm(name: string): Promise<void> {
  try {
    await browser.alarms.clear(name)
  } catch (error) {
    logger.error("Failed to clear alarm:", error)
  }
}

type AlarmCallback = (alarm: Alarm) => void

function onAlarm(callback: AlarmCallback): () => void {
  browser.alarms.onAlarm.addListener(callback)
  return () => browser.alarms.onAlarm.removeListener(callback)
}

// ---------- Messaging API ----------

type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => boolean | void

function onMessage(callback: MessageListener): () => void {
  browser.runtime.onMessage.addListener(callback)
  return () => browser.runtime.onMessage.removeListener(callback)
}

function sendMessage(message: unknown, callback?: (response: unknown) => void): void {
  try {
    const result = browser.runtime.sendMessage(message)
    if (callback && result && typeof (result as Promise<unknown>).then === "function") {
      ;(result as Promise<unknown>).then(callback)
    }
  } catch (error) {
    logger.error("Failed to send message:", error)
  }
}

export const browserAdapter = {
  detectBrowser,
  isManifestV3,
  getManifestVersion,
  getExtensions,
  setExtensionEnabled,
  uninstallExtension,
  openOptionsPage,
  onExtensionInstalled,
  onExtensionUninstalled,
  onExtensionEnabledChanged,
  getStorage,
  setStorage,
  getSyncStorage,
  setSyncStorage,
  removeSyncStorage,
  onSyncChanged,
  getCurrentTabUrl,
  getCurrentTabId,
  getTab,
  onTabUpdated,
  onTabActivated,
  createAlarm,
  clearAlarm,
  onAlarm,
  onMessage,
  sendMessage,
}
