import * as React from "react"

interface FindShortcutEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
  target: EventTarget | null
}

export type FindShortcutSurface = "extensions" | "rules" | "logs"

const AUTO_CAPTURE_FIND_SHORTCUT_SURFACES = new Set<FindShortcutSurface>(["extensions", "rules"])

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false

  const maybeElement = target as { tagName?: string; isContentEditable?: boolean }
  const tagName = maybeElement.tagName?.toLowerCase()
  return (
    Boolean(maybeElement.isContentEditable) ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  )
}

export function shouldFocusSearchFromFindShortcut(event: FindShortcutEvent): boolean {
  const isFindKey = event.key.toLowerCase() === "f"
  const hasFindModifier = event.ctrlKey || event.metaKey
  const hasSingleFindModifier = event.ctrlKey !== event.metaKey

  return (
    isFindKey &&
    hasFindModifier &&
    hasSingleFindModifier &&
    !event.altKey &&
    !event.shiftKey &&
    !isEditableTarget(event.target)
  )
}

export function shouldEnableFindShortcutForSurface(surface: FindShortcutSurface): boolean {
  return AUTO_CAPTURE_FIND_SHORTCUT_SURFACES.has(surface)
}

export function useFindShortcutFocus(
  inputRef: React.RefObject<HTMLInputElement>,
  enabled: boolean
): void {
  React.useEffect(() => {
    if (!enabled || typeof document === "undefined") return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldFocusSearchFromFindShortcut(event)) return

      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [enabled, inputRef])
}
