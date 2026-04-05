import type { Extension, Group } from "@/types"
import { CreateGroupChip, GroupChip } from "@/components/group/GroupChips"

interface GroupsBarProps {
  groups: Group[]
  extensions: Extension[]
  disabled?: boolean
  onSelectGroup: (groupId: string) => void
  onToggleGroup: (group: Group) => void
  onCreateGroup: () => void
}

export function GroupsBar({
  groups,
  extensions,
  disabled = false,
  onSelectGroup,
  onToggleGroup,
  onCreateGroup
}: GroupsBarProps) {
  return (
    <div className="flex-shrink-0 px-3 py-2 border-b border-punk-border/30">
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const groupExtensions = extensions.filter((extension) => group.extensionIds.includes(extension.id))
          const count = groupExtensions.length
          const allEnabled = count > 0 && groupExtensions.every((extension) => extension.enabled)

          return (
            <GroupChip
              key={group.id}
              group={group}
              extensionCount={count}
              allEnabled={allEnabled}
              disabled={disabled}
              onClick={() => onSelectGroup(group.id)}
              onToggle={() => onToggleGroup(group)}
            />
          )
        })}

        <CreateGroupChip onClick={onCreateGroup} />
      </div>
    </div>
  )
}
