import * as React from "react"
import { SearchBar, MAIN_FILTERS, ExtensionsActionsMenu, BisectBanner } from "@/components/popup"
import { ExtensionCard } from "@/components/extension"
import { GroupModal, GroupsBar } from "@/components/group"
import { useExtensionStore, useFilteredExtensions, useGroupStore, useUIStore } from "@/stores"
import { browserAdapter } from "@/services/browser/adapter"
import { isDevMode } from "@/services/mockData"
import { cn } from "@/utils"
import type { Group } from "@/types"

export function ExtensionsTab() {
  // Stable actions (never change — defined at store creation)
  const fetchExtensions = useExtensionStore((s) => s.fetchExtensions)
  const toggleExtension = useExtensionStore((s) => s.toggleExtension)
  const removeExtension = useExtensionStore((s) => s.removeExtension)
  const setExtensionsEnabled = useExtensionStore((s) => s.setExtensionsEnabled)
  const undoExtensions = useExtensionStore((s) => s.undoExtensions)
  const redoExtensions = useExtensionStore((s) => s.redoExtensions)
  const startBisect = useExtensionStore((s) => s.startBisect)
  const markBisectGood = useExtensionStore((s) => s.markBisectGood)
  const markBisectBad = useExtensionStore((s) => s.markBisectBad)
  const cancelBisect = useExtensionStore((s) => s.cancelBisect)
  const finishBisectRestore = useExtensionStore((s) => s.finishBisectRestore)
  const setSearchQuery = useExtensionStore((s) => s.setSearchQuery)
  const setFilter = useExtensionStore((s) => s.setFilter)

  // Values that trigger UI updates
  const error = useExtensionStore((s) => s.error)
  const searchQuery = useExtensionStore((s) => s.searchQuery)
  const filter = useExtensionStore((s) => s.filter)
  const canUndo = useExtensionStore((s) => s.canUndo)
  const canRedo = useExtensionStore((s) => s.canRedo)
  const undoCount = useExtensionStore((s) => s.undoCount)
  const redoCount = useExtensionStore((s) => s.redoCount)
  const bisectSession = useExtensionStore((s) => s.bisectSession)

  const groups = useGroupStore((s) => s.groups)
  const createGroup = useGroupStore((s) => s.createGroup)
  const addToGroup = useGroupStore((s) => s.addToGroup)
  const removeFromGroup = useGroupStore((s) => s.removeFromGroup)
  const updateGroup = useGroupStore((s) => s.updateGroup)
  const deleteGroup = useGroupStore((s) => s.deleteGroup)

  const viewMode = useUIStore((s) => s.viewMode)

  const filteredExtensions = useFilteredExtensions()
  const devMode = isDevMode()

  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = React.useState(false)

  const selectedGroup = React.useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [selectedGroupId, groups]
  )

  const selectedGroupExtensions = React.useMemo(() => {
    if (!selectedGroup) return []
    return useExtensionStore
      .getState()
      .extensions.filter((ext) => selectedGroup.extensionIds.includes(ext.id))
  }, [selectedGroup])

  const bisectResultExtension = React.useMemo(
    () =>
      bisectSession.resultId
        ? (useExtensionStore.getState().extensions.find((e) => e.id === bisectSession.resultId) ??
          null)
        : null,
    [bisectSession.resultId]
  )

  const isBisectActive = bisectSession.active
  const isBisectResolved = bisectSession.phase === "resolved"

  // Stable callbacks — read latest state via getState() to avoid stale closures
  const handleOpenOptions = React.useCallback(
    async (id: string) => {
      const ext = useExtensionStore.getState().extensions.find((e) => e.id === id)
      if (!ext?.optionsUrl) return
      if (devMode) {
        window.open(ext.optionsUrl, "_blank")
        return
      }
      try {
        await browserAdapter.openOptionsPage(ext.optionsUrl)
      } catch (err) {
        console.error("Failed to open options page:", err)
      }
    },
    [devMode]
  )

  const handleRemoveExtension = React.useCallback(
    async (id: string) => {
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
    },
    [devMode, fetchExtensions, removeExtension]
  )

  const handleToggleExtension = React.useCallback(
    (id: string) => {
      if (useExtensionStore.getState().bisectSession.active) return
      toggleExtension(id)
    },
    [toggleExtension]
  )

  const handleToggleGroup = React.useCallback(
    (group: Group) => {
      const { extensions, bisectSession: session } = useExtensionStore.getState()
      if (session.active) return
      const groupExtensions = extensions.filter((ext) => group.extensionIds.includes(ext.id))
      if (groupExtensions.length === 0) return
      const shouldEnableAll = groupExtensions.some((ext) => !ext.enabled)
      void setExtensionsEnabled(
        groupExtensions.map((ext) => ext.id),
        shouldEnableAll
      )
    },
    [setExtensionsEnabled]
  )

  const enabledCount = filteredExtensions.filter((e) => e.enabled).length
  const totalExtensionsEnabled = useExtensionStore(
    (s) => s.extensions.filter((e) => e.enabled).length
  )

  const gridClass =
    viewMode === "card"
      ? "flex flex-wrap gap-2"
      : viewMode === "compact"
        ? "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2"
        : "flex flex-col gap-2"

  return (
    <>
      {/* Tab Controls Row */}
      <ExtensionsActionsMenu
        enabledExtensionCount={totalExtensionsEnabled}
        isBisectActive={isBisectActive}
        isBisectResolved={isBisectResolved}
        canUndo={canUndo}
        canRedo={canRedo}
        undoCount={undoCount}
        redoCount={redoCount}
        onStartBisect={() => void startBisect()}
        onBisectGood={() => void markBisectGood()}
        onBisectBad={() => void markBisectBad()}
        onCancelBisect={() => void cancelBisect()}
        onEnableAll={() =>
          void setExtensionsEnabled(
            filteredExtensions.map((ext) => ext.id),
            true
          )
        }
        onDisableAll={() =>
          void setExtensionsEnabled(
            filteredExtensions.map((ext) => ext.id),
            false
          )
        }
        onUndo={() => void undoExtensions()}
        onRedo={() => void redoExtensions()}
      />

      {/* Search */}
      <div className="flex-shrink-0 p-3 border-b border-punk-border/30">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          activeFilter={filter}
          onFilterChange={setFilter}
          filters={MAIN_FILTERS}
        />
      </div>

      <BisectBanner
        bisectSession={bisectSession}
        resultExtension={bisectResultExtension}
        onGood={() => void markBisectGood()}
        onBad={() => void markBisectBad()}
        onCancel={() => void cancelBisect()}
        onRestore={() => void finishBisectRestore()}
      />

      <GroupsBar
        groups={groups}
        extensions={useExtensionStore.getState().extensions}
        disabled={isBisectActive}
        onSelectGroup={setSelectedGroupId}
        onToggleGroup={handleToggleGroup}
        onCreateGroup={() => setShowCreateModal(true)}
      />

      {/* Extension List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3" data-extension-surface="true">
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
            {filteredExtensions.map((ext) => (
              <ExtensionCard
                key={ext.id}
                extension={ext}
                viewMode={viewMode}
                disableEnableControls={isBisectActive}
                disableRemove={isBisectActive}
                onToggle={handleToggleExtension}
                onOpenOptions={handleOpenOptions}
                onRemove={handleRemoveExtension}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer counts slot */}
      <div className="sr-only" data-enabled-count={enabledCount} />

      {/* Group Modal */}
      {(selectedGroup || showCreateModal) && (
        <GroupModal
          group={selectedGroup ?? undefined}
          extensions={selectedGroup ? selectedGroupExtensions : undefined}
          allExtensions={useExtensionStore.getState().extensions}
          onClose={() => {
            setSelectedGroupId(null)
            setShowCreateModal(false)
          }}
          onCreate={
            showCreateModal
              ? async (name, color, extensionIds, iconUrl) => {
                  await createGroup(name, color, extensionIds)
                  if (iconUrl) {
                    const latestGroup = useGroupStore.getState().groups.at(-1)
                    if (latestGroup) {
                      updateGroup(latestGroup.id, { icon: "custom", iconUrl })
                    }
                  }
                }
              : undefined
          }
          disableEnableControls={isBisectActive}
          onToggleExtension={selectedGroup && !isBisectActive ? handleToggleExtension : undefined}
          onOpenOptions={selectedGroup ? handleOpenOptions : undefined}
          onRemove={selectedGroup && !isBisectActive ? handleRemoveExtension : undefined}
          onDeleteGroup={selectedGroup ? deleteGroup : undefined}
          onAddExtension={selectedGroup ? addToGroup : undefined}
          onRemoveFromGroup={selectedGroup ? removeFromGroup : undefined}
          onUpdateGroup={selectedGroup ? updateGroup : undefined}
        />
      )}
    </>
  )
}
