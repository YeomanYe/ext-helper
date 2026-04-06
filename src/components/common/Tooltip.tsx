import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!visible || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const tooltipEl = tooltipRef.current

    // Default: position above center
    let top = rect.top - 8
    let left = rect.left + rect.width / 2

    // After tooltip renders, adjust if it goes off-screen
    if (tooltipEl) {
      const tRect = tooltipEl.getBoundingClientRect()
      // If above would clip top, show below
      if (top - tRect.height < 4) {
        top = rect.bottom + 8
      }
      // Clamp horizontal
      const halfW = tRect.width / 2
      if (left - halfW < 4) left = halfW + 4
      if (left + halfW > window.innerWidth - 4) left = window.innerWidth - halfW - 4
    }

    setPosition({ top, left })
  }, [visible])

  if (!content) return children

  const child = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      setVisible(true)
      children.props.onMouseEnter?.(e)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setVisible(false)
      children.props.onMouseLeave?.(e)
    },
  })

  return (
    <>
      {child}
      {visible && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-[200] px-2.5 py-1.5 pointer-events-none",
            "border border-punk-neon-cyan/30 bg-punk-bg",
            "shadow-[0_0_12px_rgba(0,255,255,0.15),0_2px_8px_rgba(0,0,0,0.6)]",
            "font-punk-code text-[11px] text-punk-text-primary leading-relaxed",
            "max-w-[260px]",
            className
          )}
          style={{
            top: position.top,
            left: position.left,
            transform: "translate(-50%, -100%)",
          }}
        >
          {/* HUD corner accents */}
          <div className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-punk-neon-cyan/60" />
          <div className="absolute -top-px -right-px w-1.5 h-1.5 border-t border-r border-punk-neon-cyan/60" />
          <div className="absolute -bottom-px -left-px w-1.5 h-1.5 border-b border-l border-punk-neon-cyan/60" />
          <div className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-punk-neon-cyan/60" />
          {content}
        </div>,
        document.body
      )}
    </>
  )
}
