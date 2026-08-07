import { useCallback, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { ModalShell } from '../components/ModalShell'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getIntensityLabel, getSensationLabel, getSomaticRegionLabel } from '../models/somatic/display'
import type { Session } from '../data/types'
import { getEmotionDisplayLabel, getResultRelationship } from '../data/session-presentation'

interface SessionDetailScreenProps {
  session?: Session
  onBack: () => void
  onDelete: (id: string) => Promise<void>
}

export function SessionDetailScreen({ session, onBack, onDelete }: SessionDetailScreenProps) {
  const { language, section } = useLanguage()
  const t = section('sessionDetail')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const closeConfirm = useCallback(() => {
    if (deleting) return
    setConfirmOpen(false)
    setDeleteError(false)
  }, [deleting])
  const focusTrapRef = useFocusTrap(confirmOpen, closeConfirm, cancelRef, deleteTriggerRef)

  if (!session) return <div className="screen"><ScreenHeader title={t.title} onBack={onBack} /><p className="muted">{t.older}</p></div>

  const fitLabels = { yes: section('reflectionScreen').yes, partly: section('reflectionScreen').partly, no: section('reflectionScreen').no }
  const relationship = getResultRelationship(session)
  const bodySignals = session.selections.flatMap((selection) => {
    const sensationType = selection.extras?.sensationType
    if (typeof sensationType !== 'string') return []
    const intensity = getIntensityLabel(selection.extras?.intensity, language)
    return [{
      region: getSomaticRegionLabel(selection.emotionId, language, selection.label[language]),
      sensation: getSensationLabel(sensationType, language) ?? sensationType,
      intensity,
    }]
  })

  const deleteCurrentSession = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError(false)
    try {
      await onDelete(session.id)
      setConfirmOpen(false)
    } catch {
      setDeleteError(true)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="screen" data-testid="session-detail-screen">
      <ScreenHeader title={t.title} onBack={onBack} lede={new Intl.DateTimeFormat(language, { dateStyle: 'long', timeStyle: 'short' }).format(session.timestamp)} />
      <dl className="detail-list">
        <div><dt>{t.relationship[relationship]}</dt><dd>{session.results.map((result) => getEmotionDisplayLabel(result, language)).join(', ')}</dd></div>
        {bodySignals.length > 0 && (
          <div>
            <dt>{t.bodySignals}</dt>
            <dd>
              <ul className="detail-signals">
                {bodySignals.map((signal, index) => (
                  <li key={`${signal.region}-${index}`}>
                    <strong>{signal.region}</strong>
                    <span>{signal.sensation}{signal.intensity ? ` · ${signal.intensity}` : ''}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {session.reflectionAnswer && <div><dt>{t.fit}</dt><dd>{fitLabels[session.reflectionAnswer]}</dd></div>}
        {session.selectedNeed && <div><dt>{t.need}</dt><dd>{session.selectedNeed}</dd></div>}
        {session.nextStep && <div><dt>{t.step}</dt><dd>{session.nextStep}</dd></div>}
      </dl>
      {!session.reflectionAnswer && !session.selectedNeed && !session.nextStep && relationship === 'legacy' && (
        <p className="muted text-sm">{t.older}</p>
      )}
      <button
        ref={deleteTriggerRef}
        type="button"
        className="danger-button mt-6"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 size={19} aria-hidden="true" />
        {t.delete}
      </button>

      {confirmOpen && (
        <ModalShell
          onClose={closeConfirm}
          focusTrapRef={focusTrapRef}
          labelledBy="delete-session-title"
          describedBy="delete-session-description"
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
          <h2 id="delete-session-title">{t.confirmTitle}</h2>
          <p id="delete-session-description">{t.confirmBody}</p>
          {deleteError && <p className="privacy-feedback" role="alert">{t.deleteError}</p>}
          <div className="confirm-dialog-actions">
            <button ref={cancelRef} type="button" className="secondary-button" disabled={deleting} onClick={closeConfirm}>{t.cancel}</button>
            <button type="button" className="danger-button" disabled={deleting} onClick={() => { void deleteCurrentSession() }}>
              <Trash2 size={18} aria-hidden="true" />
              {deleting ? t.deleting : t.confirmAction}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
