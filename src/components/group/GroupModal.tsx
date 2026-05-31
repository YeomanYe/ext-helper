import * as React from "react"
import { ConfirmDialog } from "@/components/common"
import { GroupEditorPanel } from "@/components/group/GroupEditorPanel"
import { GroupExtensionPicker } from "@/components/group/GroupExtensionPicker"
import { GroupSuggestionDialog } from "@/components/group/GroupSuggestionDialog"
import type { Group, Extension, FilterType } from "@/types"
import { cn } from "@/utils"
import { useGroupStore } from "@/stores/groupStore"
import { showToast } from "@/stores/toastStore"
import { preferencesRepo } from "@/services/preferencesRepo"
import { suggestExtensionsForGroup } from "@/services/groupSuggestionService"
import type { AiSettings, GroupSuggestion } from "@/types"
import {
  defaultAiSettings,
  getEffectiveAiProvider,
  normalizeAiSettings,
} from "@/services/aiSettings"

interface GroupModalProps {
  group?: Group
  extensions?: Extension[]
  allExtensions?: Extension[]
  disableEnableControls?: boolean
  onClose: () => void
  onCreate?: (name: string, color: string, extensionIds: string[], iconUrl?: string) => void
  onToggleExtension?: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
  onDeleteGroup?: (id: string) => void
  onAddExtension?: (groupId: string, extId: string) => void
  onRemoveFromGroup?: (groupId: string, extId: string) => void
  onUpdateGroup?: (
    groupId: string,
    updates: { name?: string; color?: string; icon?: string; iconUrl?: string }
  ) => void
}

interface ExtensionWithStatus extends Extension {
  isInGroup: boolean
}

const getAiSuggestionErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return "AI suggestions failed"
  if (error instanceof SyntaxError || /JSON|array element/i.test(error.message)) {
    return "AI returned an unreadable response"
  }
  return error.message
}

