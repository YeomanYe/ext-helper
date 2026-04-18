// Plasmo injects webextension-polyfill at build time, so `browser.*` works
// uniformly across Chrome, Edge, and Firefox — no manual branching needed.
import type { BrowserType, Extension } from "@/types"

declare const chrome: any
declare const browser: any

export class BrowserError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = "BrowserError"
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
    return browser.runtime.getManifest().version as string
  } catch {
    return ""
  }
}

// ---------- Management API ----------

function formatExtension(ext: any): Extension {
  return {
    id: ext.id,
    name: ext.name,
    description: ext.description || "",
    version: ext.version,
    versionName: ext.versionName || null,
    enabled: ext.enabled,
    iconUrl: ext.icons?.[0]?.url || null,
    type: ext.type || "extension",
    permissions: ext.permissions || [],
    hostPermissions: ext.hostPermissions || [],
    installType: ext.installType,
    mayEnable: ext.mayEnable ?? true,
    mayDisable: ext.mayDisable ?? true,
    disabledReason: ext.disabledReason || null,
    offlineEnabled: ext.offlineEnabled ?? false,
    optionsUrl: ext.optionsUrl || null,
    homepageUrl: ext.homepageUrl || null,
    updateUrl: ext.updateUrl || null,
  }
}

async function getExtensions(): Promise<Extension[]> {
  try {
    const selfId = browser.runtime?.id ?? null
    const extensions = await browser.management.getAll()
    return extensions
      .filter((ext: any) => ext.type === "extension" && ext.id !== selfId)
      .map(formatExtension)
  } catch (error) {
    throw new BrowserError(
      "Failed to get extensions",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function setExtensionEnabled(id: string, enabled: boolean): Promise<void> {
  try {
    await browser.management.setEnabled(id, enabled)
  } catch (error) {
    throw new BrowserError(
      `Failed to ${enabled ? "enable" : "disable"} extension`,
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function uninstallExtension(id: string): Promise<void> {
  try {
    await browser.management.uninstall(id)
  } catch (error) {
    throw new BrowserError(
      "Failed to uninstall extension",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function openOptionsPage(optionsUrl: string): Promise<void> {
  try {
    await browser.tabs.create({ url: optionsUrl })
  } catch (error) {
    throw new BrowserError(
      "Failed to open options page",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

function onExtensionInstalled(callback: (info: Extension) => void): () => void {
  const handler = (info: any) => callback(formatExtension(info))
  browser.management.onInstalled.addListener(handler)
  return () => browser.management.onInstalled.removeListener(handler)
}

function onExtensionUninstalled(callback: (id: string) => void): () => void {
  // Chrome fires with id string, Firefox with ExtensionInfo object — normalize to id
  const handler = (info: any) => callback(typeof info === "string" ? info : info.id)
  browser.management.onUninstalled.addListener(handler)
  return () => browser.management.onUninstalled.removeListener(handler)
}

function onExtensionEnabledChanged(callback: (info: Extension) => void): () => void {
  const handler = (info: any) => callback(formatExtension(info))
  browser.management.onEnabledChanged.addListener(handler)
  return () => browser.management.onEnabledChanged.removeListener(handler)
}

// ---------- Storage API ----------

async function getStorage(key: string): Promise<any> {
  try {
    const result = await browser.storage.local.get(key)
    return result[key]
  } catch (error) {
    throw new BrowserError(
      "Failed to get storage",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function setStorage(key: string, value: any): Promise<void> {
  try {
    await browser.storage.local.set({ [key]: value })
  } catch (error) {
    throw new BrowserError(
      "Failed to set storage",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function getSyncStorage(key: string): Promise<any> {
  try {
    const result = await browser.storage.sync.get(key)
    return result[key]
  } catch (error) {
    throw new BrowserError(
      "Failed to get sync storage",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function setSyncStorage(key: string, value: any): Promise<void> {
  try {
    await browser.storage.sync.set({ [key]: value })
  } catch (error) {
    throw new BrowserError(
      "Failed to set sync storage",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function removeSyncStorage(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await browser.storage.sync.remove(keys)
  } catch (error) {
    throw new BrowserError(
      "Failed to remove sync storage",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

type SyncChangeCallback = (changes: Record<string, { oldValue?: any; newValue?: any }>) => void

function onSyncChanged(callback: SyncChangeCallback): () => void {
  const handler = (changes: Record<string, { oldValue?: any; newValue?: any }>, area: string) => {
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
    console.error("Failed to get current tab URL:", error)
    return null
  }
}

async function getCurrentTabId(): Promise<number | null> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    return tabs[0]?.id ?? null
  } catch (error) {
    console.error("Failed to get current tab ID:", error)
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

type TabUpdatedCallback = (tabId: number, changeInfo: { url?: string }) => void
type TabActivatedCallback = (activeInfo: { tabId: number }) => void

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
    console.error("Failed to create alarm:", error)
  }
}

async function clearAlarm(name: string): Promise<void> {
  try {
    await browser.alarms.clear(name)
  } catch (error) {
    console.error("Failed to clear alarm:", error)
  }
}

type AlarmCallback = (alarm: { name: string }) => void

function onAlarm(callback: AlarmCallback): () => void {
  browser.alarms.onAlarm.addListener(callback)
  return () => browser.alarms.onAlarm.removeListener(callback)
}

// ---------- Messaging API ----------

type MessageListener = (message: any, sender: any, sendResponse: (r: any) => void) => boolean | void

function onMessage(callback: MessageListener): () => void {
  browser.runtime.onMessage.addListener(callback)
  return () => browser.runtime.onMessage.removeListener(callback)
}

function sendMessage(message: any, callback?: (response: any) => void): void {
  try {
    browser.runtime.sendMessage(message).then(callback)
  } catch (error) {
    console.error("Failed to send message:", error)
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
