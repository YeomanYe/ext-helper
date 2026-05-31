import { create } from "zustand"

export type ToastVariant = "info" | "success" | "warning" | "error"

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
  durationMs: number
}

interface ShowToastOptions {
  message: string
  variant?: ToastVariant
  durationMs?: number
}

interface ToastStore {
  toasts: ToastMessage[]
  showToast: (options: ShowToastOptions) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

export const DEFAULT_TOAST_DURATION_MS = 3200
export const MAX_TOAST_COUNT = 3

let toastCounter = 0

export const createToastStore = () =>
  create<ToastStore>((set) => ({
    toasts: [],
    showToast: ({ message, variant = "info", durationMs = DEFAULT_TOAST_DURATION_MS }) => {
      const id = `toast-${Date.now()}-${toastCounter++}`
      set((state) => ({
        toasts: [...state.toasts, { id, message, variant, durationMs }].slice(-MAX_TOAST_COUNT),
      }))
      return id
    },
    dismissToast: (id) =>
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),
    clearToasts: () => set({ toasts: [] }),
  }))

export const useToastStore = createToastStore()

export const showToast = (options: ShowToastOptions) => useToastStore.getState().showToast(options)
