import { Trash2, Power, Folder } from "lucide-react"
import { cn } from "@/utils"
import type { Action, ActionType } from "@/rules/types"
import { useExtensionStore } from "@/stores/extensionStore"
import { useGroupStore } from "@/stores/groupStore"

interface ActionBuilderProps {
  actions: Action[]
  onChange: (actions: Action[]) => void
}

export function ActionBuilder({ actions, onChange }: ActionBuilderProps) {
  const { extensions } = useExtensionStore()
  const { groups } = useGroupStore()

  const addAction = (type: ActionType) => {
    // 获取第一个可用目标
    let targetId = ""
    if (type === "enableExtension" || type === "disableExtension") {
      targetId = extensions[0]?.id || ""
    } else {
      targetId = groups[0]?.id || ""
    }

    if (!targetId) return

    onChange([...actions, { type, targetId }])
  }

  const updateAction = (index: number, updates: Partial<Action>) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], ...updates }
    onChange(newActions)
  }

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index))
  }


  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <div
          key={index}
          className="flex items-center gap-2 p-2 border border-punk-border/30 bg-punk-bg"
        >
          {/* Icon */}
          <div
            className={cn(
              "p-1",
              action.type === "enableExtension" &&
                "text-punk-success bg-punk-success/5 border border-punk-success/30",
              action.type === "disableExtension" &&
                "text-punk-cta bg-punk-cta/5 border border-punk-cta/30",
              action.type === "enableGroup" &&
                "text-punk-success bg-punk-success/5 border border-punk-success/30",
              action.type === "disableGroup" &&
                "text-punk-cta bg-punk-cta/5 border border-punk-cta/30"
            )}
          >
            {action.type === "enableExtension" ||
            action.type === "enableGroup" ? (
              <Power className="h-3 w-3" />
            ) : (
              <Power className="h-3 w-3" />
            )}
          </div>

          {/* Select */}
          <select
            value={action.targetId}
            onChange={(e) => updateAction(index, { targetId: e.target.value })}
            className="punk-input flex-1 h-7 px-2 text-[8px]"
          >
            {(action.type === "enableExtension" ||
              action.type === "disableExtension") &&
              extensions.map((ext) => (
                <option key={ext.id} value={ext.id}>
                  {ext.name}
                </option>
              ))}
            {(action.type === "enableGroup" ||
              action.type === "disableGroup") &&
              groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
          </select>

          {/* Delete */}
          <button
            onClick={() => removeAction(index)}
            className="p-1 text-punk-text-muted hover:text-punk-cta transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Add Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => addAction("enableExtension")}
          disabled={extensions.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-success/30 text-punk-success/70",
            "hover:border-punk-success hover:text-punk-success",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <Power className="h-3 w-3" />
          ENABLE EXT
        </button>
        <button
          onClick={() => addAction("disableExtension")}
          disabled={extensions.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-cta/30 text-punk-cta/70",
            "hover:border-punk-cta hover:text-punk-cta",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <Power className="h-3 w-3" />
          DISABLE EXT
        </button>
        <button
          onClick={() => addAction("enableGroup")}
          disabled={groups.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-success/30 text-punk-success/70",
            "hover:border-punk-success hover:text-punk-success",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <Folder className="h-3 w-3" />
          ENABLE GRP
        </button>
        <button
          onClick={() => addAction("disableGroup")}
          disabled={groups.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-punk-heading uppercase",
            "border border-dashed border-punk-cta/30 text-punk-cta/70",
            "hover:border-punk-cta hover:text-punk-cta",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <Folder className="h-3 w-3" />
          DISABLE GRP
        </button>
      </div>

      {extensions.length === 0 && groups.length === 0 && (
        <p className="font-punk-code text-[8px] text-punk-text-muted">
          NO EXTENSIONS OR GROUPS AVAILABLE
        </p>
      )}
    </div>
  )
}
