import * as React from "react"

interface UseContextMenuPositionOptions {
  cardRef: React.RefObject<HTMLElement | null>
  showMenu: boolean
  isDetail: boolean
  menuWidth: number
  menuHeight: number
  onClose: () => void
}

export function useContextMenuPosition({
  cardRef,
  showMenu,
  isDetail,
  menuWidth,
  menuHeight,
  onClose
}: UseContextMenuPositionOptions) {
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const updateMenuPosition = React.useCallback(() => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const surface = cardRef.current.closest("[data-extension-surface='true']")
    const surfaceRect = surface?.getBoundingClientRect()
    const boundaryLeft = surfaceRect?.left ?? 0
    const boundaryTop = surfaceRect?.top ?? 0
    const boundaryRight = surfaceRect?.right ?? window.innerWidth
    const boundaryBottom = surfaceRect?.bottom ?? window.innerHeight
    const boundaryWidth = boundaryRight - boundaryLeft
    const boundaryHeight = boundaryBottom - boundaryTop
    const padding = 10
    const gap = 6

    const isOutsideSurface = rect.bottom <= boundaryTop
      || rect.top >= boundaryBottom
      || rect.right <= boundaryLeft
      || rect.left >= boundaryRight

    if (isOutsideSurface) {
      onClose()
      return
    }

    const desiredLeft = isDetail
      ? rect.left
      : rect.left - boundaryLeft > boundaryWidth / 2
        ? rect.right - menuWidth
        : rect.left
    const desiredTop = isDetail
      ? rect.top
      : rect.top - boundaryTop > boundaryHeight / 2
        ? rect.top - menuHeight - gap
        : rect.bottom + gap

    const left = Math.min(
      Math.max(desiredLeft, boundaryLeft + padding),
      boundaryRight - menuWidth - padding
    )
    const top = Math.min(
      Math.max(desiredTop, boundaryTop + padding),
      boundaryBottom - menuHeight - padding
    )

    setMenuPosition({ top, left })
  }, [cardRef, isDetail, menuHeight, menuWidth, onClose])

  React.useEffect(() => {
    if (!showMenu) return

    updateMenuPosition()

    const handleViewportChange = () => updateMenuPosition()
    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [showMenu, updateMenuPosition])

  return menuPosition
}
