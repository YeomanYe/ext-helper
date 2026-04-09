import * as React from "react"
import { createPortal } from "react-dom"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/utils"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onCancel()
  }

  const borderColor =
    variant === "danger"
      ? "border-punk-cta"
      : variant === "warning"
        ? "border-punk-warning"
        : "border-punk-primary"

  const iconColor =
    variant === "danger"
      ? "text-punk-cta"
      : variant === "warning"
        ? "text-punk-warning"
        : "text-punk-accent"

  const confirmBtnClass =
    variant === "danger"
      ? "bg-punk-cta hover:bg-punk-cta/90"
      : variant === "warning"
        ? "bg-punk-warning hover:bg-punk-warning/90 text-punk-bg"
        : "bg-punk-primary hover:bg-punk-primary/90"

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={cn(
          "w-80 border bg-punk-bg-alt shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden",
          borderColor
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("flex items-center gap-2 px-4 py-3 border-b", borderColor)}>
          <AlertTriangle className={cn("h-4 w-4", iconColor)} />
          <h3 className="flex-1 font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wider">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="font-punk-body text-[10px] text-punk-text-secondary leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-punk-border/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-punk-heading text-[13px] text-punk-text-muted uppercase tracking-wider hover:text-punk-text-primary"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              "px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider text-white transition-all",
              confirmBtnClass
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
