import * as React from "react"
import { X, FolderOpen, Plus } from "lucide-react"
import { ExtensionCard } from "@/components/extension"
import { cn } from "@/utils"
import type { Group, Extension, ViewMode } from "@/types"
import { Switch } from "@/components/common"

interface GroupChipProps {
  group: Group
  extensionCount: number
  onToggle: () => void
}

export function GroupChip({
  group,
  extensionCount,
  onToggle
}: GroupChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        "border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary",
        "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-primary"
      )}
    >
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: group.color }}
      />
      <span>{group.name}</span>
      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
        {extensionCount}
      </span>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={true}
          onCheckedChange={onToggle}
          className="h-4 w-8"
        />
      </div>
    </div>
  )
}

interface CreateGroupChipProps {
  onClick: () => void
}

export function CreateGroupChip({ onClick }: CreateGroupChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
        "border-2 border-dashed border-gray-300 text-gray-500",
        "hover:border-primary hover:text-primary",
        "dark:border-gray-600 dark:hover:border-primary"
      )}
    >
      <Plus className="h-3.5 w-3.5" />
      <span>新建分组</span>
    </button>
  )
}

interface GroupDetailModalProps {
  group: Group
  extensions: Extension[]
  viewMode?: ViewMode
  onClose: () => void
  onToggleExtension: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
}

export function GroupDetailModal({
  group,
  extensions,
  viewMode = "card",
  onClose,
  onToggleExtension,
  onOpenOptions,
  onRemove
}: GroupDetailModalProps) {
  // Close on escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  const gridClass = viewMode === "compact"
    ? "grid grid-cols-1 gap-2"
    : "grid grid-cols-1 gap-2"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[360px] max-h-[500px] rounded-xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: group.color }}
          />
          <h3 className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {group.name}
          </h3>
          <span className="text-xs text-gray-500">
            {extensions.length} 个扩展
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Extension List */}
        <div className={cn("p-3 max-h-[380px] overflow-y-auto", viewMode === "compact" ? "space-y-1" : "space-y-2")}>
          {extensions.length > 0 ? (
            <div className={gridClass}>
              {extensions.map((ext) => (
                <ExtensionCard
                  key={ext.id}
                  extension={ext}
                  viewMode={viewMode}
                  onToggle={() => onToggleExtension(ext.id)}
                  onOpenOptions={() => onOpenOptions?.(ext.id)}
                  onRemove={() => onRemove?.(ext.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                该分组暂无扩展
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
