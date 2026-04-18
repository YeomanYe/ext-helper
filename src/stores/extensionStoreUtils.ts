import type { Extension } from "@/types"
import { createIdleBisectSession } from "@/stores/bisectUtils"

export type { ExtensionSnapshot } from "@/stores/bisectUtils"

type ExtensionSnapshot = Extension[]

export const cloneExtensions = (extensions: Extension[]): ExtensionSnapshot =>
  extensions.map((extension) => ({
    ...extension,
    permissions: [...extension.permissions],
  }))

const MAX_HISTORY = 20

export const buildHistoryMeta = (history: ExtensionSnapshot[], future: ExtensionSnapshot[]) => {
  const capped = history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history
  return {
    history: capped,
    future,
    canUndo: capped.length > 0,
    canRedo: future.length > 0,
    undoCount: capped.length,
    redoCount: future.length,
  }
}

export const withHistoryCleared = (extensions: ExtensionSnapshot) => ({
  extensions,
  ...buildHistoryMeta([], []),
  bisectSession: createIdleBisectSession(),
})

export const setPendingHistoryMeta = (history: ExtensionSnapshot[]) => ({
  canUndo: true,
  canRedo: false,
  undoCount: history.length + 1,
  redoCount: 0,
  history,
  future: [],
})