export function GroupModal({
  group,
  extensions = [],
  allExtensions = [],
  disableEnableControls = false,
  onClose,
  onCreate,
  onToggleExtension,
  onDeleteGroup,
  onAddExtension,
  onRemoveFromGroup,
  onUpdateGroup,
}: GroupModalProps) {
  const isCreateMode = !group
  const { groups } = useGroupStore()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterType>("all")

  // IDs in any group (across all groups, not just the current one)
  const anyGroupIds = React.useMemo(() => new Set(groups.flatMap((g) => g.extensionIds)), [groups])
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [editName, setEditName] = React.useState(group?.name || "New Group")
  const [editIconUrl, setEditIconUrl] = React.useState(group?.iconUrl || "")
  const [selectedExtensions, setSelectedExtensions] = React.useState<Set<string>>(new Set())
  const [aiSettings, setAiSettings] = React.useState<AiSettings>(defaultAiSettings)
  const [aiSuggestions, setAiSuggestions] = React.useState<GroupSuggestion[]>([])
  const [selectedAiSuggestionIds, setSelectedAiSuggestionIds] = React.useState<Set<string>>(
    new Set()
  )
  const [showAiSuggestionDialog, setShowAiSuggestionDialog] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState(false)

  const groupExtensionIds = React.useMemo(
    () => new Set(group?.extensionIds || []),
    [group?.extensionIds]
  )

  const extensionsWithStatus = React.useMemo<ExtensionWithStatus[]>(
    () =>
      allExtensions.map((extension) => ({
        ...extension,
        isInGroup: isCreateMode
          ? selectedExtensions.has(extension.id)
          : groupExtensionIds.has(extension.id),
      })),
    [allExtensions, groupExtensionIds, isCreateMode, selectedExtensions]
  )

  const filteredExtensions = React.useMemo(
    () =>
      extensionsWithStatus.filter((extension) => {
        if (filter === "enabled" && !extension.enabled) return false
        if (filter === "disabled" && extension.enabled) return false
        if (filter === "in-group" && !extension.isInGroup) return false
        if (filter === "not-in-group" && extension.isInGroup) return false
        if (filter === "in-any-group" && !anyGroupIds.has(extension.id)) return false
        if (filter === "no-any-group" && anyGroupIds.has(extension.id)) return false
        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase()
        return (
          extension.name.toLowerCase().includes(query) ||
          extension.description.toLowerCase().includes(query)
        )
      }),
    [extensionsWithStatus, filter, searchQuery, anyGroupIds]
  )

  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showAiSuggestionDialog) {
          setShowAiSuggestionDialog(false)
          return
        }
        onClose()
      }
    }

    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose, showAiSuggestionDialog])

  React.useEffect(() => {
    let cancelled = false
    preferencesRepo
      .fetch()
      .then((preferences) => {
        if (!cancelled) {
          setAiSettings(normalizeAiSettings(preferences.aiSettings))
        }
      })
      .catch(() => {
        if (!cancelled) {
          showToast({ variant: "error", message: "AI settings unavailable" })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string
      if (isCreateMode) {
        setEditIconUrl(dataUrl)
        return
      }

      if (group && onUpdateGroup) {
        onUpdateGroup(group.id, { icon: "custom", iconUrl: dataUrl })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleNameCommit = () => {
    if (!group || !onUpdateGroup) return

    const nextName = editName.trim()
    if (!nextName) {
      setEditName(group.name)
      return
    }

    if (nextName !== group.name) {
      onUpdateGroup(group.id, { name: nextName })
    }
  }

  const handleToggleMembership = (extension: ExtensionWithStatus) => {
    if (isCreateMode) {
      setSelectedExtensions((previous) => {
        const next = new Set(previous)
        if (next.has(extension.id)) {
          next.delete(extension.id)
        } else {
          next.add(extension.id)
        }
        return next
      })
      return
    }

    if (!group || !onAddExtension || !onRemoveFromGroup) return
    if (extension.isInGroup) {
      onRemoveFromGroup(group.id, extension.id)
    } else {
      onAddExtension(group.id, extension.id)
    }
  }

  const suggestedExtensionIds = React.useMemo(
    () => new Set(aiSuggestions.map((suggestion) => suggestion.extensionId)),
    [aiSuggestions]
  )

  const suggestionReasons = React.useMemo(
    () =>
      new Map(
        aiSuggestions.map((suggestion) => [suggestion.extensionId, suggestion.reason] as const)
      ),
    [aiSuggestions]
  )

  const effectiveAiProvider = getEffectiveAiProvider(aiSettings)

  const handleRequestAiSuggestions = async () => {
    if (!editName.trim()) {
      showToast({ variant: "warning", message: "Name the group before requesting AI suggestions" })
      return
    }
    setAiLoading(true)
    try {
      const result = await suggestExtensionsForGroup({
        settings: aiSettings,
        groupName: editName.trim(),
        extensions: allExtensions,
        currentMemberIds: Array.from(isCreateMode ? selectedExtensions : groupExtensionIds),
      })
      if (result.suggestions.length === 0) {
        setAiSuggestions([])
        setSelectedAiSuggestionIds(new Set())
        setShowAiSuggestionDialog(false)
        showToast({ variant: "warning", message: "AI returned no matching extensions" })
        return
      }

      setAiSuggestions(result.suggestions)
      const currentMemberIds = isCreateMode ? selectedExtensions : groupExtensionIds
      setSelectedAiSuggestionIds(
        new Set(
          result.suggestions
            .map((suggestion) => suggestion.extensionId)
            .filter((extensionId) => !currentMemberIds.has(extensionId))
        )
      )
      setShowAiSuggestionDialog(true)
    } catch (error) {
      setShowAiSuggestionDialog(false)
      showToast({
        variant: "error",
        message: getAiSuggestionErrorMessage(error),
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleToggleAiSuggestion = (extensionId: string) => {
    setSelectedAiSuggestionIds((previous) => {
      const next = new Set(previous)
      if (next.has(extensionId)) {
        next.delete(extensionId)
      } else {
        next.add(extensionId)
      }
      return next
    })
  }

  const handleApplySuggestions = (suggestedIds: string[]) => {
    if (suggestedIds.length === 0) return
    if (isCreateMode) {
      setSelectedExtensions((previous) => new Set([...previous, ...suggestedIds]))
      setShowAiSuggestionDialog(false)
      setAiSuggestions([])
      setSelectedAiSuggestionIds(new Set())
      return
    }

    if (!group || !onAddExtension) return
    suggestedIds
      .filter((extensionId) => !groupExtensionIds.has(extensionId))
      .forEach((extensionId) => onAddExtension(group.id, extensionId))
    setShowAiSuggestionDialog(false)
    setAiSuggestions([])
    setSelectedAiSuggestionIds(new Set())
  }

  const handleToggleAll = (enabled: boolean) => {
    if (disableEnableControls || !onToggleExtension) return

    extensions.forEach((extension) => {
      if (extension.enabled !== enabled) {
        onToggleExtension(extension.id)
      }
    })
  }

  const handleCreate = () => {
    if (!onCreate || !editName.trim()) return
    onCreate(
      editName.trim(),
      group?.color || "#EF4444",
      Array.from(selectedExtensions),
      editIconUrl
    )
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-punk-bg/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[480px] h-[575px] border border-punk-border bg-punk-surface-raised shadow-punk-panel overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <GroupEditorPanel
          group={group}
          isCreateMode={isCreateMode}
          editName={editName}
          editIconUrl={editIconUrl}
          searchQuery={searchQuery}
          filter={filter}
          onEditNameChange={setEditName}
          onNameCommit={handleNameCommit}
          onSearchQueryChange={setSearchQuery}
          onFilterChange={setFilter}
          onImageUpload={handleImageUpload}
          onRequestAiSuggestions={handleRequestAiSuggestions}
          aiLoading={aiLoading}
          aiDisabled={effectiveAiProvider === "manual" || allExtensions.length === 0}
        />

        {!isCreateMode && (
          <GroupExtensionPicker
            extensions={extensions}
            memberExtensions={extensionsWithStatus.filter((extension) => extension.isInGroup)}
            filteredExtensions={filteredExtensions}
            disableEnableControls={disableEnableControls}
            onToggleAll={handleToggleAll}
            onToggleMembership={handleToggleMembership}
            suggestedExtensionIds={suggestedExtensionIds}
            suggestionReasons={suggestionReasons}
            onReviewSuggestions={() => setShowAiSuggestionDialog(true)}
          />
        )}

        {isCreateMode && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <GroupExtensionPicker
              extensions={extensionsWithStatus}
              filteredExtensions={filteredExtensions}
              disableEnableControls={true}
              showEnableActions={false}
              onToggleAll={() => {}}
              onToggleMembership={handleToggleMembership}
              suggestedExtensionIds={suggestedExtensionIds}
              suggestionReasons={suggestionReasons}
              onReviewSuggestions={() => setShowAiSuggestionDialog(true)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 px-4 py-2 border-t border-punk-border/30 shrink-0 mt-auto">
          {!isCreateMode && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mr-auto px-3 py-1.5 font-punk-heading text-[12px] text-punk-cta uppercase tracking-wider hover:bg-punk-cta/10 transition-colors"
            >
              DELETE
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 font-punk-heading text-[13px] text-punk-text-muted uppercase tracking-wider hover:text-punk-text-primary transition-colors"
          >
            {isCreateMode ? "CANCEL" : "CLOSE"}
          </button>
          {isCreateMode && (
            <button
              onClick={handleCreate}
              disabled={!editName.trim()}
              className={cn(
                "px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider transition-colors",
                editName.trim()
                  ? "bg-punk-primary text-white hover:bg-punk-primary/80"
                  : "bg-punk-border/50 text-punk-text-muted cursor-not-allowed"
              )}
            >
              CONFIRM
            </button>
          )}
        </div>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title={`DELETE "${group?.name || "GROUP"}"?`}
          message="This action cannot be undone."
          confirmText="DELETE"
          variant="danger"
          onConfirm={() => {
            if (group && onDeleteGroup) {
              onDeleteGroup(group.id)
              onClose()
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
        <GroupSuggestionDialog
          isOpen={showAiSuggestionDialog}
          groupName={editName.trim() || "New Group"}
          suggestions={aiSuggestions}
          extensions={allExtensions}
          currentMemberIds={isCreateMode ? selectedExtensions : groupExtensionIds}
          selectedIds={selectedAiSuggestionIds}
          onToggleSelection={handleToggleAiSuggestion}
          onConfirm={handleApplySuggestions}
          onCancel={() => setShowAiSuggestionDialog(false)}
        />
      </div>
    </div>
  )
}
