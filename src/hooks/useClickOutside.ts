import * as React from "react"

export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  enabled = true
) {
  React.useEffect(() => {
    if (!enabled) return

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [ref, callback, enabled])
}
