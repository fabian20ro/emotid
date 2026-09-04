import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from './ScreenHeader'
import { ModalShell } from './ModalShell'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { ChainAnalysisEntry, ChainReflectionEntry } from '../data/types'
import { getChainEntryPreview } from '../data/chain-presentation'
import { focusDestination } from '../utils/focusDestination'

type ReflectionField = 'situation' | 'noticed' | 'response' | 'outcome'
type ReflectionFields = Pick<ChainReflectionEntry, ReflectionField>

const EMPTY_FIELDS: ReflectionFields = {
  situation: '',
  noticed: '',
  response: '',
  outcome: '',
}

const FIELDS: { id: ReflectionField; required: boolean }[] = [
  { id: 'situation', required: true },
  { id: 'noticed', required: false },
  { id: 'response', required: false },
  { id: 'outcome', required: false },
]

interface ChainAnalysisProps {
  initialView?: 'entries'
  onDelete?: (id: string) => Promise<void>
  isOpen: boolean
  onClose: () => void
  entries: ChainAnalysisEntry[]
  loading: boolean
  onSave: (entry: ChainAnalysisEntry) => Promise<void>
  onClearAll: () => Promise<void>
}

export function ChainAnalysis({
  isOpen,
  onClose,
  entries,
  loading,
  onSave,
  onClearAll,
  initialView,
  onDelete,
}: ChainAnalysisProps) {
  const { section, language } = useLanguage()
  const chainT = section('chainAnalysis')
  const [showEntries, setShowEntries] = useState(initialView === 'entries')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedEntry = entries.find((entry) => entry.id === selectedId)
  const headingRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    focusDestination(headingRef.current?.querySelector<HTMLElement>('#screen-title') ?? null)
  }, [selectedId, showEntries])
  const [fields, setFields] = useState<ReflectionFields>(EMPTY_FIELDS)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(false)
  const clearTriggerRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const closeConfirm = useCallback(() => {
    if (clearing) return
    setConfirmOpen(false)
    setClearError(false)
  }, [clearing])
  const focusTrapRef = useFocusTrap(confirmOpen, closeConfirm, cancelRef, clearTriggerRef)

  useEffect(() => {
    if (!isOpen) {
      setFields(EMPTY_FIELDS)
      setSaved(false)
      setSaving(false)
      setError(null)
      setConfirmOpen(false)
      setClearing(false)
      setClearError(false)
    }
  }, [isOpen])

  const canSave = fields.situation.trim().length > 0 && !saving

  const saveEntry = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    const entry: ChainReflectionEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      version: 2,
      situation: fields.situation.trim(),
      noticed: fields.noticed.trim(),
      response: fields.response.trim(),
      outcome: fields.outcome.trim(),
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(entry)
      setSaved(true)
    } catch (cause) {
      setError((cause as Error)?.message ?? chainT.saveError)
    } finally {
      setSaving(false)
    }
  }

  const clearEntries = async () => {
    if (clearing) return
    setClearing(true)
    setClearError(false)
    try {
      if (selectedId && onDelete) await onDelete(selectedId)
      else await onClearAll()
      setSelectedId(null)
      setConfirmOpen(false)
    } catch {
      setClearError(true)
    } finally {
      setClearing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div ref={headingRef} className="screen guided-screen" data-testid="chain-screen">
      <ScreenHeader onBack={selectedId ? () => setSelectedId(null) : onClose} eyebrow={chainT.eyebrow} title={selectedEntry ? chainT.detailTitle : showEntries ? chainT.recent : chainT.title} lede={selectedEntry ? new Date(selectedEntry.timestamp).toLocaleString(language) : showEntries ? undefined : chainT.prompt} />

      {selectedEntry ? <section data-testid="chain-entry-detail">
        <dl className="detail-list">
          {('version' in selectedEntry
            ? FIELDS.map(({ id }) => ({ label: chainT[id], value: selectedEntry[id] }))
            : (['triggeringEvent', 'vulnerabilityFactors', 'promptingEvent', 'emotion', 'urge', 'action', 'consequence'] as const).map((id) => ({ label: chainT.legacyFields[id], value: selectedEntry[id] }))
          ).filter((field) => field.value).map((field) => <div key={field.label}><dt>{field.label}</dt><dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{field.value}</dd></div>)}
        </dl>
        {onDelete && <button ref={clearTriggerRef} type="button" className="danger-button" onClick={() => setConfirmOpen(true)}><Trash2 size={18} aria-hidden="true" />{chainT.deleteOne}</button>}
      </section> : <>
      {(entries.length > 0 || showEntries) && <button type="button" className="secondary-button" onClick={() => { if (showEntries) setFields(EMPTY_FIELDS); setShowEntries(!showEntries); setSaved(false) }}>{showEntries ? chainT.newEntry : chainT.readEntries}</button>}
      {showEntries && !loading && entries.length === 0 && <p className="muted">{chainT.emptyEntries}</p>}

      {!showEntries && (!saved ? (
        <form className="chain-form" onSubmit={(event) => { void saveEntry(event) }}>
          {FIELDS.map(({ id, required }) => (
            <label className="chain-field" key={id} htmlFor={`chain-${id}`}>
              <span>{chainT[id]}{!required && <small>{chainT.optional}</small>}</span>
              <textarea
                id={`chain-${id}`}
                aria-label={chainT[id]}
                value={fields[id]}
                required={required}
                onChange={(event) => setFields((current) => ({ ...current, [id]: event.target.value }))}
                placeholder={chainT[`${id}Placeholder` as keyof typeof chainT] as string}
                className="guided-textarea"
              />
            </label>
          ))}
          {error && <p className="guided-error" role="alert">{error}</p>}
          <button type="submit" disabled={!canSave} className="primary-button guided-primary">
            {saving ? chainT.saving : chainT.save}
          </button>
        </form>
      ) : (
        <section className="guided-success" aria-live="polite">
          <h2>{chainT.savedTitle}</h2>
          <p>{chainT.saved}</p>
          <button type="button" onClick={onClose} className="primary-button">{chainT.done}</button>
        </section>
      ))}

      {!loading && entries.length > 0 && (
        <section className="guided-recent" aria-labelledby={showEntries ? 'screen-title' : 'recent-chains-title'}>
          <div className="guided-recent-heading">
            {!showEntries && <h2 id="recent-chains-title">{chainT.recent}</h2>}
            <button ref={clearTriggerRef} type="button" onClick={() => setConfirmOpen(true)} className="text-button danger-text">{chainT.clear}</button>
          </div>
          <div className="guided-recent-list">
            {entries.map((entry) => {
              const preview = getChainEntryPreview(entry)
              return (
                <button type="button" key={entry.id} onClick={() => { setSelectedId(entry.id); setShowEntries(true) }}>
                  <small>{new Date(entry.timestamp).toLocaleString(language === 'ro' ? 'ro-RO' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                  <strong>{preview.title}</strong>
                  {preview.detail && <span>{preview.detail}</span>}
                </button>
              )
            })}
          </div>
        </section>
      )}
      </>}

      {confirmOpen && (
        <ModalShell
          onClose={closeConfirm}
          focusTrapRef={focusTrapRef}
          labelledBy="clear-chain-title"
          describedBy="clear-chain-description"
          backdropClassName="dialog-backdrop"
          viewportClassName="dialog-viewport"
          panelClassName="confirm-dialog"
          panelProps={{
            initial: { scale: 0.97, y: 8 },
            animate: { scale: 1, y: 0 },
            exit: { scale: 0.97, y: 8 },
            transition: { duration: 0.14 },
          }}
        >
          <h2 id="clear-chain-title">{selectedId ? chainT.deleteOneTitle : chainT.confirmTitle}</h2>
          <p id="clear-chain-description">{selectedId ? chainT.deleteOneBody : chainT.confirmBody}</p>
          {clearError && <p className="privacy-feedback" role="alert">{chainT.clearError}</p>}
          <div className="confirm-dialog-actions">
            <button ref={cancelRef} type="button" className="secondary-button" disabled={clearing} onClick={closeConfirm}>{chainT.cancel}</button>
            <button type="button" className="danger-button" disabled={clearing} onClick={() => { void clearEntries() }}>
              <Trash2 size={18} aria-hidden="true" />
              {clearing ? chainT.clearing : selectedId ? chainT.deleteOne : chainT.confirmAction}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
