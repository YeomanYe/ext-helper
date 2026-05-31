import * as React from "react"
import {
  X,
  LayoutGrid,
  List,
  ChevronDown,
  FileText,
  Settings,
  Upload,
  Download,
  Bot,
  BrainCircuit,
  Check,
  Cloud,
  Cpu,
  Network,
  Orbit,
  KeyRound,
  Loader2,
  Moon,
  Router,
  Server,
  Sparkles,
  Sun,
  Monitor,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/utils"
import { isDevMode } from "@/services/mockData"
import { browserAdapter } from "@/services/browser/adapter"
import { preferencesRepo } from "@/services/preferencesRepo"
import { detectChromeLocalAiStatus, testAiProvider } from "@/services/aiProvider"
import { useUIStore } from "@/stores/uiStore"
import { defaultAiSettings, normalizeAiSettings } from "@/services/aiSettings"
import {
  getModelProviderPresetForSettings,
  modelProviderPresets,
  type ModelProviderPreset,
} from "@/services/modelProviders"
import type { AiSettings, FilterType, Preferences, ViewMode } from "@/types"

function useExtensionVersion(): string {
  const [version, setVersion] = React.useState("1.0.0")
  React.useEffect(() => {
    if (!isDevMode()) {
      const v = browserAdapter.getManifestVersion()
      if (v) setVersion(v)
    }
  }, [])
  return version
}

export const BASE_FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "enabled", label: "ON" },
  { value: "disabled", label: "OFF" },
]

export const MAIN_FILTERS: { value: FilterType; label: string }[] = [
  ...BASE_FILTERS,
  { value: "in-group", label: "IN_GRP" },
  { value: "not-in-group", label: "NO_GRP" },
]

export const GROUP_PANEL_FILTERS: { value: FilterType; label: string }[] = [
  ...BASE_FILTERS,
  { value: "in-group", label: "IN_CUR" },
  { value: "not-in-group", label: "NOT_CUR" },
  { value: "in-any-group", label: "ANY_GRP" },
  { value: "no-any-group", label: "NO_GRP" },
]

export const ACTION_FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "in-rule", label: "SELECTED" },
  { value: "no-rule", label: "UNSELECT" },
]

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  activeFilter?: FilterType
  onFilterChange?: (filter: FilterType) => void
  filters?: { value: FilterType; label: string }[]
}

