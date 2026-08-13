import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from './ScreenHeader'
import { ModalShell } from './ModalShell'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { ChainAnalysisEntry, ChainReflectionEntry } from '../data/types'
import { getChainEntryPreview } from '../data/chain-presentation'

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
}: ChainAnalysisProps) {
  const { section, language } = useLanguage()
  const chainT = section('chainAnalysis')
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

  const recentEntries = useMemo(() => entries.slice(0, 3), [entries])
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
      await onClearAll()
      setConfirmOpen(false)
    } catch {
      setClearError(true)
    } finally {
      setClearing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="screen guided-screen" data-testid="chain-screen">
      <ScreenHeader onBack={onClose} eyebrow={chainT.eyebrow} title={chainT.title} lede={chainT.prompt} />

      {!saved ? (
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
      )}

      {!loading && recentEntries.length > 0 && (
        <section className="guided-recent" aria-labelledby="recent-chains-title">
          <div className="guided-recent-heading">
            <h2 id="recent-chains-title">{chainT.recent}</h2>
            <button ref={clearTriggerRef} type="button" onClick={() => setConfirmOpen(true)} className="text-button danger-text">{chainT.clear}</button>
          </div>
          <div className="guided-recent-list">
            {recentEntries.map((entry) => {
              const preview = getChainEntryPreview(entry)
              return (
                <div key={entry.id}>
                  <small>{new Date(entry.timestamp).toLocaleString(language === 'ro' ? 'ro-RO' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                  <strong>{preview.title}</strong>
                  {preview.detail && <span>{preview.detail}</span>}
                </div>
              )
            })}
          </div>
        </section>
      )}

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
          <h2 id="clear-chain-title">{chainT.confirmTitle}</h2>
          <p id="clear-chain-description">{chainT.confirmBody}</p>
          {clearError && <p className="privacy-feedback" role="alert">{chainT.clearError}</p>}
          <div className="confirm-dialog-actions">
            <button ref={cancelRef} type="button" className="secondary-button" disabled={clearing} onClick={closeConfirm}>{chainT.cancel}</button>
            <button type="button" className="danger-button" disabled={clearing} onClick={() => { void clearEntries() }}>
              <Trash2 size={18} aria-hidden="true" />
              {clearing ? chainT.clearing : chainT.confirmAction}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
