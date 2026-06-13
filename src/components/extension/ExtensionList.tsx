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
  loading,
}: ExtensionListProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 border border-punk-border/30 bg-punk-surface-raised p-3"
          >
            <div className="h-12 w-12 bg-punk-surface-soft" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-punk-surface-soft" />
              <div className="h-3 w-1/2 bg-punk-surface-soft" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (extensions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-punk-text-muted" />
        <h3 className="mt-4 text-sm font-medium text-punk-text-primary">No extensions found</h3>
        <p className="mt-1 text-xs text-punk-text-muted">No extensions match your search</p>
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
