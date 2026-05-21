import * as React from "react"
import { AlertTriangle, CheckCircle2, Download, FileJson, Upload, X } from "lucide-react"
import { Button } from "@/components/common"
import {
  createExportPayload,
  IMPORT_EXPORT_DOMAINS,
  importSelectedDomains,
  parseImportPayload,
} from "@/services/importExportService"
import type {
  ImportExportDomain,
  ImportExportPayload,
  ImportExportPreview,
  ParsedImportExportPayload,
} from "@/types"
import { cn } from "@/utils"

interface ImportExportDialogProps {
  open: boolean
  onClose: () => void
  onImported: () => Promise<void>
}

const defaultDomainSelection = (): Record<ImportExportDomain, boolean> =>
  IMPORT_EXPORT_DOMAINS.reduce(
    (selection, { domain }) => ({
      ...selection,
      [domain]: true,
    }),
    {} as Record<ImportExportDomain, boolean>
  )

const selectedDomainsFrom = (selection: Record<ImportExportDomain, boolean>) =>
  IMPORT_EXPORT_DOMAINS.filter(({ domain }) => selection[domain]).map(({ domain }) => domain)

const payloadFileName = (payload: ImportExportPayload) =>
  `ext-helper-backup-${payload.exportedAt.slice(0, 10)}.json`

export function ImportExportDialog({ open, onClose, onImported }: ImportExportDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [exportSelection, setExportSelection] = React.useState(defaultDomainSelection)
  const [importSelection, setImportSelection] = React.useState(defaultDomainSelection)
  const [parsed, setParsed] = React.useState<ParsedImportExportPayload | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setStatus(null)
  }, [open])

  if (!open) return null

  const toggleExportDomain = (domain: ImportExportDomain) => {
    setExportSelection((current) => ({
      ...current,
      [domain]: !current[domain],
    }))
  }

  const toggleImportDomain = (domain: ImportExportDomain) => {
    setImportSelection((current) => ({
      ...current,
      [domain]: !current[domain],
    }))
  }

  const handleExport = async () => {
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const payload = await createExportPayload({ domains: selectedDomainsFrom(exportSelection) })
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = payloadFileName(payload)
      link.click()
      URL.revokeObjectURL(url)
      setStatus("Export ready")
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Export failed")
    } finally {
      setBusy(false)
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const nextParsed = parseImportPayload(await file.text())
      setParsed(nextParsed)
      setImportSelection({
        ...defaultDomainSelection(),
        ...IMPORT_EXPORT_DOMAINS.reduce(
          (selection, { domain }) => ({
            ...selection,
            [domain]: nextParsed.preview.domains.some((item) => item.domain === domain),
          }),
          {} as Record<ImportExportDomain, boolean>
        ),
      })
      setStatus("Preview loaded")
    } catch (importError) {
      setParsed(null)
      setError(importError instanceof Error ? importError.message : "Import file is invalid")
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!parsed) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      await importSelectedDomains(parsed.payload, selectedDomainsFrom(importSelection))
      await onImported()
      setStatus("Import complete")
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed")
    } finally {
      setBusy(false)
    }
  }

  const selectedImportCount = selectedDomainsFrom(importSelection).filter((domain) =>
    parsed?.preview.domains.some((item) => item.domain === domain)
  ).length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[560px] border-2 border-punk-primary bg-punk-bg shadow-[0_0_30px_rgba(34,211,238,0.35)]">
        <div className="flex items-center justify-between border-b border-punk-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-punk-accent" />
            <h2 className="font-punk-heading text-sm uppercase text-punk-neon-cyan">
              IMPORT_EXPORT
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import export"
            className="text-punk-text-muted transition-colors hover:text-punk-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[480px] gap-4 overflow-y-auto p-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-punk-heading text-xs uppercase text-punk-text-primary">EXPORT</h3>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleExport()}
                disabled={busy || selectedDomainsFrom(exportSelection).length === 0}
                className="gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                JSON
              </Button>
            </div>
            <DomainChecklist selection={exportSelection} onToggle={toggleExportDomain} />
          </section>

          <section className="space-y-3 border-t border-punk-border/30 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-punk-heading text-xs uppercase text-punk-text-primary">IMPORT</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="gap-2"
              >
                <Upload className="h-3.5 w-3.5" />
                FILE
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void handleImportFile(event)}
            />

            {parsed ? (
              <ImportPreview
                preview={parsed.preview}
                selection={importSelection}
                onToggle={toggleImportDomain}
              />
            ) : (
              <div className="border border-dashed border-punk-border/50 px-3 py-5 text-center font-punk-body text-sm text-punk-text-muted">
                NO_FILE_SELECTED
              </div>
            )}
          </section>

          {error && (
            <div className="flex items-start gap-2 border border-punk-cta/60 bg-punk-cta/10 px-3 py-2 font-punk-body text-sm text-punk-cta">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {status && (
            <div className="flex items-center gap-2 border border-punk-success/60 bg-punk-success/10 px-3 py-2 font-punk-body text-sm text-punk-success">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{status}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-punk-border/50 px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            CANCEL
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleConfirmImport()}
            disabled={!parsed || busy || selectedImportCount === 0}
          >
            CONFIRM_IMPORT
          </Button>
        </div>
      </div>
    </div>
  )
}

function DomainChecklist({
  selection,
  onToggle,
}: {
  selection: Record<ImportExportDomain, boolean>
  onToggle: (domain: ImportExportDomain) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {IMPORT_EXPORT_DOMAINS.map(({ domain, label }) => (
        <label
          key={domain}
          className={cn(
            "flex items-center gap-2 border px-3 py-2 font-punk-body text-sm transition-colors",
            selection[domain]
              ? "border-punk-primary/70 bg-punk-primary/10 text-punk-text-primary"
              : "border-punk-border/40 text-punk-text-muted"
          )}
        >
          <input
            type="checkbox"
            checked={selection[domain]}
            onChange={() => onToggle(domain)}
            className="accent-punk-accent"
          />
          {label}
        </label>
      ))}
    </div>
  )
}

function ImportPreview({
  preview,
  selection,
  onToggle,
}: {
  preview: ImportExportPreview
  selection: Record<ImportExportDomain, boolean>
  onToggle: (domain: ImportExportDomain) => void
}) {
  const availableDomains = new Set(preview.domains.map((item) => item.domain))

  return (
    <div className="space-y-3 border border-punk-border/40 bg-punk-bg-alt/50 p-3">
      <div className="grid grid-cols-2 gap-2 font-punk-body text-xs text-punk-text-secondary">
        <span>VERSION: {preview.schemaVersion}</span>
        <span>COMPATIBLE: {preview.compatible ? "YES" : "NO"}</span>
        <span className="col-span-2">EXPORTED_AT: {preview.exportedAt}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {preview.domains.map((item) => (
          <label
            key={item.domain}
            className={cn(
              "flex items-center justify-between gap-2 border px-3 py-2 font-punk-body text-sm",
              selection[item.domain]
                ? "border-punk-accent/70 text-punk-text-primary"
                : "border-punk-border/40 text-punk-text-muted"
            )}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selection[item.domain] && availableDomains.has(item.domain)}
                onChange={() => onToggle(item.domain)}
                className="accent-punk-accent"
              />
              {item.label}
            </span>
            <span className="font-punk-heading text-xs text-punk-accent">{item.count}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
