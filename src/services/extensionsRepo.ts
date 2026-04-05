import type { BisectSession, Extension } from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode, MOCK_EXTENSIONS } from "@/services/mockData"

const BISECT_STORAGE_KEY = "ext-helper-bisect-session"

const cloneExtensions = (extensions: Extension[]): Extension[] =>
  extensions.map((extension) => ({
    ...extension,
    permissions: [...extension.permissions]
  }))

const cloneBisectSession = (session: BisectSession | null): BisectSession | null =>
  session ? JSON.parse(JSON.stringify(session)) : null

export const extensionsRepo = {
  async fetchAll(): Promise<Extension[]> {
    if (isDevMode()) {
      const stored = devStorage.getExtensions()
      if (stored.length === 0) {
        devStorage.setExtensions(MOCK_EXTENSIONS)
      }
      return cloneExtensions(devStorage.getExtensions())
    }

    return cloneExtensions(await browserAdapter.getExtensions())
  },

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    if (isDevMode()) {
      devStorage.updateExtension(id, { enabled })
      return
    }

    await browserAdapter.setExtensionEnabled(id, enabled)
  },

  async applySnapshot(previousExtensions: Extension[], nextExtensions: Extension[]): Promise<void> {
    if (isDevMode()) {
      devStorage.setExtensions(cloneExtensions(nextExtensions))
      return
    }

    const previousById = new Map(
      previousExtensions.map((extension) => [extension.id, extension.enabled])
    )

    await Promise.all(
      nextExtensions
        .filter((extension) => previousById.get(extension.id) !== extension.enabled)
        .map((extension) => browserAdapter.setExtensionEnabled(extension.id, extension.enabled))
    )
  },

  async remove(id: string): Promise<void> {
    if (isDevMode()) {
      devStorage.removeExtension(id)
      return
    }

    await browserAdapter.uninstallExtension(id)
  },

  async loadBisectSession(): Promise<BisectSession | null> {
    if (isDevMode()) {
      return cloneBisectSession(devStorage.getBisectSession())
    }

    return cloneBisectSession((await browserAdapter.getStorage(BISECT_STORAGE_KEY)) ?? null)
  },

  async saveBisectSession(session: BisectSession | null): Promise<void> {
    if (isDevMode()) {
      devStorage.setBisectSession(cloneBisectSession(session))
      return
    }

    await browserAdapter.setStorage(BISECT_STORAGE_KEY, cloneBisectSession(session))
  },

  async clearBisectSession(): Promise<void> {
    await this.saveBisectSession(null)
  }
}
