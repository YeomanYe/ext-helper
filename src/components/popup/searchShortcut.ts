interface FindShortcutEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
  target: EventTarget | null
}

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
