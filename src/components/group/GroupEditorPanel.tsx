import * as React from "react"
import { Folder, Image, Upload } from "lucide-react"
import { SearchBar } from "@/components/popup"
import type { FilterType, Group } from "@/types"
import { GROUP_ICON_MAP } from "./groupVisuals"

interface GroupEditorPanelProps {
  group?: Group
  isCreateMode: boolean
  editName: string
  editIconUrl: string
  searchQuery: string
  filter: FilterType
  onEditNameChange: (value: string) => void
  onNameCommit: () => void
  onSearchQueryChange: (value: string) => void
  onFilterChange: (filter: FilterType) => void
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function GroupEditorPanel({
  group,
  isCreateMode,
  editName,
  editIconUrl,
  searchQuery,
  filter,
  onEditNameChange,
  onNameCommit,
  onSearchQueryChange,
  onFilterChange,
  onImageUpload
}: GroupEditorPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const groupIcon = group?.iconUrl ? null : GROUP_ICON_MAP[group?.icon || "folder"] || <Folder className="w-4 h-4" />

  return (
    <div className="flex gap-3 px-4 py-2 border-b border-punk-border/30 bg-punk-bg shrink-0">
      <div className="flex-shrink-0 flex items-center">
        {isCreateMode ? (
          <div
            className="relative w-[72px] h-[72px] border border-punk-border/50 bg-punk-bg rounded overflow-hidden group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {editIconUrl ? (
              <>
                <img src={editIconUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-punk-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer p-2 text-punk-text-muted hover:text-punk-accent transition-colors">
                    <Upload className="h-5 w-5" />
                  </label>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Image className="h-6 w-6 text-punk-text-muted mb-1" />
                <span className="text-[10px] text-punk-text-muted uppercase">UPLOAD</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative w-[72px] h-[72px] border border-punk-border/50 bg-punk-bg rounded overflow-hidden group">
            {group?.iconUrl ? (
              <>
                <img src={group.iconUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-punk-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer p-2 text-punk-text-muted hover:text-punk-accent transition-colors">
                    <Upload className="h-5 w-5" />
                    <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-punk-bg-alt transition-colors"
                  style={{ color: group?.color }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {groupIcon}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block font-punk-heading text-[13px] text-punk-text-muted uppercase mb-1">
              GROUP_NAME
            </label>
            <input
              type="text"
              value={editName}
              onChange={(event) => onEditNameChange(event.target.value)}
              onBlur={isCreateMode ? undefined : onNameCommit}
              onKeyDown={(event) => {
                if (!isCreateMode && event.key === "Enter") {
                  onNameCommit()
                  event.currentTarget.blur()
                }
              }}
              placeholder="e.g., Work Extensions"
              className="punk-input w-full h-10 px-3 text-sm"
            />
          </div>
        </div>

        <label className="block font-punk-heading text-[13px] text-punk-text-muted uppercase">
          SEARCH & FILTER
        </label>
        <SearchBar
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="SEARCH_EXTENSIONS..."
          activeFilter={filter}
          onFilterChange={onFilterChange}
        />
      </div>
    </div>
  )
}