export function SearchBar({
  value,
  onChange,
  placeholder = "SEARCH_EXTENSIONS...",
  activeFilter = "all",
  onFilterChange,
  filters = BASE_FILTERS,
}: SearchBarProps) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [dropUp, setDropUp] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < filters.length * 36 + 8)
    }
    setShowDropdown((v) => !v)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Filter Select */}
      {onFilterChange && (
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={handleToggle}
            className={cn(
              "flex items-center gap-2 px-3 h-11",
              "border border-punk-border/50 bg-punk-surface-raised",
              "font-punk-heading text-[13px] uppercase tracking-wider",
              "text-punk-text-primary",
              "hover:border-punk-primary hover:shadow-punk-hard",
              "transition-all duration-200"
            )}
          >
            {/* Grid-stack: all labels occupy same cell, width = widest rendered label */}
            <span className="inline-grid">
              {filters.map((f) => (
                <span
                  key={f.value}
                  className={cn(
                    "col-start-1 row-start-1",
                    f.value !== activeFilter && "invisible select-none"
                  )}
                  aria-hidden={f.value !== activeFilter ? "true" : undefined}
                >
                  {f.label}
                </span>
              ))}
            </span>
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", showDropdown && "rotate-180")}
            />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div
                className={cn(
                  "absolute left-0 z-50 min-w-full border border-punk-border bg-punk-surface-raised shadow-punk-panel",
                  dropUp ? "bottom-full mb-1" : "top-full mt-1"
                )}
              >
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      onFilterChange(filter.value)
                      setShowDropdown(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider",
                      "transition-all duration-150",
                      activeFilter === filter.value
                        ? "bg-punk-primary/12 text-punk-primary"
                        : "text-punk-text-secondary hover:bg-punk-surface-soft hover:text-punk-text-primary"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-punk-body text-punk-accent text-lg">
          $
        </span>
        <input
          id="extension-search"
          name="extension-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "punk-input h-11 w-full pl-9 pr-10 text-punk-text-primary",
            "font-punk-body text-sm placeholder:text-punk-text-muted"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-punk-text-muted hover:text-punk-accent transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

interface QuickFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function QuickFilters({ activeFilter, onFilterChange }: QuickFiltersProps) {
  return (
    <div className="flex gap-1">
      {MAIN_FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "punk-btn px-3 py-1.5 transition-all duration-200",
            activeFilter === filter.value
              ? "punk-btn-primary"
              : "bg-punk-surface-raised text-punk-text-secondary hover:text-punk-primary border border-punk-primary/30 hover:border-punk-primary"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

const VIEW_MODES: { mode: ViewMode; icon: LucideIcon; label: string }[] = [
  { mode: "compact", icon: LayoutGrid, label: "GRID" },
  { mode: "card", icon: List, label: "CARD" },
  { mode: "detail", icon: FileText, label: "DETAIL" },
]

const AI_MODE_OPTIONS: { value: AiSettings["provider"]; label: string; detail: string }[] = [
  {
    value: "chrome-local",
    label: "CHROME LOCAL",
    detail: "Use Chrome's local Prompt API without an API key.",
  },
  {
    value: "openai-compatible",
    label: "CUSTOM PROVIDER",
    detail: "Use a cloud or self-hosted OpenAI/Anthropic-compatible provider.",
  },
  {
    value: "manual",
    label: "MANUAL",
    detail: "Disable AI calls. Group suggestions remain unavailable.",
  },
]

interface PunkSelectOption<T extends string> {
  value: T
  label: string
  detail?: string
  icon?: React.ReactNode
}

function PunkSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: PunkSelectOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
}) {
  const [open, setOpen] = React.useState(false)
  const [dropUp, setDropUp] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < Math.min(options.length, 6) * 48 + 8)
    }
    setOpen((current) => !current)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={handleToggle}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-3 px-3",
          "border border-punk-border/50 bg-punk-surface-raised",
          "font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-primary",
          "transition-all duration-200 hover:border-punk-primary hover:shadow-punk-hard"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected.icon}
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute left-0 z-[90] max-h-72 w-full overflow-y-auto border border-punk-border bg-punk-surface-raised shadow-punk-panel",
              dropUp ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left",
                  "font-punk-heading text-[13px] uppercase tracking-wider transition-all duration-150",
                  option.value === value
                    ? "bg-punk-primary/12 text-punk-primary"
                    : "text-punk-text-secondary hover:bg-punk-surface-soft hover:text-punk-text-primary"
                )}
              >
                {option.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.detail && (
                    <span className="block truncate font-punk-body text-[10px] normal-case tracking-normal opacity-70">
                      {option.detail}
                    </span>
                  )}
                </span>
                {option.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const providerIconConfig: Record<string, { icon: LucideIcon; className: string }> = {
  openai: { icon: Sparkles, className: "text-punk-success" },
  anthropic: { icon: BrainCircuit, className: "text-punk-accent" },
  azure: { icon: Cloud, className: "text-punk-primary" },
  bytedance: { icon: Sparkles, className: "text-punk-cta" },
  google: { icon: Cloud, className: "text-punk-neon-cyan" },
  glm: { icon: BrainCircuit, className: "text-punk-success" },
  ollama: { icon: Server, className: "text-punk-text-primary" },
  openrouter: { icon: Router, className: "text-punk-primary" },
  deepseek: { icon: Orbit, className: "text-punk-neon-cyan" },
  siliconflow: { icon: Network, className: "text-punk-accent" },
  modelscope: { icon: Network, className: "text-punk-neon-cyan" },
  minimax: { icon: BrainCircuit, className: "text-punk-accent" },
  novita: { icon: Orbit, className: "text-punk-cta" },
  qiniu: { icon: Cloud, className: "text-punk-success" },
  qwen: { icon: Cpu, className: "text-punk-primary" },
  kimi: { icon: Sparkles, className: "text-punk-cta" },
  vercel: { icon: Router, className: "text-punk-text-primary" },
}

function ProviderIcon({ preset }: { preset: ModelProviderPreset }) {
  const config = providerIconConfig[preset.logoName] ?? {
    icon: Bot,
    className: "text-punk-text-muted",
  }
  const Icon = config.icon
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-punk-border/50 bg-punk-surface-inset">
      <Icon className={cn("h-3.5 w-3.5", config.className)} />
    </span>
  )
}

