import { useCallback, useState } from 'react'
import { Download, ExternalLink, Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { ModalShell } from '../components/ModalShell'
import { Toggle } from '../components/Toggle'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface PrivacyDataScreenProps {
  saveSessions: boolean
  allowExternalAI: boolean
  onBack: () => void
  onSaveSessionsChange: (enabled: boolean) => void
  onExternalAIChange: (enabled: boolean) => void
  onExport: () => Promise<void>
  onClear: () => Promise<void>
}

export function PrivacyDataScreen({ saveSessions, allowExternalAI, onBack, onSaveSessionsChange, onExternalAIChange, onExport, onClear }: PrivacyDataScreenProps) {
  const { section } = useLanguage()
  const t = section('privacyData')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState<'export' | 'clear' | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'status' | 'alert'; text: string } | null>(null)
  const closeConfirm = useCallback(() => setConfirmOpen(false), [])
  const focusTrapRef = useFocusTrap(confirmOpen, closeConfirm)

  const exportData = async () => {
    setPending('export')
    setFeedback(null)
    try {
      await onExport()
      setFeedback({ type: 'status', text: t.exportSuccess })
    } catch {
      setFeedback({ type: 'alert', text: t.dataError })
    } finally {
      setPending(null)
    }
  }

  const clearData = async () => {
    setPending('clear')
    setFeedback(null)
    try {
      await onClear()
      setConfirmOpen(false)
      setFeedback({ type: 'status', text: t.clearSuccess })
    } catch {
      setFeedback({ type: 'alert', text: t.dataError })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="screen" data-testid="privacy-screen">
      <ScreenHeader title={t.title} lede={t.lede} onBack={onBack} />
      <div className="settings-list mt-6">
        <div className="settings-row"><span>{t.saving}</span><Toggle checked={saveSessions} label={t.saving} onChange={onSaveSessionsChange} /></div>
        <div className="settings-row"><ExternalLink size={20} aria-hidden="true" /><span>{t.external}<small>{t.externalHint}</small></span><Toggle checked={allowExternalAI} label={t.external} onChange={onExternalAIChange} /></div>
      </div>
      <button type="button" className="secondary-button mt-6" disabled={pending !== null} onClick={() => { void exportData() }}><Download size={19} aria-hidden="true" />{pending === 'export' ? t.exporting : t.export}</button>
      <button type="button" className="danger-button mt-3" disabled={pending !== null} onClick={() => setConfirmOpen(true)}><Trash2 size={19} aria-hidden="true" />{t.clear}</button>
      {feedback && <p className="privacy-feedback" role={feedback.type}>{feedback.text}</p>}

      {confirmOpen && (
        <ModalShell
          onClose={closeConfirm}
          focusTrapRef={focusTrapRef}
          labelledBy="clear-data-title"
          describedBy="clear-data-description"
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
          <h2 id="clear-data-title">{t.confirmTitle}</h2>
          <p id="clear-data-description">{t.confirmClear}</p>
          <div className="confirm-dialog-actions">
            <button type="button" className="secondary-button" disabled={pending !== null} onClick={closeConfirm}>{t.cancel}</button>
            <button type="button" className="danger-button" disabled={pending !== null} onClick={() => { void clearData() }}>
              <Trash2 size={18} aria-hidden="true" />
              {pending === 'clear' ? t.deleting : t.confirmAction}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
