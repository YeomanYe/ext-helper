import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { useToastStore, type ToastMessage } from "@/stores/toastStore"
import { cn } from "@/utils"

const variantStyles: Record<ToastMessage["variant"], string> = {
  info: "border-punk-accent/70 text-punk-accent",
  success: "border-punk-success/70 text-punk-success",
  warning: "border-punk-warning/80 text-punk-warning",
  error: "border-punk-cta/80 text-punk-cta",
}

const variantIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
} satisfies Record<ToastMessage["variant"], React.ComponentType<{ className?: string }>>

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  React.useEffect(() => {
    if (toast.durationMs <= 0) return
    const timeoutId = window.setTimeout(() => onDismiss(toast.id), toast.durationMs)
    return () => window.clearTimeout(timeoutId)
  }, [onDismiss, toast.durationMs, toast.id])

  const Icon = variantIcons[toast.variant]

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-[300px] items-start gap-2 border bg-punk-surface-raised px-3 py-2 shadow-punk-hard",
        variantStyles[toast.variant]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1 font-punk-body text-[11px] leading-snug text-punk-text-primary">
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-punk-text-muted transition-colors hover:text-punk-text-primary"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-[10001] flex flex-col items-end gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
