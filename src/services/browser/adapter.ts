import type { BrowserType, Extension } from "@/types"

declare const chrome: any
declare const browser: any

export class BrowserError extends Error {
  constructor(message: string, public code?: string) {
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

  try {
    if (browserType === "firefox") {
      const extensions = await browser.management.getAll()
      return extensions
        .filter((ext: any) => ext.type === "extension")
        .map(formatFirefoxExtension)
    } else {
      const extensions = await chrome.management.getAll()
      return extensions
        .filter((ext: any) => ext.type === "extension")
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
    enabled: ext.enabled,
    iconUrl: ext.icons?.[0]?.url || null,
    permissions: ext.permissions || [],
    installType: ext.installType,
    optionsUrl: ext.optionsUrl || null,
    homepageUrl: ext.homepageUrl || null
  }
}

function formatFirefoxExtension(ext: any): Extension {
  return {
    id: ext.id,
    name: ext.name,
    description: ext.description || "",
    version: ext.version,
    enabled: ext.enabled,
    iconUrl: ext.icons?.[0]?.url || null,
    permissions: ext.permissions || [],
    installType: ext.installType,
    optionsUrl: ext.optionsUrl || null,
    homepageUrl: ext.homepageUrl || null
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

async function openOptionsPage(id: string): Promise<void> {
  const browserType = detectBrowser()

  try {
    if (browserType === "firefox") {
      await browser.management.openOptionsPage(id)
    } else {
      await chrome.management.openOptionsPage(id)
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
  onExtensionEnabledChanged
}
