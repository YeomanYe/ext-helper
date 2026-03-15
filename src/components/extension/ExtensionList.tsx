import { Package } from "lucide-react"
import { ExtensionCard } from "./ExtensionCard"
import type { Extension } from "@/types"

interface ExtensionListProps {
  extensions: Extension[]
  onToggle: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
  loading?: boolean
}

export function ExtensionList({
  extensions,
  onToggle,
  onOpenOptions,
  onRemove,
  loading
}: ExtensionListProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (extensions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
          No extensions found
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          No extensions match your search
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-2">
      {extensions.map((extension) => (
        <ExtensionCard
          key={extension.id}
          extension={extension}
          onToggle={() => onToggle(extension.id)}
          onOpenOptions={() => onOpenOptions?.(extension.id)}
          onRemove={() => onRemove?.(extension.id)}
        />
      ))}
    </div>
  )
}
