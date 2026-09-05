import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, CircleHelp, Crosshair, LockKeyhole } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { quickEmotions } from '../models/catalog/quick'
import type { AnalysisResult, BaseEmotion } from '../models/types'
import type { Session } from '../data/types'
import { RecentThread } from '../components/RecentThread'

interface TodayScreenProps {
  sessions: Session[]
  saveSessions: boolean
  onPlaceFeeling: () => void
  onHelpChoose: () => void
  onQuickComplete: (selection: BaseEmotion, result: AnalysisResult) => void
  onOpenJournal: () => void
}

export function TodayScreen({ sessions, saveSessions, onPlaceFeeling, onHelpChoose, onQuickComplete, onOpenJournal }: TodayScreenProps) {
  const { language, section } = useLanguage()
  const t = section('today')
  const recent = sessions[0]
  const [quickSelection, setQuickSelection] = useState<BaseEmotion | null>(null)
  const quickContinueRef = useRef<HTMLButtonElement>(null)
  const quickLabel = quickSelection?.label[language].toLocaleLowerCase(
    language === 'ro' ? 'ro-RO' : 'en-US',
  )

  useEffect(() => {
    if (quickSelection) {
      quickContinueRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  }, [quickSelection])

  const continueQuick = () => {
    if (!quickSelection) return
    onQuickComplete(quickSelection, {
      id: quickSelection.id,
      label: quickSelection.label,
      color: quickSelection.color,
      description: quickSelection.description,
      needs: quickSelection.needs,
    })
  }

  return (
    <div className="screen" data-testid="today-screen">
      <p className="screen-eyebrow">{t.eyebrow}</p>
      <h1 id="screen-title" className="screen-title" tabIndex={-1}>{t.title}</h1>
      <p className="screen-lede">{t.lede}</p>

      <div className="today-entry-actions">
        <button type="button" className="primary-button" onClick={onPlaceFeeling}>
          <Crosshair size={19} aria-hidden="true" />
          {t.placeFeeling}
        </button>
        <button type="button" className="secondary-button" data-testid="today-guided-entry" onClick={onHelpChoose}>
          <CircleHelp size={19} aria-hidden="true" />
          {t.helpChoose}
        </button>
      </div>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="section-heading">{t.quickTitle}</h2>
        <p className="muted text-sm mt-0 mb-3">{t.quickPrompt}</p>
        <div className="quick-strip">
          {quickEmotions.map((emotion) => (
            <button
              type="button"
              key={emotion.id}
              data-testid={`quick-feeling-${emotion.id}`}
              className={quickSelection?.id === emotion.id ? 'is-selected' : ''}
              aria-pressed={quickSelection?.id === emotion.id}
              onClick={() => setQuickSelection(
                quickSelection?.id === emotion.id ? null : emotion,
              )}
            >
              <span className="quick-dot" style={{ backgroundColor: emotion.color }} aria-hidden="true" />
              {emotion.label[language].toLocaleLowerCase(language === 'ro' ? 'ro-RO' : 'en-US')}
            </button>
          ))}
        </div>
        {quickSelection && (
          <button
            ref={quickContinueRef}
            type="button"
            className="primary-button quick-continue"
            data-testid="quick-continue"
            onClick={continueQuick}
          >
            {t.quickContinue.replace('{emotion}', quickLabel ?? '')}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </section>

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="section-heading">{t.recentTitle}</h2>
        <div className="soft-panel recent-thread">
          {recent ? (
            <RecentThread session={recent} onOpenJournal={onOpenJournal} />
          ) : (
            <p className="muted text-sm m-0">{t.recentEmpty}</p>
          )}
        </div>
      </section>

      <div className="privacy-line">
        {saveSessions ? <LockKeyhole size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
        <span>{saveSessions ? t.savedLocally : section('reflectionScreen').notSaved}</span>
      </div>
    </div>
  )
}
