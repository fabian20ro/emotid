import { ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getCanonicalEmotion } from '../models/catalog'
import type { AnalysisResult, BaseEmotion } from '../models/types'
import type { Session } from '../data/types'

const QUICK_IDS = ['anxiety', 'sadness', 'anger', 'joy', 'numb', 'overwhelmed'] as const

interface TodayScreenProps {
  sessions: Session[]
  saveSessions: boolean
  onStart: () => void
  onQuickComplete: (selection: BaseEmotion, result: AnalysisResult) => void
  onOpenJournal: () => void
}

export function TodayScreen({ sessions, saveSessions, onStart, onQuickComplete, onOpenJournal }: TodayScreenProps) {
  const { language, section } = useLanguage()
  const t = section('today')
  const recent = sessions[0]
  const quick = QUICK_IDS.map(getCanonicalEmotion).filter((item): item is NonNullable<typeof item> => Boolean(item))

  return (
    <div className="screen" data-testid="today-screen">
      <p className="screen-eyebrow">{t.eyebrow}</p>
      <h1 id="screen-title" className="screen-title" tabIndex={-1}>{t.title}</h1>
      <p className="screen-lede">{t.lede}</p>

      <button type="button" className="primary-button mt-6" onClick={onStart}>
        {t.checkIn}
        <ArrowRight size={19} aria-hidden="true" />
      </button>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="section-heading">{t.quickTitle}</h2>
        <p className="muted text-sm mt-0 mb-3">{t.quickPrompt}</p>
        <div className="quick-strip">
          {quick.map((emotion) => (
            <button
              type="button"
              key={emotion.id}
              data-testid={`quick-feeling-${emotion.id}`}
              onClick={() => onQuickComplete(emotion, {
                id: emotion.id,
                label: emotion.label,
                color: emotion.color,
                description: emotion.description,
                needs: emotion.needs,
              })}
            >
              <span className="quick-dot" style={{ backgroundColor: emotion.color }} aria-hidden="true" />
              {emotion.label[language]}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="section-heading">{t.recentTitle}</h2>
        <div className="soft-panel recent-thread">
          {recent ? (
            <>
              <div className="recent-thread-main">
                <span className="muted text-xs">{new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(recent.timestamp)}</span>
                <strong>{recent.results.slice(0, 3).map((result) => result.label[language]).join(', ')}</strong>
              </div>
              <button type="button" className="icon-button" onClick={onOpenJournal} aria-label={t.continue}>
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </>
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