function PunkCombobox({
  value,
  suggestions,
  onChange,
  placeholder,
  ariaLabel,
  invalid,
}: {
  value: string
  suggestions: string[]
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  invalid?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [dropUp, setDropUp] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const uniqueSuggestions = React.useMemo(() => Array.from(new Set(suggestions)), [suggestions])
  const isActive = open || focused

  const handleOpen = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < Math.min(uniqueSuggestions.length, 5) * 36 + 8)
    }
    setOpen(true)
  }

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", open && "z-[90]")}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false)
          setOpen(false)
        }
      }}
      onFocus={() => setFocused(true)}
    >
      <div
        className={cn(
          "flex h-10 w-full items-center border bg-punk-surface-raised",
          "transition-all duration-200",
          invalid
            ? "border-punk-cta/70"
            : isActive
              ? "border-punk-primary shadow-punk-hard ring-2 ring-punk-accent/30"
              : "border-punk-border/50 hover:border-punk-primary/70 focus-within:border-punk-primary focus-within:shadow-punk-hard focus-within:ring-2 focus-within:ring-punk-accent/30"
        )}
      >
        <input
          ref={inputRef}
          value={value}
          onFocus={handleOpen}
          onChange={(event) => {
            onChange(event.target.value)
            handleOpen()
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          className="h-full min-w-0 flex-1 bg-transparent px-3 font-punk-body text-sm text-punk-text-primary outline-none placeholder:text-punk-text-muted focus:outline-none focus-visible:outline-none focus-visible:shadow-none"
          style={{ outline: "none", boxShadow: "none" }}
        />
        <button
          type="button"
          aria-label={`${ariaLabel} suggestions`}
          aria-expanded={open}
          onClick={() => {
            if (open) {
              setOpen(false)
            } else {
              handleOpen()
              inputRef.current?.focus()
            }
          }}
          className={cn(
            "flex h-full w-10 items-center justify-center border-l transition-colors",
            "focus:outline-none focus-visible:outline-none focus-visible:shadow-none",
            isActive
              ? "border-punk-primary/60 text-punk-accent"
              : "border-punk-border/40 text-punk-text-muted hover:text-punk-accent"
          )}
          style={{ outline: "none", boxShadow: "none" }}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && uniqueSuggestions.length > 0 && (
        <div
          className={cn(
            "absolute left-0 z-[100] max-h-56 w-full overflow-y-auto border border-punk-border bg-punk-surface-raised shadow-punk-panel",
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {uniqueSuggestions.map((model) => (
            <button
              key={model}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(model)
                setOpen(false)
                inputRef.current?.focus()
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2 text-left",
                "font-punk-body text-[12px] transition-all duration-150",
                model === value
                  ? "bg-punk-primary/12 text-punk-primary"
                  : "text-punk-text-secondary hover:bg-punk-surface-soft hover:text-punk-text-primary"
              )}
            >
              <span className="truncate">{model}</span>
              {model === value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AiSettingsDialog({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = React.useState<AiSettings>(defaultAiSettings)
  const [statusText, setStatusText] = React.useState("Loading AI settings...")
  const [testing, setTesting] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    preferencesRepo
      .fetch()
      .then(async (preferences) => {
        if (cancelled) return
        const nextSettings = normalizeAiSettings(preferences.aiSettings)
        setSettings(nextSettings)
        if (nextSettings.provider === "chrome-local") {
          const status = await detectChromeLocalAiStatus()
          if (!cancelled) {
            setSettings((current) =>
              normalizeAiSettings({
                ...current,
                aiStatus: status.available ? "available" : "unavailable",
              })
            )
            setStatusText(status.message)
          }
        } else {
          setStatusText(nextSettings.lastTestMessage || "Remote provider not tested")
        }
      })
      .catch(() => {
        if (!cancelled) setStatusText("Failed to load AI settings")
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateSettings = (updates: Partial<AiSettings>) => {
    setSettings((current) => normalizeAiSettings({ ...current, ...updates }))
  }

  const handleModeChange = (provider: AiSettings["provider"]) => {
    updateSettings({
      provider,
      enabled: provider !== "manual",
      lastTestStatus: "idle",
      lastTestMessage: undefined,
    })
    setStatusText(provider === "manual" ? "Manual mode does not call AI." : "Not tested")
  }

  const handleProviderPresetChange = (providerId: string) => {
    const preset =
      modelProviderPresets.find((item) => item.id === providerId) ?? modelProviderPresets[0]
    updateSettings({
      provider: "openai-compatible",
      enabled: true,
      customModelProviderId: preset.id,
      customModelProvider: preset.protocol,
      customModelBaseUrl: preset.defaultBaseUrl,
      customModelName: preset.defaultModel,
      customModelApiKey: preset.requiresApiKey ? settings.customModelApiKey || "" : "",
      hasCloudKey: preset.requiresApiKey ? Boolean(settings.customModelApiKey?.trim()) : false,
      lastTestStatus: "idle",
      lastTestMessage: undefined,
    })
    setStatusText("Not tested")
  }

  const handleSave = async () => {
    await preferencesRepo.save({ aiSettings: normalizeAiSettings(settings) })
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    const normalized = normalizeAiSettings(settings)
    const result = await testAiProvider(normalized)
    const nextSettings: AiSettings = {
      ...normalized,
      aiStatus:
        normalized.provider === "chrome-local"
          ? result.available
            ? "available"
            : "unavailable"
          : normalized.aiStatus,
      lastTestStatus: result.available ? "success" : "error",
      lastTestMessage: result.message,
    }
    setSettings(nextSettings)
    setStatusText(result.message)
    await preferencesRepo.save({ aiSettings: nextSettings })
    setTesting(false)
  }

  const selectedPreset = getModelProviderPresetForSettings(settings)
  const isCustomProvider = settings.provider === "openai-compatible"
  const isChromeLocal = settings.provider === "chrome-local"
  const isManual = settings.provider === "manual"
  const missingUrl = isCustomProvider && !settings.customModelBaseUrl?.trim()
  const missingModel = isCustomProvider && !settings.customModelName?.trim()
  const missingApiKey =
    isCustomProvider && selectedPreset.requiresApiKey && !settings.customModelApiKey?.trim()
  const modeDetail =
    AI_MODE_OPTIONS.find((option) => option.value === settings.provider)?.detail ?? ""

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-punk-bg/80 backdrop-blur-sm">
      <div className="w-[520px] border border-punk-border bg-punk-bg-alt shadow-punk-hard">
        <div className="flex items-center justify-between border-b border-punk-border/40 px-4 py-3">
          <div className="flex items-center gap-2 font-punk-heading text-[13px] uppercase text-punk-accent">
            <Bot className="h-4 w-4" />
            AI SETTINGS
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI settings"
            className="text-punk-text-muted hover:text-punk-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-3">
          <div className="rounded border border-punk-border/40 bg-punk-surface-soft/50 p-3">
            <label className="mb-1 block font-punk-heading text-[12px] uppercase text-punk-text-muted">
              AI MODE
            </label>
            <PunkSelect
              value={settings.provider}
              ariaLabel="Select AI mode"
              onChange={handleModeChange}
              options={AI_MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                detail: option.detail,
                icon:
                  option.value === "chrome-local" ? (
                    <Cpu className="h-3.5 w-3.5 shrink-0 text-punk-neon-cyan" />
                  ) : option.value === "manual" ? (
                    <Bot className="h-3.5 w-3.5 shrink-0 text-punk-text-muted" />
                  ) : (
                    <Cloud className="h-3.5 w-3.5 shrink-0 text-punk-accent" />
                  ),
              }))}
            />
            <p className="mt-2 font-punk-body text-[11px] text-punk-text-muted">{modeDetail}</p>
          </div>

          {isChromeLocal && (
            <div className="rounded border border-punk-border/40 bg-punk-surface-soft/50 p-3">
              <div className="flex items-start gap-2">
                <Bot className="mt-0.5 h-4 w-4 text-punk-accent" />
                <div>
                  <strong className="font-punk-heading text-[12px] uppercase text-punk-text-primary">
                    CHROME PROMPT API
                  </strong>
                  <p className="mt-1 font-punk-body text-[11px] text-punk-text-muted">
                    Local model availability is checked by the browser. No API key is sent.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isCustomProvider && (
            <div className="space-y-3 rounded border border-punk-border/40 bg-punk-surface-soft/50 p-3">
              <label className="mb-1 block font-punk-heading text-[12px] uppercase text-punk-text-muted">
                MODEL PROVIDER
              </label>
              <PunkSelect
                value={selectedPreset.id}
                ariaLabel="Select model provider"
                onChange={handleProviderPresetChange}
                options={modelProviderPresets.map((preset) => ({
                  value: preset.id,
                  label: preset.label,
                  detail:
                    preset.protocol === "anthropic-compatible"
                      ? "Anthropic-compatible"
                      : "OpenAI-compatible",
                  icon: <ProviderIcon preset={preset} />,
                }))}
              />

              <label className="block">
                <span className="mb-1 block font-punk-heading text-[12px] uppercase text-punk-text-muted">
                  BASE URL
                </span>
                <input
                  value={settings.customModelBaseUrl ?? ""}
                  onChange={(event) =>
                    updateSettings({
                      customModelBaseUrl: event.target.value,
                      baseUrl: event.target.value,
                    })
                  }
                  placeholder={selectedPreset.defaultBaseUrl}
                  aria-invalid={missingUrl}
                  className="punk-input h-10 w-full px-3 text-sm"
                />
                <p
                  className={cn(
                    "mt-1 font-punk-body text-[11px]",
                    missingUrl ? "text-punk-cta" : "text-punk-text-muted"
                  )}
                >
                  {missingUrl
                    ? "URL is required."
                    : selectedPreset.protocol === "anthropic-compatible"
                      ? "Anthropic-compatible endpoint"
                      : "OpenAI-compatible endpoint"}
                </p>
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-1 font-punk-heading text-[12px] uppercase text-punk-text-muted">
                  <KeyRound className="h-3.5 w-3.5" />
                  API KEY
                </span>
                <input
                  type="password"
                  value={settings.customModelApiKey ?? ""}
                  onChange={(event) =>
                    updateSettings({
                      customModelApiKey: event.target.value,
                      apiKey: event.target.value,
                      hasCloudKey: event.target.value.trim().length > 0,
                    })
                  }
                  placeholder={selectedPreset.requiresApiKey ? "sk-..." : "Optional"}
                  aria-invalid={missingApiKey}
                  className="punk-input h-10 w-full px-3 text-sm"
                />
                {missingApiKey && (
                  <p className="mt-1 font-punk-body text-[11px] text-punk-cta">
                    API key is required for this provider.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block font-punk-heading text-[12px] uppercase text-punk-text-muted">
                  MODEL
                </span>
                <PunkCombobox
                  value={settings.customModelName ?? ""}
                  suggestions={selectedPreset.suggestedModels}
                  onChange={(model) =>
                    updateSettings({
                      customModelName: model,
                      model,
                    })
                  }
                  placeholder={selectedPreset.defaultModel}
                  ariaLabel="Model"
                  invalid={missingModel}
                />
                {missingModel && (
                  <p className="mt-1 font-punk-body text-[11px] text-punk-cta">
                    Model is required.
                  </p>
                )}
              </label>

              <p className="font-punk-body text-[11px] text-punk-text-muted">
                {selectedPreset.note}
              </p>
              <p className="font-punk-body text-[11px] text-punk-text-muted">
                The API key is stored only in local browser settings.
              </p>
            </div>
          )}

          {isManual && (
            <div className="rounded border border-punk-border/40 bg-punk-surface-soft/50 p-3 font-punk-body text-[12px] text-punk-text-muted">
              Manual mode disables AI calls. You can still create and manage groups normally.
            </div>
          )}

          <div
            className={cn(
              "border px-3 py-2 font-punk-body text-xs",
              settings.lastTestStatus === "success"
                ? "border-punk-success/50 text-punk-success"
                : settings.lastTestStatus === "error"
                  ? "border-punk-cta/50 text-punk-cta"
                  : "border-punk-border/40 text-punk-text-muted"
            )}
          >
            {statusText}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-punk-border/40 px-4 py-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || isManual}
            className="border border-punk-accent/50 px-3 py-2 font-punk-heading text-[12px] uppercase text-punk-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing && <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />}
            {testing ? "TESTING" : "TEST CONNECTION"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-punk-primary px-3 py-2 font-punk-heading text-[12px] uppercase text-white hover:bg-punk-primary/80"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}

const THEME_OPTIONS: {
  theme: Preferences["theme"]
  icon: LucideIcon
  label: string
  ariaLabel: string
}[] = [
  { theme: "dark", icon: Moon, label: "DARK", ariaLabel: "Use dark theme" },
  { theme: "light", icon: Sun, label: "LIGHT", ariaLabel: "Use light theme" },
  { theme: "system", icon: Monitor, label: "SYS", ariaLabel: "Follow system theme" },
]

function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}) {
  return (
    <div
      className="flex border border-punk-border/30 bg-punk-surface-inset/70"
      role="group"
      aria-label="View mode"
    >
      {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange?.(mode)}
          aria-label={`${label.charAt(0) + label.slice(1).toLowerCase()} view`}
          aria-pressed={viewMode === mode}
          title={`${label.charAt(0) + label.slice(1).toLowerCase()} view`}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 transition-all duration-200",
            viewMode === mode
              ? "bg-punk-primary/10 text-punk-accent border border-punk-primary/60"
              : "text-punk-text-muted hover:text-punk-text-secondary border border-transparent"
          )}
        >
          <Icon className="h-3 w-3" />
          <span className="text-[10px] font-punk-heading uppercase">{label}</span>
        </button>
      ))}
    </div>
  )
}

interface HeaderProps {
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onOpenImportExport?: (mode: "import" | "export") => void
}

export function Header({
  viewMode = "compact",
  onViewModeChange,
  onOpenImportExport,
}: HeaderProps) {
  const version = useExtensionVersion()
  const [showSettingsMenu, setShowSettingsMenu] = React.useState(false)
  const [showAiSettings, setShowAiSettings] = React.useState(false)
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)
  return (
    <header className="relative flex items-center justify-between border-b-2 border-punk-primary bg-punk-surface-raised px-4 py-3 shadow-punk-hard hud-corner">
      {/* Decorative scanline */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="w-full h-1 bg-punk-accent animate-scanline" />
      </div>

      {/* Logo and Title */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Extension Icon */}
        <div className="relative">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background */}
            <rect width="40" height="40" fill="var(--punk-bg-alt)" />
            {/* Border */}
            <rect
              x="1.5"
              y="1.5"
              width="37"
              height="37"
              stroke="var(--punk-neon-cyan)"
              strokeWidth="2"
              fill="none"
            />
            {/* E letter with pulse animation */}
            <text
              x="20"
              y="20"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--punk-neon-cyan)"
              fontSize="22"
              fontWeight="bold"
              fontFamily="monospace"
              className="animate-pulse-neon"
            >
              E
            </text>
          </svg>
          {/* Glow effect */}
          <div className="absolute inset-0 blur-md bg-punk-neon-cyan/30 -z-10" />
        </div>

        <div className="flex flex-col">
          <h1 className="font-punk-heading text-xs text-punk-neon-cyan">EXT HELPER</h1>
          <span className="font-punk-body text-punk-text-muted text-sm tracking-wider">
            EXTENSION_MGR_v{version}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 relative z-10">
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettingsMenu((open) => !open)}
            aria-label="Open settings menu"
            aria-expanded={showSettingsMenu}
            title="Settings"
            className={cn(
              "flex h-8 w-8 items-center justify-center border border-punk-border/30 bg-punk-surface-inset/70",
              "text-punk-text-muted transition-all duration-200 hover:border-punk-accent hover:text-punk-accent",
              showSettingsMenu && "border-punk-accent text-punk-accent"
            )}
          >
            <Settings className="h-4 w-4" />
          </button>

          {showSettingsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-60 border border-punk-border bg-punk-surface-raised shadow-punk-panel">
                <div className="border-b border-punk-border/40 px-3 py-2">
                  <div className="mb-2 font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-muted">
                    THEME
                  </div>
                  <div className="grid grid-cols-3 border border-punk-border/60 bg-punk-surface-inset/70">
                    {THEME_OPTIONS.map(({ theme: optionTheme, icon: Icon, label, ariaLabel }) => (
                      <button
                        key={optionTheme}
                        type="button"
                        onClick={() => setTheme(optionTheme)}
                        aria-label={ariaLabel}
                        aria-pressed={theme === optionTheme}
                        title={ariaLabel}
                        className={cn(
                          "flex h-9 min-w-0 items-center justify-center gap-1 px-2 transition-all duration-200",
                          "border border-transparent font-punk-heading text-[10px] uppercase tracking-wider",
                          theme === optionTheme
                            ? "border-punk-primary/50 bg-punk-primary/10 text-punk-primary"
                            : "text-punk-text-muted hover:border-punk-accent/50 hover:text-punk-text-primary"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenImportExport?.("import")
                    setShowSettingsMenu(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-secondary transition-all duration-150 hover:bg-punk-surface-soft hover:text-punk-text-primary"
                >
                  <Upload className="h-3.5 w-3.5" />
                  IMPORT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenImportExport?.("export")
                    setShowSettingsMenu(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-secondary transition-all duration-150 hover:bg-punk-surface-soft hover:text-punk-text-primary"
                >
                  <Download className="h-3.5 w-3.5" />
                  EXPORT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiSettings(true)
                    setShowSettingsMenu(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-secondary transition-all duration-150 hover:bg-punk-bg hover:text-punk-text-primary"
                >
                  <Bot className="h-3.5 w-3.5" />
                  AI SETTINGS
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showAiSettings && <AiSettingsDialog onClose={() => setShowAiSettings(false)} />}
    </header>
  )
}

interface FooterProps {
  totalCount: number
  enabledCount: number
}

export function Footer({ totalCount, enabledCount }: FooterProps) {
  const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0

  return (
    <footer className="relative flex items-center justify-between border-t-2 border-punk-primary bg-punk-surface-raised px-4 py-2 overflow-hidden shadow-punk-hard">
      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-punk-surface-inset w-full">
        <div
          className="h-full bg-punk-success transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center gap-3">
        <span className="font-punk-body text-punk-text-muted text-sm">SYS_STATUS:</span>
        <span className="font-punk-body text-punk-success text-sm">
          {enabledCount}/{totalCount} ONLINE
        </span>
        <span className="text-punk-text-muted">|</span>
        <span className="font-punk-body text-punk-accent text-sm">{percentage}%_ACTIVE</span>
      </div>

      {/* Blinking indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-punk-success animate-pulse shadow-neon-cyan rounded-full" />
        <span className="font-punk-body text-punk-success text-xs">LIVE</span>
      </div>
    </footer>
  )
}
