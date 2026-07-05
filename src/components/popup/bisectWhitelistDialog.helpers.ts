import type { Extension } from "@/types"

/** Filter out extensions that cannot be toggled (mayDisable === false). */
export function visibleExtensions(extensions: Extension[]): Extension[] {
  return extensions.filter((e) => e.mayDisable !== false)
}

/**
 * Count how many of the visible+enabled extensions would still be eligible
 * candidates after applying the given whitelist selection.
 */
export function countCandidates(extensions: Extension[], whitelist: string[]): number {
  const visible = visibleExtensions(extensions)
  const wl = new Set(whitelist)
  return visible.filter((e) => e.enabled && !wl.has(e.id)).length
}

/**
 * Toggle an id in/out of a selection list, returning a new array.
 * Used by the dialog checkbox handler — kept pure so it's testable
 * without a renderer.
 */
export function toggleSelection(selection: string[], id: string): string[] {
  return selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]
}

/**
 * Case-insensitive substring match on extension name; empty query keeps the
 * full list. Kept pure so it's testable without a renderer.
 */
export function filterExtensionsByQuery(extensions: Extension[], query: string): Extension[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return extensions
  return extensions.filter((e) => e.name.toLowerCase().includes(trimmed))
}
