import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils"

const buttonVariants = cva(
  "punk-btn inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-punk-neon-cyan disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "punk-btn-primary",
        secondary:
          "bg-punk-bg-alt text-punk-text-secondary border border-punk-border/30 hover:text-punk-primary hover:border-punk-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.5)]",
        ghost: "text-punk-text-secondary hover:text-punk-accent hover:bg-punk-bg-alt",
        destructive:
          "bg-punk-cta text-white border-2 border-punk-cta shadow-[0_0_10px_rgba(244,63,94,0.5)] hover:bg-punk-cta/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.8)]",
        accent:
          "bg-punk-accent text-punk-bg border-2 border-punk-accent shadow-[0_0_10px_rgba(34,211,238,0.5)] hover:bg-punk-accent/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-[12px]",
        lg: "h-11 px-6 py-2",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
