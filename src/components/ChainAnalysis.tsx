import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from './ScreenHeader'
import { ModalShell } from './ModalShell'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { ChainAnalysisEntry } from '../data/types'
import type { ChainDraft, ChainField } from '../hooks/useChainDraft'
import { ChainEntryList } from './ChainEntryList'
import { focusDestination } from '../utils/focusDestination'

const FIELDS: { id: ChainField; required: boolean }[] = [
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
  draft: ChainDraft
  onClearAll: () => Promise<void>
}

export function ChainAnalysis({
  isOpen,
  onClose,
  entries,
  loading,
  draft,
  onClearAll,
  initialView,
  onDelete,
}: ChainAnalysisProps) {
  const { section, language } = useLanguage()
  const chainT = section('chainAnalysis')
  const [showEntries, setShowEntries] = useState(initialView === 'entries')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedEntry = selectedId ? entries.find((entry) => entry.id === selectedId) : undefined
  const selectEntry = useCallback((id: string) => {
    setSelectedId(id)
    setShowEntries(true)
  }, [])
  const headingRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    focusDestination(headingRef.current?.querySelector<HTMLElement>('#screen-title') ?? null)
  }, [selectedId, showEntries])
  const { fields, error } = draft
  const saved = draft.status === 'saved'
  const saving = draft.status === 'saving'
  const hasDraft = Object.values(fields).some(Boolean)
  const [confirmOpen, setConfirmOpen] = useState<'delete' | 'discard' | null>(null)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(false)
  const clearTriggerRef = useRef<HTMLButtonElement>(null)
  const discardTriggerRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const closeConfirm = useCallback(() => {
    if (clearing) return
    setConfirmOpen(null)
    setClearError(false)
  }, [clearing])
  const focusTrapRef = useFocusTrap(isOpen && confirmOpen !== null, closeConfirm, cancelRef,
    confirmOpen === 'discard' ? discardTriggerRef : clearTriggerRef)

  const canSave = fields.situation.trim().length > 0 && !saving

  const clearEntries = async () => {
    if (clearing) return
    if (confirmOpen === 'discard') {
      draft.reset()
      setConfirmOpen(null)
      window.setTimeout(() => focusDestination(headingRef.current?.querySelector<HTMLTextAreaElement>('#chain-situation') ?? null), 0)
      return
    }
    setClearing(true)
    setClearError(false)
    try {
      if (selectedId && onDelete) await onDelete(selectedId)
      else await onClearAll()
      setSelectedId(null)
      setConfirmOpen(null)
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
        {onDelete && <button ref={clearTriggerRef} type="button" className="danger-button" onClick={() => setConfirmOpen('delete')}><Trash2 size={18} aria-hidden="true" />{chainT.deleteOne}</button>}
      </section> : <>
      {(entries.length > 0 || showEntries) && <button type="button" className="secondary-button" onClick={() => { if (showEntries && saved) draft.reset(); setShowEntries(!showEntries) }}>{showEntries ? (hasDraft ? chainT.resumeEntry : chainT.newEntry) : chainT.readEntries}</button>}
      {showEntries && !loading && entries.length === 0 && <p className="muted">{chainT.emptyEntries}</p>}

      {!showEntries && (!saved ? (
        <form className="chain-form" onSubmit={(event) => { event.preventDefault(); void draft.save() }}>
          {FIELDS.map(({ id, required }) => (
            <label className="chain-field" key={id} htmlFor={`chain-${id}`}>
              <span>{chainT[id]}{!required && <small>{chainT.optional}</small>}</span>
              <textarea
                id={`chain-${id}`}
                aria-label={chainT[id]}
                value={fields[id]}
                required={required}
                disabled={saving}
                onChange={(event) => draft.setField(id, event.target.value)}
                placeholder={chainT[`${id}Placeholder` as keyof typeof chainT] as string}
                className="guided-textarea"
              />
            </label>
          ))}
          {draft.status === 'error' && <p className="guided-error" role="alert">{error ?? chainT.saveError}</p>}
          <button type="submit" disabled={!canSave} className="primary-button guided-primary">
            {saving ? chainT.saving : chainT.save}
          </button>
          {hasDraft && <button ref={discardTriggerRef} type="button" className="text-button danger-text inline-flex items-center justify-center gap-2" disabled={saving} onClick={() => setConfirmOpen('discard')}>
            <Trash2 size={18} aria-hidden="true" />{chainT.discardDraft}
          </button>}
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
            <button ref={clearTriggerRef} type="button" onClick={() => setConfirmOpen('delete')} className="text-button danger-text">{chainT.clear}</button>
          </div>
          <ChainEntryList entries={entries} onSelect={selectEntry} language={language} />
        </section>
      )}
      </>}

      {confirmOpen && (
        <ModalShell
          onClose={closeConfirm}
          focusTrapRef={focusTrapRef}
          labelledBy="clear-chain-title"
          describedBy="clear-chain-description"
          panelClassName="confirm-dialog"
          panelProps={{
            initial: { scale: 0.97, y: 8 },
            animate: { scale: 1, y: 0 },
            exit: { scale: 0.97, y: 8 },
            transition: { duration: 0.14 },
          }}
        >
          <h2 id="clear-chain-title">{confirmOpen === 'discard' ? chainT.discardTitle : selectedId ? chainT.deleteOneTitle : chainT.confirmTitle}</h2>
          <p id="clear-chain-description">{confirmOpen === 'discard' ? chainT.discardBody : selectedId ? chainT.deleteOneBody : chainT.confirmBody}</p>
          {clearError && <p className="privacy-feedback" role="alert">{chainT.clearError}</p>}
          <div className="confirm-dialog-actions">
            <button ref={cancelRef} type="button" className="secondary-button" disabled={clearing} onClick={closeConfirm}>{chainT.cancel}</button>
            <button type="button" className="danger-button" disabled={clearing} onClick={() => { void clearEntries() }}>
              <Trash2 size={18} aria-hidden="true" />
              {clearing ? chainT.clearing : confirmOpen === 'discard' ? chainT.discardDraft : selectedId ? chainT.deleteOne : chainT.confirmAction}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
