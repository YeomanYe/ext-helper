import * as React from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { cn } from "@/utils"
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
  onCreateGroup,
}: GroupsBarProps) {
  const [showMore, setShowMore] = React.useState(false)
  const [visibleCount, setVisibleCount] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const moreRef = React.useRef<HTMLDivElement>(null)

  const chipData = groups.map((group) => {
    const groupExtensions = extensions.filter((ext) => group.extensionIds.includes(ext.id))
    const count = groupExtensions.length
    const allEnabled = count > 0 && groupExtensions.every((ext) => ext.enabled)
    return { group, count, allEnabled }
  })

  // Reset measurement when group count changes
  React.useEffect(() => {
    setVisibleCount(-1)
  }, [groups.length])

  // Measure BEFORE browser paints
  React.useLayoutEffect(() => {
    if (visibleCount !== -1) return
    const container = containerRef.current
    if (!container) {
      setVisibleCount(chipData.length)
      return
    }

    const children = Array.from(container.children) as HTMLElement[]
    if (children.length <= 1) {
      setVisibleCount(chipData.length)
      return
    }

    const firstTop = children[0].offsetTop
    let secondRowTop = -1
    let thirdRowStartIndex = -1

    for (let i = 1; i < children.length; i++) {
      const top = children[i].offsetTop
      if (secondRowTop === -1 && top > firstTop) {
        secondRowTop = top
      } else if (secondRowTop !== -1 && top > secondRowTop) {
        thirdRowStartIndex = i
        break
      }
    }

    if (thirdRowStartIndex === -1) {
      setVisibleCount(chipData.length)
    } else {
      // Keep all chips that fit in 2 rows; +more button uses flex-1 to fill remaining space
      setVisibleCount(Math.max(thirdRowStartIndex, 1))
    }
  })

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!showMore) return
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMore])

  const isMeasuring = visibleCount === -1
  const needsCollapse = !isMeasuring && visibleCount < chipData.length
  const displayChips = isMeasuring ? chipData : chipData.slice(0, visibleCount)
  const overflowChips = needsCollapse ? chipData.slice(visibleCount) : []

  return (
    <div className="flex-shrink-0 px-3 py-2 border-b border-punk-border/30">
      <div ref={containerRef} className="flex flex-wrap gap-2">
        {displayChips.map(({ group, count, allEnabled }) => (
          <GroupChip
            key={group.id}
            group={group}
            extensionCount={count}
            allEnabled={allEnabled}
            disabled={disabled}
            onClick={() => onSelectGroup(group.id)}
            onToggle={() => onToggleGroup(group)}
          />
        ))}

        {(isMeasuring || !needsCollapse) && <CreateGroupChip onClick={onCreateGroup} />}

        {needsCollapse && (
          <div className="relative flex-1" ref={moreRef}>
            {/* Overflow trigger — HUD terminal style, fills remaining row space */}
            <button
              onClick={() => setShowMore((v) => !v)}
              aria-label={`Show ${overflowChips.length} more groups`}
              aria-expanded={showMore}
              className={cn(
                "group/more relative flex items-center justify-center gap-1.5 w-full h-full px-3 cursor-pointer",
                "border transition-all duration-200",
                "font-punk-code text-[12px] uppercase tracking-wider",
                showMore
                  ? "border-punk-neon-cyan/60 bg-punk-bg text-punk-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.15),inset_0_0_12px_rgba(0,255,255,0.05)]"
                  : "border-punk-border/50 bg-punk-bg-alt text-punk-text-muted hover:border-punk-neon-cyan/40 hover:text-punk-accent"
              )}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span>+{overflowChips.length}</span>
            </button>

            {/* Dropdown panel — HUD overlay */}
            {showMore && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-1.5 z-50",
                  "border border-punk-neon-cyan/30 bg-punk-bg",
                  "shadow-[0_0_20px_rgba(0,255,255,0.1),0_4px_24px_rgba(0,0,0,0.6)]"
                )}
              >
                {/* HUD corner accents */}
                <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-punk-neon-cyan/60" />
                <div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-punk-neon-cyan/60" />
                <div className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-punk-neon-cyan/60" />
                <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-punk-neon-cyan/60" />

                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-3 py-1.5 border-b border-punk-neon-cyan/15 bg-punk-neon-cyan/[0.03]">
                  <span className="font-punk-heading text-[10px] text-punk-neon-cyan/70 uppercase tracking-[0.15em]">
                    SECTORS
                  </span>
                  <span className="font-punk-code text-[10px] text-punk-text-muted">
                    {overflowChips.length + visibleCount}/{chipData.length}
                  </span>
                </div>

                {/* Overflow chips */}
                <div
                  className="p-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto"
                  style={{ width: "min(420px, calc(100vw - 24px))" }}
                >
                  {overflowChips.map(({ group, count, allEnabled }) => (
                    <GroupChip
                      key={group.id}
                      group={group}
                      extensionCount={count}
                      allEnabled={allEnabled}
                      disabled={disabled}
                      onClick={() => {
                        onSelectGroup(group.id)
                        setShowMore(false)
                      }}
                      onToggle={() => onToggleGroup(group)}
                    />
                  ))}
                </div>

                {/* Footer — NEW GROUP */}
                <div className="px-2 py-1.5 border-t border-punk-neon-cyan/15">
                  <button
                    onClick={() => {
                      onCreateGroup()
                      setShowMore(false)
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 w-full px-3 py-1.5",
                      "border border-dashed border-punk-accent/40 text-punk-accent/70",
                      "font-punk-heading text-[11px] uppercase tracking-wider",
                      "hover:border-punk-accent hover:text-punk-accent hover:bg-punk-accent/5",
                      "transition-all duration-200"
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    NEW GROUP
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
