// Development mode storage - simulates browser storage in memory
import type { BisectSession, Extension, Group, UsageLogEvent } from "@/types"
import type { Rule } from "@/rules/types"
import { generateId } from "@/utils"
import { MOCK_EXTENSIONS, MOCK_GROUPS, MOCK_RULES } from "./mockData"

class DevStorage {
  private extensions: Extension[] = []
  private groups: Group[] = []
  private rules: Rule[] = []
  private usageLog: UsageLogEvent[] = []
  private preferences: {
    theme?: string
    compactMode?: boolean
    showDisabled?: boolean
    viewMode?: string
  } = {}
  private bisectSession: BisectSession | null = null
  private listeners: Map<string, Set<() => void>> = new Map()

  constructor() {
    this.load()
  }

  private load() {
    try {
      const ext = localStorage.getItem("dev-extensions")
      const grp = localStorage.getItem("dev-groups")
      const rls = localStorage.getItem("dev-rules")
      const prefs = localStorage.getItem("dev-preferences")
      const bisect = localStorage.getItem("dev-bisect-session")
      const usageLog = localStorage.getItem("dev-usage-log")
      if (ext) this.extensions = JSON.parse(ext)
      else this.extensions = MOCK_EXTENSIONS
      if (grp) this.groups = JSON.parse(grp)
      else this.groups = MOCK_GROUPS
      if (rls) this.rules = JSON.parse(rls)
      else this.rules = MOCK_RULES
      if (this.rules.length < 50) {
        this.rules = MOCK_RULES
      }
      if (prefs) this.preferences = JSON.parse(prefs)
      if (bisect) this.bisectSession = JSON.parse(bisect)
      if (usageLog) this.usageLog = JSON.parse(usageLog)
      else this.usageLog = this.buildMockUsageLog()
    } catch {
      this.extensions = MOCK_EXTENSIONS
      this.groups = MOCK_GROUPS
      this.rules = MOCK_RULES
      this.usageLog = this.buildMockUsageLog()
    }
  }

  private buildMockUsageLog(): UsageLogEvent[] {
    const now = Date.now()
    const actions: UsageLogEvent["action"][] = ["enabled", "disabled", "installed", "uninstalled"]
    const sources: UsageLogEvent["source"][] = ["browser", "popup", "background"]

    return this.extensions.slice(0, 8).map((extension, index) => ({
      id: `dev-log-${index}`,
      extensionId: extension.id,
      extensionName: extension.name,
      iconUrl: extension.iconUrl,
      action: actions[index % actions.length],
      timestamp: now - index * 1000 * 60 * 17,
      source: sources[index % sources.length],
    }))
  }

  private save() {
    try {
      localStorage.setItem("dev-extensions", JSON.stringify(this.extensions))
      localStorage.setItem("dev-groups", JSON.stringify(this.groups))
      localStorage.setItem("dev-rules", JSON.stringify(this.rules))
      localStorage.setItem("dev-preferences", JSON.stringify(this.preferences))
      localStorage.setItem("dev-usage-log", JSON.stringify(this.usageLog))
      if (this.bisectSession) {
        localStorage.setItem("dev-bisect-session", JSON.stringify(this.bisectSession))
      } else {
        localStorage.removeItem("dev-bisect-session")
      }
    } catch {
      // Ignore save errors
    }
  }

  private notify(key: string) {
    this.listeners.get(key)?.forEach((cb) => cb())
  }

  on(key: string, callback: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)
    return () => {
      this.listeners.get(key)?.delete(callback)
    }
  }

  // Extensions
  getExtensions(): Extension[] {
    return [...this.extensions]
  }

  setExtensions(exts: Extension[]) {
    this.extensions = exts
    this.save()
    this.notify("extensions")
  }

  updateExtension(id: string, updates: Partial<Extension>) {
    this.extensions = this.extensions.map((e) => (e.id === id ? { ...e, ...updates } : e))
    this.save()
    this.notify("extensions")
  }

  removeExtension(id: string) {
    this.extensions = this.extensions.filter((e) => e.id !== id)
    this.groups = this.groups.map((group) => ({
      ...group,
      extensionIds: group.extensionIds.filter((extId) => extId !== id),
    }))
    this.save()
    this.notify("extensions")
    this.notify("groups")
  }

  // Groups
  getGroups(): Group[] {
    return [...this.groups]
  }

  setGroups(groups: Group[]) {
    this.groups = groups
    this.save()
    this.notify("groups")
  }

  // Rules
  getRules(): Rule[] {
    return [...this.rules]
  }

  setRules(rules: Rule[]) {
    this.rules = rules
    this.save()
    this.notify("rules")
  }

  // Generate ID — delegates to shared utility (which prefers crypto.randomUUID).
  generateId(): string {
    return generateId()
  }

  // Preferences
  getPreferences(): {
    theme?: string
    compactMode?: boolean
    showDisabled?: boolean
    viewMode?: string
  } {
    return { ...this.preferences }
  }

  setPreferences(
    prefs: Partial<{
      theme?: string
      compactMode?: boolean
      showDisabled?: boolean
      viewMode?: string
    }>
  ) {
    this.preferences = { ...this.preferences, ...prefs }
    this.save()
  }

  getBisectSession(): BisectSession | null {
    return this.bisectSession ? JSON.parse(JSON.stringify(this.bisectSession)) : null
  }

  setBisectSession(session: BisectSession | null) {
    this.bisectSession = session ? JSON.parse(JSON.stringify(session)) : null
    this.save()
  }

  getUsageLog(): UsageLogEvent[] {
    return this.usageLog.map((event) => ({ ...event }))
  }

  setUsageLog(events: UsageLogEvent[]) {
    this.usageLog = events.map((event) => ({ ...event }))
    this.save()
    this.notify("usageLog")
  }
}

export const devStorage = new DevStorage()
