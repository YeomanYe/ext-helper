import type {
  Extension,
  UsageLogAction,
  UsageLogEvent,
  UsageLogExtensionStats,
  UsageLogStats,
} from "@/types"
import { browserAdapter } from "@/services/browser/adapter"
import { devStorage } from "@/services/devStorage"
import { isDevMode } from "@/services/mockData"

const USAGE_LOG_STORAGE_KEY = "ext-helper-usage-log"
export const USAGE_LOG_MAX_EVENTS = 500
const DEDUPE_WINDOW_MS = 2000

const emptyActionCounts = (): Record<UsageLogAction, number> => ({
  enabled: 0,
  disabled: 0,
  installed: 0,
  uninstalled: 0,
})

export const createEmptyUsageLogStats = (): UsageLogStats => ({
  total: 0,
  byAction: emptyActionCounts(),
  byExtension: {},
})

const cloneEvents = (events: UsageLogEvent[]): UsageLogEvent[] =>
  events.map((event) => ({ ...event }))

const normalizeEvents = (events: UsageLogEvent[]): UsageLogEvent[] =>
  cloneEvents(events)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, USAGE_LOG_MAX_EVENTS)

const readEvents = async (): Promise<UsageLogEvent[]> => {
  if (isDevMode()) {
    return normalizeEvents(devStorage.getUsageLog())
  }

  const stored = (await browserAdapter.getStorage(USAGE_LOG_STORAGE_KEY)) ?? []
  return normalizeEvents(Array.isArray(stored) ? stored : [])
}

const writeEvents = async (events: UsageLogEvent[]): Promise<void> => {
  const normalized = normalizeEvents(events)
  if (isDevMode()) {
    devStorage.setUsageLog(normalized)
    return
  }

  await browserAdapter.setStorage(USAGE_LOG_STORAGE_KEY, normalized)
}

const isDuplicate = (event: UsageLogEvent, existing: UsageLogEvent): boolean =>
  event.extensionId === existing.extensionId &&
  event.action === existing.action &&
  Math.abs(event.timestamp - existing.timestamp) <= DEDUPE_WINDOW_MS

const createExtensionStats = (extensionName: string): UsageLogExtensionStats => ({
  extensionName,
  enabled: 0,
  disabled: 0,
  installed: 0,
  uninstalled: 0,
  total: 0,
  lastEventAt: 0,
})

export const buildUsageLogStats = (events: UsageLogEvent[]): UsageLogStats => {
  const stats = createEmptyUsageLogStats()

  events.forEach((event) => {
    stats.total += 1
    stats.byAction[event.action] += 1

    const extensionStats =
      stats.byExtension[event.extensionId] ??
      createExtensionStats(event.extensionName || event.extensionId)

    extensionStats[event.action] += 1
    extensionStats.total += 1
    extensionStats.lastEventAt = Math.max(extensionStats.lastEventAt, event.timestamp)
    if (event.extensionName && extensionStats.extensionName === event.extensionId) {
      extensionStats.extensionName = event.extensionName
    }
    stats.byExtension[event.extensionId] = extensionStats
  })

  return stats
}

export const createUsageLogEvent = (
  extension: Pick<Extension, "id" | "name"> & Partial<Pick<Extension, "iconUrl">>,
  action: UsageLogAction,
  source: UsageLogEvent["source"] = "browser"
): UsageLogEvent => {
  const timestamp = Date.now()
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${timestamp}-${Math.random().toString(36).slice(2)}`

  return {
    id: randomId,
    extensionId: extension.id,
    extensionName: extension.name || extension.id,
    iconUrl: extension.iconUrl ?? null,
    action,
    timestamp,
    source,
  }
}

export const usageLogRepo = {
  async fetchAll(): Promise<UsageLogEvent[]> {
    return readEvents()
  },

  async append(event: UsageLogEvent, options: { dedupe?: boolean } = {}): Promise<void> {
    const events = await readEvents()
    if (options.dedupe !== false && events.some((existing) => isDuplicate(event, existing))) {
      return
    }

    await writeEvents([event, ...events])
  },

  async appendMany(eventsToAppend: UsageLogEvent[]): Promise<void> {
    const events = await readEvents()
    const nextEvents = [...events]

    eventsToAppend.forEach((event) => {
      if (!nextEvents.some((existing) => isDuplicate(event, existing))) {
        nextEvents.unshift(event)
      }
    })

    await writeEvents(nextEvents)
  },

  async clear(): Promise<void> {
    await writeEvents([])
  },

  async replaceAll(events: UsageLogEvent[]): Promise<void> {
    await writeEvents(events)
  },

  async getStats(): Promise<UsageLogStats> {
    return buildUsageLogStats(await readEvents())
  },

  async findExtensionName(extensionId: string): Promise<string | null> {
    const events = await readEvents()
    return (
      events.find((event) => event.extensionId === extensionId && event.extensionName)
        ?.extensionName ?? null
    )
  },
}
