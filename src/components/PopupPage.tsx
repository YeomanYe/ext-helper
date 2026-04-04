import * as React from "react"
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
    toggleExtension
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

  // Filter extensions based on filter
  const displayedExtensions = React.useMemo(() => {
    if (filter === "enabled") {
      return displayExtensions.filter(e => e.enabled)
    } else if (filter === "disabled") {
      return displayExtensions.filter(e => !e.enabled)
    }
    return displayExtensions
  }, [displayExtensions, filter])

  // Initialize on mount
  React.useEffect(() => {
    initializeUIStore()
    fetchExtensions()
    fetchGroups()
  }, [fetchExtensions, fetchGroups])

  const handleOpenOptions = React.useCallback(async (id: string) => {
    if (devMode) return
    try {
      await browserAdapter.openOptionsPage(id)
    } catch (err) {
      console.error("Failed to open options page:", err)
    }
  }, [devMode])

  const handleRemove = React.useCallback(async (id: string) => {
    if (devMode) return
    try {
      await browserAdapter.uninstallExtension(id)
      fetchExtensions()
    } catch (err) {
      console.error("Failed to uninstall extension:", err)
    }
  }, [devMode, fetchExtensions])

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
  const totalCount = displayExtensions.length

  // Determine grid columns based on view mode
  // Card mode: single column (full-width cards with toggle switch)
  // Compact mode: flexible horizontal layout
  const gridClass = viewMode === "card"
    ? "grid grid-cols-1 gap-2"
    : "flex flex-wrap gap-2"

  return (
    <div className="flex h-[600px] flex-col bg-punk-bg">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Tab Bar */}
      <div className="flex-shrink-0 px-3 pt-2 border-b border-punk-border/30">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("extensions")}
            className={cn(
              "px-3 py-2 text-[9px] font-punk-heading uppercase tracking-wide transition-all",
              activeTab === "extensions"
                ? "text-punk-accent border-b-2 border-punk-accent"
                : "text-punk-text-muted hover:text-punk-text-primary"
            )}
          >
            EXTENSIONS
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={cn(
              "px-3 py-2 text-[9px] font-punk-heading uppercase tracking-wide transition-all",
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
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
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
                      onRemove={() => handleRemove(ext.id)}
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
          onRemove={selectedGroup ? handleRemove : undefined}
          onDeleteGroup={selectedGroup ? deleteGroup : undefined}
          onAddExtension={selectedGroup ? addToGroup : undefined}
          onRemoveFromGroup={selectedGroup ? removeFromGroup : undefined}
          onUpdateGroup={selectedGroup ? updateGroup : undefined}
        />
      )}
    </div>
  )
}
