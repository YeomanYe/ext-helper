import { Power, Folder, Check } from "lucide-react"
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

  // Get currently selected IDs
  const enabledExtensions = actions
    .filter(a => a.type === "enableExtension")
    .map(a => a.targetId)
  const disabledExtensions = actions
    .filter(a => a.type === "disableExtension")
    .map(a => a.targetId)
  const enabledGroups = actions
    .filter(a => a.type === "enableGroup")
    .map(a => a.targetId)
  const disabledGroups = actions
    .filter(a => a.type === "disableGroup")
    .map(a => a.targetId)

  const toggleExtensionEnable = (extId: string) => {
    if (enabledExtensions.includes(extId)) {
      // Remove from enable list
      onChange(actions.filter(a => !(a.type === "enableExtension" && a.targetId === extId)))
    } else {
      // Add to enable list, remove from disable if exists
      const newActions = actions.filter(a => !(a.type === "disableExtension" && a.targetId === extId))
      newActions.push({ type: "enableExtension", targetId: extId })
      onChange(newActions)
    }
  }

  const toggleExtensionDisable = (extId: string) => {
    if (disabledExtensions.includes(extId)) {
      // Remove from disable list
      onChange(actions.filter(a => !(a.type === "disableExtension" && a.targetId === extId)))
    } else {
      // Add to disable list, remove from enable if exists
      const newActions = actions.filter(a => !(a.type === "enableExtension" && a.targetId === extId))
      newActions.push({ type: "disableExtension", targetId: extId })
      onChange(newActions)
    }
  }

  const toggleGroupEnable = (groupId: string) => {
    if (enabledGroups.includes(groupId)) {
      onChange(actions.filter(a => !(a.type === "enableGroup" && a.targetId === groupId)))
    } else {
      const newActions = actions.filter(a => !(a.type === "disableGroup" && a.targetId === groupId))
      newActions.push({ type: "enableGroup", targetId: groupId })
      onChange(newActions)
    }
  }

  const toggleGroupDisable = (groupId: string) => {
    if (disabledGroups.includes(groupId)) {
      onChange(actions.filter(a => !(a.type === "disableGroup" && a.targetId === groupId)))
    } else {
      const newActions = actions.filter(a => !(a.type === "enableGroup" && a.targetId === groupId))
      newActions.push({ type: "disableGroup", targetId: groupId })
      onChange(newActions)
    }
  }

  return (
    <div className="space-y-3">
      {/* Extensions Section */}
      {extensions.length > 0 && (
        <div>
          <p className="font-punk-heading text-[8px] text-punk-text-muted uppercase tracking-wide mb-2">
            EXTENSIONS [{extensions.length}]
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {extensions.map((ext) => (
              <div
                key={ext.id}
                className="flex items-center gap-2 px-3 py-2 border border-punk-border/20 bg-punk-bg hover:border-punk-border/50 transition-colors"
              >
                {/* Icon */}
                <div className="h-6 w-6 border border-punk-border/30 bg-punk-bg-alt flex items-center justify-center">
                  <span className="font-punk-heading text-[8px] text-punk-text-muted">
                    {ext.name[0]}
                  </span>
                </div>

                {/* Name */}
                <span className="flex-1 font-punk-heading text-[9px] text-punk-text-primary uppercase truncate">
                  {ext.name}
                </span>

                {/* Enable Button */}
                <button
                  onClick={() => toggleExtensionEnable(ext.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-[8px] font-punk-heading uppercase transition-all",
                    enabledExtensions.includes(ext.id)
                      ? "bg-punk-success/20 border border-punk-success/50 text-punk-success"
                      : "border border-punk-border/30 text-punk-text-muted hover:border-punk-success/50 hover:text-punk-success/70"
                  )}
                >
                  <Power className="h-3 w-3" />
                  ON
                </button>

                {/* Disable Button */}
                <button
                  onClick={() => toggleExtensionDisable(ext.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-[8px] font-punk-heading uppercase transition-all",
                    disabledExtensions.includes(ext.id)
                      ? "bg-punk-cta/20 border border-punk-cta/50 text-punk-cta"
                      : "border border-punk-border/30 text-punk-text-muted hover:border-punk-cta/50 hover:text-punk-cta/70"
                  )}
                >
                  <Power className="h-3 w-3" />
                  OFF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups Section */}
      {groups.length > 0 && (
        <div>
          <p className="font-punk-heading text-[8px] text-punk-text-muted uppercase tracking-wide mb-2">
            SECTORS [{groups.length}]
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 px-3 py-2 border border-punk-border/20 bg-punk-bg hover:border-punk-border/50 transition-colors"
              >
                {/* Color indicator */}
                <div
                  className="h-6 w-6 rounded border border-punk-border/30 flex items-center justify-center"
                  style={{ backgroundColor: group.color + "20" }}
                >
                  <Folder className="h-3 w-3" style={{ color: group.color }} />
                </div>

                {/* Name */}
                <span className="flex-1 font-punk-heading text-[9px] text-punk-text-primary uppercase truncate">
                  {group.name}
                </span>

                {/* Enable Button */}
                <button
                  onClick={() => toggleGroupEnable(group.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-[8px] font-punk-heading uppercase transition-all",
                    enabledGroups.includes(group.id)
                      ? "bg-punk-success/20 border border-punk-success/50 text-punk-success"
                      : "border border-punk-border/30 text-punk-text-muted hover:border-punk-success/50 hover:text-punk-success/70"
                  )}
                >
                  <Power className="h-3 w-3" />
                  ON
                </button>

                {/* Disable Button */}
                <button
                  onClick={() => toggleGroupDisable(group.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-[8px] font-punk-heading uppercase transition-all",
                    disabledGroups.includes(group.id)
                      ? "bg-punk-cta/20 border border-punk-cta/50 text-punk-cta"
                      : "border border-punk-border/30 text-punk-text-muted hover:border-punk-cta/50 hover:text-punk-cta/70"
                  )}
                >
                  <Power className="h-3 w-3" />
                  OFF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {extensions.length === 0 && groups.length === 0 && (
        <p className="font-punk-code text-[8px] text-punk-text-muted py-4 text-center">
          NO EXTENSIONS OR SECTORS AVAILABLE
        </p>
      )}
    </div>
  )
}
