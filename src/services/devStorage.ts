// Development mode storage - simulates browser storage in memory
import type { Extension, Group, Rule } from "@/types"

class DevStorage {
  private extensions: Extension[] = []
  private groups: Group[] = []
  private rules: Rule[] = []
  private preferences: { theme?: string; compactMode?: boolean; showDisabled?: boolean; viewMode?: string } = {}
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
      if (ext) this.extensions = JSON.parse(ext)
      if (grp) this.groups = JSON.parse(grp)
      if (rls) this.rules = JSON.parse(rls)
      if (prefs) this.preferences = JSON.parse(prefs)
    } catch {
      // Ignore parse errors
    }
  }

  private save() {
    try {
      localStorage.setItem("dev-extensions", JSON.stringify(this.extensions))
      localStorage.setItem("dev-groups", JSON.stringify(this.groups))
      localStorage.setItem("dev-rules", JSON.stringify(this.rules))
      localStorage.setItem("dev-preferences", JSON.stringify(this.preferences))
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
    this.extensions = this.extensions.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    )
    this.save()
    this.notify("extensions")
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
  getPreferences(): { theme?: string; compactMode?: boolean; showDisabled?: boolean; viewMode?: string } {
    return { ...this.preferences }
  }

  setPreferences(prefs: Partial<{ theme?: string; compactMode?: boolean; showDisabled?: boolean; viewMode?: string }>) {
    this.preferences = { ...this.preferences, ...prefs }
    this.save()
  }
}

export const devStorage = new DevStorage()
