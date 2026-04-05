import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Header, Footer, SearchBar } from "@/components/popup"
import { ExtensionCard } from "@/components/extension"
import { GroupChip, CreateGroupChip, GroupModal } from "@/components/group"
import { RuleManager } from "@/components/rules"
import {
  useExtensionStore,
  useFilteredExtensions,
  useGroupStore,
  useUIStore,
  initializeUIStore
} from "@/stores"
import { browserAdapter } from "@/services/browser/adapter"
import { isDevMode } from "@/services/mockData"
import { cn } from "@/utils"

type TabType = "extensions" | "rules"

export function PopupPage() {
  const {
    error,
    searchQuery,
    filter,
    extensions,
    setSearchQuery,
    setFilter,
    fetchExtensions,
    toggleExtension,
    removeExtension,
    setExtensionsEnabled,
    undoExtensions,
    redoExtensions,
    bisectExtensions,
    canUndo,
    canRedo
  } = useExtensionStore()

  const {
    groups,
    fetchGroups,
    createGroup,
    addToGroup,
    removeFromGroup,
    updateGroup,
    deleteGroup
  } = useGroupStore()

  const {
    viewMode,
    setViewMode
  } = useUIStore()

  const filteredExtensions = useFilteredExtensions()
  const devMode = isDevMode()

  // Tab state
  const [activeTab, setActiveTab] = React.useState<TabType>("extensions")

  // Use store data (stores use devStorage in dev mode)
  const displayExtensions = extensions
  const displayGroups = groups

  // Modal state
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [showTabActions, setShowTabActions] = React.useState(false)
  const tabActionsRef = React.useRef<HTMLDivElement>(null)

  // Get selected group
  const selectedGroup = React.useMemo(() => {
    if (!selectedGroupId) return null
    return displayGroups.find(g => g.id === selectedGroupId) || null
  }, [selectedGroupId, displayGroups])

  // Get extensions in selected group
  const selectedGroupExtensions = React.useMemo(() => {
    if (!selectedGroup) return []
    return displayExtensions.filter(ext => selectedGroup.extensionIds.includes(ext.id))
  }, [selectedGroup, displayExtensions])

  const displayedExtensions = filteredExtensions

  // Initialize on mount
  React.useEffect(() => {
    initializeUIStore()
    fetchExtensions()
    fetchGroups()
  }, [fetchExtensions, fetchGroups])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tabActionsRef.current && !tabActionsRef.current.contains(event.target as Node)) {
        setShowTabActions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpenOptions = React.useCallback(async (id: string) => {
    if (devMode) return
    try {
      await browserAdapter.openOptionsPage(id)
    } catch (err) {
      console.error("Failed to open options page:", err)
    }
  }, [devMode])

  const handleRemoveExtension = React.useCallback(async (id: string) => {
    if (devMode) {
      await removeExtension(id)
      return
    }
    try {
      await browserAdapter.uninstallExtension(id)
      fetchExtensions()
    } catch (err) {
      console.error("Failed to uninstall extension:", err)
    }
  }, [devMode, fetchExtensions, removeExtension])

  const handleToggleExtension = React.useCallback((id: string) => {
    toggleExtension(id)
  }, [toggleExtension])

  // Toggle all extensions in a group
  const handleToggleGroup = React.useCallback((group: typeof displayGroups[0]) => {
    const groupExtIds = group.extensionIds
    groupExtIds.forEach(id => {
      toggleExtension(id)
    })
  }, [toggleExtension])

  const enabledCount = displayedExtensions.filter((e) => e.enabled).length
  const totalCount = displayedExtensions.length

  // Determine grid columns based on view mode
  // Card mode: single column (full-width cards with toggle switch)
  // Compact mode: CSS grid with auto-fill to fill screen width
  // Detail mode: single column stacked layout
  const gridClass = viewMode === "card"
    ? "grid grid-cols-1 gap-2"
    : viewMode === "compact"
      ? "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2"
      : "flex flex-col gap-2"

  return (
    <div className="flex h-[600px] flex-col bg-punk-bg">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Tab Bar */}
      <div className="flex-shrink-0 px-3 pt-2 border-b border-punk-border/30">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("extensions")}
            className={cn(
              "px-3 py-2 text-[13px] font-punk-heading uppercase tracking-wider transition-all",
              activeTab === "extensions"
                ? "text-punk-accent border-b-2 border-punk-accent"
                : "text-punk-text-muted hover:text-punk-text-primary"
            )}
          >
            EXTENSIONS
          </button>
          {activeTab === "extensions" && (
            <div className="relative" ref={tabActionsRef}>
              <button
                onClick={() => setShowTabActions((value) => !value)}
                className="flex h-8 items-center gap-1 border border-punk-border/30 bg-punk-bg-alt px-2 text-[11px] font-punk-heading uppercase tracking-wider text-punk-text-muted transition-all hover:border-punk-accent/50 hover:text-punk-accent"
              >
                ACTIONS
                <ChevronDown className={cn("h-3 w-3 transition-transform", showTabActions && "rotate-180")} />
              </button>
              {showTabActions && (
                <div className="absolute left-0 top-full z-50 mt-1 w-40 border border-punk-border bg-punk-bg-alt shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                  <button
                    onClick={() => {
                      void setExtensionsEnabled(displayedExtensions.map((ext) => ext.id), true)
                      setShowTabActions(false)
                    }}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary"
                  >
                    全部启用
                  </button>
                  <button
                    onClick={() => {
                      void setExtensionsEnabled(displayedExtensions.map((ext) => ext.id), false)
                      setShowTabActions(false)
                    }}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary"
                  >
                    全部禁用
                  </button>
                  <button
                    onClick={() => {
                      void undoExtensions()
                      setShowTabActions(false)
                    }}
                    disabled={!canUndo}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    撤销
                  </button>
                  <button
                    onClick={() => {
                      void redoExtensions()
                      setShowTabActions(false)
                    }}
                    disabled={!canRedo}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    反撤销
                  </button>
                  <button
                    onClick={() => {
                      void bisectExtensions(displayedExtensions.map((ext) => ext.id))
                      setShowTabActions(false)
                    }}
                    disabled={displayedExtensions.length < 2}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    二分查找
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setActiveTab("rules")}
            className={cn(
              "px-3 py-2 text-[13px] font-punk-heading uppercase tracking-wider transition-all",
              activeTab === "rules"
                ? "text-punk-accent border-b-2 border-punk-accent"
                : "text-punk-text-muted hover:text-punk-text-primary"
            )}
          >
            RULES
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === "extensions" ? (
          <>
            {/* Search */}
            <div className="flex-shrink-0 p-3 border-b border-punk-border/30">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                activeFilter={filter}
                onFilterChange={setFilter}
              />
            </div>

            {/* Group Chips */}
            <div className="flex-shrink-0 px-3 py-2 border-b border-punk-border/30">
              <div className="flex flex-wrap gap-2">
                {/* Group chips */}
                {displayGroups.map((group) => {
                  const count = displayExtensions.filter(ext => group.extensionIds.includes(ext.id)).length
                  return (
                    <GroupChip
                      key={group.id}
                      group={group}
                      extensionCount={count}
                      onClick={() => setSelectedGroupId(group.id)}
                      onToggle={() => handleToggleGroup(group)}
                    />
                  )
                })}

                {/* Create group chip */}
                <CreateGroupChip onClick={() => setShowCreateModal(true)} />
              </div>
            </div>

            {/* Extension List */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-3"
              data-extension-surface="true"
            >
              {error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="font-punk-body text-base text-punk-cta">ERROR: {error}</p>
                  <button
                    onClick={() => fetchExtensions()}
                    className="mt-3 font-punk-btn px-4 py-2 punk-btn-primary"
                  >
                    RETRY
                  </button>
                </div>
              ) : (
                <div className={gridClass}>
                  {displayedExtensions.map((ext) => (
                    <ExtensionCard
                      key={ext.id}
                      extension={ext}
                      viewMode={viewMode}
                      onToggle={() => handleToggleExtension(ext.id)}
                      onOpenOptions={() => handleOpenOptions(ext.id)}
                      onRemove={() => handleRemoveExtension(ext.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Rules Panel */
          <RuleManager />
        )}
      </div>

      <Footer totalCount={totalCount} enabledCount={enabledCount} />

      {/* Unified Group Modal */}
      {(selectedGroup || showCreateModal) && (
        <GroupModal
          group={selectedGroup ?? undefined}
          extensions={selectedGroup ? selectedGroupExtensions : undefined}
          allExtensions={displayExtensions}
          onClose={() => {
            setSelectedGroupId(null)
            setShowCreateModal(false)
          }}
          onCreate={showCreateModal ? async (name, color, extensionIds, iconUrl) => {
            await createGroup(name, color)
            // Get fresh groups from store after state update
            const latestGroups = useGroupStore.getState().groups
            const latestGroup = latestGroups[latestGroups.length - 1]
            if (latestGroup) {
              // Add selected extensions to the new group
              if (extensionIds.length > 0) {
                extensionIds.forEach(extId => {
                  addToGroup(latestGroup.id, extId)
                })
              }
              // Update icon if provided
              if (iconUrl) {
                updateGroup(latestGroup.id, { icon: "custom", iconUrl })
              }
              // Keep the new group highlighted after creation
              setSelectedGroupId(latestGroup.id)
            }
          } : undefined}
          onToggleExtension={selectedGroup ? handleToggleExtension : undefined}
          onOpenOptions={selectedGroup ? handleOpenOptions : undefined}
          onRemove={selectedGroup ? handleRemoveExtension : undefined}
          onDeleteGroup={selectedGroup ? deleteGroup : undefined}
          onAddExtension={selectedGroup ? addToGroup : undefined}
          onRemoveFromGroup={selectedGroup ? removeFromGroup : undefined}
          onUpdateGroup={selectedGroup ? updateGroup : undefined}
        />
      )}
    </div>
  )
}
