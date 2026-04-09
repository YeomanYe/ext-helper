// Development mode storage - simulates browser storage in memory
import type { BisectSession, Extension, Group } from "@/types"
import type { Rule } from "@/rules/types"
import { MOCK_EXTENSIONS, MOCK_GROUPS, MOCK_RULES } from "./mockData"

class DevStorage {
  private extensions: Extension[] = []
  private groups: Group[] = []
  private rules: Rule[] = []
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
    } catch {
      this.extensions = MOCK_EXTENSIONS
      this.groups = MOCK_GROUPS
      this.rules = MOCK_RULES
    }
  }

  private save() {
    try {
      localStorage.setItem("dev-extensions", JSON.stringify(this.extensions))
      localStorage.setItem("dev-groups", JSON.stringify(this.groups))
      localStorage.setItem("dev-rules", JSON.stringify(this.rules))
      localStorage.setItem("dev-preferences", JSON.stringify(this.preferences))
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

  // Generate ID
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
}

export const devStorage = new DevStorage()
