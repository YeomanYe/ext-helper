import { browserAdapter } from "@/services/browser/adapter"
import { isDevMode } from "@/services/mockData"
import { generateId } from "@/utils"

export const SITE_INSTALL_ID_STORAGE_KEY = "ext-helper-site-install-id"

function createInstallId(): string {
  return `install-${generateId()}`
}

export const siteInstallRepo = {
  async fetchOrCreate(): Promise<string> {
    if (isDevMode()) {
      const current = localStorage.getItem(SITE_INSTALL_ID_STORAGE_KEY)
      if (current) return current
      const next = createInstallId()
      localStorage.setItem(SITE_INSTALL_ID_STORAGE_KEY, next)
      return next
    }

    const current = await browserAdapter.getStorage<string>(SITE_INSTALL_ID_STORAGE_KEY)
    if (current) return current
    const next = createInstallId()
    await browserAdapter.setStorage(SITE_INSTALL_ID_STORAGE_KEY, next)
    return next
  },
}
