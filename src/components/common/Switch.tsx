import * as React from "react"
import { cn } from "@/utils"

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled = false, className }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-none transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-punk-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-punk-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "bg-punk-success/20 border-2 border-punk-success shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            : "bg-punk-bg border-2 border-punk-text-muted",
          className
        )}
        ref={ref}
      >
        {/* Labels */}
        <span
          className={cn(
            "absolute font-punk-code text-[12px] transition-all duration-200",
            checked ? "left-1 text-punk-success" : "right-1 text-punk-text-muted"
          )}
        >
          {checked ? "1" : "0"}
        </span>

        {/* Thumb - Binary display */}
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-none bg-punk-text-primary shadow-lg transition-all duration-200",
            checked
              ? "translate-x-5 bg-punk-success shadow-[0_0_10px_rgba(16,185,129,0.8)]"
              : "translate-x-0.5"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
