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
    return "firefox"
  }
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    const ua = navigator.userAgent
    if (ua.includes("Edg/")) return "edge"
    if (ua.includes("Safari/") && !ua.includes("Chrome")) return "safari"
    return "chrome"
  }
  return "unknown"
}

function isManifestV3(): boolean {
  try {
    return chrome.runtime.getManifest().manifest_version === 3
  } catch {
    return false
  }
}

async function getExtensions(): Promise<Extension[]> {
  const browserType = detectBrowser()
  const selfId =
    typeof chrome !== "undefined" && chrome.runtime?.id
      ? chrome.runtime.id
      : typeof browser !== "undefined" && browser.runtime?.id
        ? browser.runtime.id
        : null

  try {
    if (browserType === "firefox") {
      const extensions = await browser.management.getAll()
      return extensions
        .filter((ext: any) => ext.type === "extension" && ext.id !== selfId)
        .map(formatFirefoxExtension)
    } else {
      const extensions = await chrome.management.getAll()
      return extensions
        .filter((ext: any) => ext.type === "extension" && ext.id !== selfId)
        .map(formatChromeExtension)
    }
  } catch (error) {
    throw new BrowserError(
      "Failed to get extensions",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

function formatChromeExtension(ext: any): Extension {
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

function formatFirefoxExtension(ext: any): Extension {
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
  }
}

async function setExtensionEnabled(id: string, enabled: boolean): Promise<void> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      await browser.management.setEnabled(id, enabled)
    } else {
      await chrome.management.setEnabled(id, enabled)
    }
  } catch (error) {
    throw new BrowserError(
      `Failed to ${enabled ? "enable" : "disable"} extension`,
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function uninstallExtension(id: string): Promise<void> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      await browser.management.uninstall(id)
    } else {
      await chrome.management.uninstall(id)
    }
  } catch (error) {
    throw new BrowserError(
      "Failed to uninstall extension",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function openOptionsPage(optionsUrl: string): Promise<void> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      await browser.tabs.create({ url: optionsUrl })
    } else {
      await chrome.tabs.create({ url: optionsUrl })
    }
  } catch (error) {
    throw new BrowserError(
      "Failed to open options page",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function getStorage(key: string): Promise<any> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      const result = await browser.storage.local.get(key)
      return result[key]
    } else {
      const result = await chrome.storage.local.get(key)
      return result[key]
    }
  } catch (error) {
    throw new BrowserError(
      "Failed to get storage",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

async function setStorage(key: string, value: any): Promise<void> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      await browser.storage.local.set({ [key]: value })
    } else {
      await chrome.storage.local.set({ [key]: value })
    }
  } catch (error) {
    throw new BrowserError(
      "Failed to set storage",
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}

function onExtensionInstalled(callback: (info: Extension) => void): () => void {
  const browserType = detectBrowser()

  const handler = (info: any) => {
    callback(formatChromeExtension(info))
  }

  if (browserType === "firefox") {
    browser.management.onInstalled.addListener(handler)
  } else {
    chrome.management.onInstalled.addListener(handler)
  }

  return () => {
    if (browserType === "firefox") {
      browser.management.onInstalled.removeListener(handler)
    } else {
      chrome.management.onInstalled.removeListener(handler)
    }
  }
}

function onExtensionUninstalled(callback: (id: string) => void): () => void {
  const browserType = detectBrowser()

  const handler = (info: any) => {
    callback(info.id)
  }

  if (browserType === "firefox") {
    browser.management.onUninstalled.addListener(handler)
  } else {
    chrome.management.onUninstalled.addListener(handler)
  }

  return () => {
    if (browserType === "firefox") {
      browser.management.onUninstalled.removeListener(handler)
    } else {
      chrome.management.onUninstalled.removeListener(handler)
    }
  }
}

function onExtensionEnabledChanged(callback: (info: Extension) => void): () => void {
  const browserType = detectBrowser()

  const handler = (info: any) => {
    callback(formatChromeExtension(info))
  }

  if (browserType === "firefox") {
    browser.management.onEnabledChanged.addListener(handler)
  } else {
    chrome.management.onEnabledChanged.addListener(handler)
  }

  return () => {
    if (browserType === "firefox") {
      browser.management.onEnabledChanged.removeListener(handler)
    } else {
      chrome.management.onEnabledChanged.removeListener(handler)
    }
  }
}

// ---------- Tabs API ----------

async function getCurrentTabUrl(): Promise<string | null> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      return tabs[0]?.url || null
    } else {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      return tab?.url || null
    }
  } catch (error) {
    console.error("Failed to get current tab URL:", error)
    return null
  }
}

async function getCurrentTabId(): Promise<number | null> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      return tabs[0]?.id || null
    } else {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      return tab?.id || null
    }
  } catch (error) {
    console.error("Failed to get current tab ID:", error)
    return null
  }
}

// ---------- Alarms API ----------

async function createAlarm(
  name: string,
  options: { delayInMinutes?: number; periodInMinutes?: number }
): Promise<void> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      await browser.alarms.create(name, options)
    } else {
      await chrome.alarms.create(name, options)
    }
  } catch (error) {
    console.error("Failed to create alarm:", error)
  }
}

async function clearAlarm(name: string): Promise<void> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      await browser.alarms.clear(name)
    } else {
      await chrome.alarms.clear(name)
    }
  } catch (error) {
    console.error("Failed to clear alarm:", error)
  }
}

// ---------- Messaging API ----------

function sendMessage(message: any, callback?: (response: any) => void): void {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      browser.runtime.sendMessage(message).then(callback)
    } else {
      chrome.runtime.sendMessage(message, callback)
    }
  } catch (error) {
    console.error("Failed to send message:", error)
  }
}

export const browserAdapter = {
  detectBrowser,
  isManifestV3,
  getExtensions,
  setExtensionEnabled,
  uninstallExtension,
  openOptionsPage,
  getStorage,
  setStorage,
  onExtensionInstalled,
  onExtensionUninstalled,
  onExtensionEnabledChanged,
  // 新增
  getCurrentTabUrl,
  getCurrentTabId,
  createAlarm,
  clearAlarm,
  sendMessage,
}
