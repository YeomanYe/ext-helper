export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown'

export interface Extension {
  id: string
  name: string
  description: string
  version: string
  versionName: string | null
  enabled: boolean
  iconUrl: string | null
  type: 'extension' | 'hosted_app' | 'packaged_app' | 'legacy_packaged_app' | 'theme'
  permissions: string[]
  hostPermissions: string[]
  installType: 'admin' | 'development' | 'normal' | 'sideload' | 'other'
  mayEnable: boolean
  mayDisable: boolean
  disabledReason: 'unknown' | 'permissions_increase' | null
  offlineEnabled: boolean
  optionsUrl: string | null
  homepageUrl: string | null
  updateUrl: string | null
}

export interface Group {
  id: string
  name: string
  color: string
  icon: string
  iconUrl?: string
  extensionIds: string[]
  createdAt: number
  updatedAt: number
  isExpanded: boolean
  order: number
}

export type FilterType = 'all' | 'enabled' | 'disabled' | 'favorites'
export type SortType = 'name' | 'enabled' | 'recentlyUsed'
export type ViewMode = 'compact' | 'card' | 'detail'
export type BisectPhase = 'idle' | 'running' | 'resolved' | 'cancelled'

export interface BisectSession {
  active: boolean
  phase: BisectPhase
  baselineExtensions: Extension[]
  allCandidateIds: string[]
  candidateIds: string[]
  currentTestIds: string[]
  parkedIds: string[]
  step: number
  resultId?: string
  resultIds?: string[]
}

export interface Preferences {
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
  showDisabled: boolean
  sortBy: SortType
  viewMode: ViewMode
}

export interface ExtensionStore {
  extensions: Extension[]
  loading: boolean
  error: string | null
  filter: FilterType
  searchQuery: string
  sortBy: SortType
  canUndo: boolean
  canRedo: boolean
  undoCount: number
  redoCount: number
  bisectSession: BisectSession
  fetchExtensions: () => Promise<void>
  toggleExtension: (id: string) => Promise<void>
  removeExtension: (id: string) => Promise<void>
  setExtensionsEnabled: (ids: string[], enabled: boolean) => Promise<void>
  undoExtensions: () => Promise<void>
  redoExtensions: () => Promise<void>
  startBisect: () => Promise<void>
  markBisectGood: () => Promise<void>
  markBisectBad: () => Promise<void>
  cancelBisect: () => Promise<void>
  finishBisectRestore: () => Promise<void>
  setFilter: (filter: FilterType) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: SortType) => void
}

export interface GroupStore {
  groups: Group[]
  activeGroupId: string | null
  expandedGroups: Set<string>
  draggedExtensionId: string | null
  fetchGroups: () => Promise<void>
  createGroup: (name: string, color?: string) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  renameGroup: (id: string, name: string) => Promise<void>
  updateGroup: (id: string, updates: { name?: string; color?: string; icon?: string; iconUrl?: string }) => Promise<void>
  selectGroup: (id: string | null) => void
  toggleGroupExpanded: (id: string) => void
  addToGroup: (groupId: string, extId: string) => Promise<void>
  removeFromGroup: (groupId: string, extId: string) => Promise<void>
  setDraggedExtension: (id: string | null) => void
}

export interface UIStore {
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
  showDisabled: boolean
  viewMode: ViewMode
  lastUpdate: number
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleCompactMode: () => void
  toggleShowDisabled: () => void
  setViewMode: (mode: ViewMode) => void
}

// Re-export rule types
export type {
  Rule,
  Condition,
  Action,
  DomainCondition,
  ScheduleCondition,
  MatchMode,
  ConditionOperator,
  ActionType,
  RuleStore,
  RuleSettings,
} from "@/rules/types"
export { DAYS_OF_WEEK, MATCH_MODES } from "@/rules/types"
