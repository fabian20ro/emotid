import { ArrowRight, GitBranch, LockKeyhole } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import type { Session } from '../data/types'
import { computeVocabulary } from '../data/vocabulary'
import { computeValenceRatio } from '../data/valence-ratio'
import { computeSomaticPatterns } from '../data/somatic-patterns'
import { getSomaticRegionLabel } from '../models/somatic/display'
import { getResultRelationship } from '../data/session-presentation'

interface JournalScreenProps {
  sessions: Session[]
  loading: boolean
  error?: boolean
  saveSessions: boolean
  onOpenSession: (id: string) => void
  onOpenChain: () => void
}

export function JournalScreen({ sessions, loading, error = false, saveSessions, onOpenSession, onOpenChain }: JournalScreenProps) {
  const { language, section } = useLanguage()
  const t = section('journalScreen')
  const historyT = section('history')
  const vocab = computeVocabulary(sessions)
  const valence = computeValenceRatio(sessions)
  const somatic = computeSomaticPatterns(sessions)

  return (
    <div className="screen" data-testid="journal-screen">
      <ScreenHeader eyebrow={t.eyebrow} title={t.title} lede={t.lede} />

      {sessions.length > 0 && (
        <section aria-labelledby="patterns-title">
          <h2 id="patterns-title" className="section-heading">{t.patterns}</h2>
          <div className="journal-stats">
            <div><strong>{sessions.length}</strong><span>{historyT.vocabSessions.replace('{count}', '')}</span></div>
            <div><strong>{vocab.uniqueEmotionCount}</strong><span>{historyT.vocabEmotions.replace('{count}', '')}</span></div>
          </div>
          {vocab.topActiveEmotions.length > 0 && <div className="pattern-words">{vocab.topActiveEmotions.slice(0, 6).map((emotion) => <span key={emotion.id}>{emotion.label[language]} <b>{emotion.count}</b></span>)}</div>}
          {valence.total > 0 && <div className="pattern-row"><span>{historyT.valenceTitle}</span><strong>{historyT.valencePleasant.replace('{count}', String(valence.pleasant))} / {historyT.valenceUnpleasant.replace('{count}', String(valence.unpleasant))}</strong><small>{historyT.valenceNote}</small></div>}
          {somatic.regionFrequencies.length > 0 && <div className="pattern-row"><span>{historyT.somaticTitle}</span><strong>{somatic.regionFrequencies.slice(0, 3).map((item) => `${getSomaticRegionLabel(item.regionId, language)} (${item.count})`).join(', ')}</strong></div>}
        </section>
      )}

      <section aria-labelledby="recent-reflections-title">
        <h2 id="recent-reflections-title" className="section-heading">{t.recent}</h2>
        {loading ? (
          <p className="muted" role="status">{t.loading}</p>
        ) : error ? (
          <div className="soft-panel journal-empty" role="alert">
            <strong>{t.errorTitle}</strong>
            <p>{t.errorBody}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="soft-panel journal-empty">
            <LockKeyhole size={24} aria-hidden="true" />
            <strong>{t.emptyTitle}</strong>
            <p>{saveSessions ? t.emptyBody : section('reflectionScreen').notSaved}</p>
          </div>
        ) : (
          <div className="journal-list">
            {sessions.map((session) => {
              const relationship = getResultRelationship(session)
              return (
                <button type="button" key={session.id} onClick={() => onOpenSession(session.id)} aria-label={`${t.open}: ${session.results.map((r) => r.label[language]).join(', ')}. ${t.relationship[relationship]}`}>
                  <span>
                    <small>{new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(session.timestamp)}</small>
                    <strong>{session.results.slice(0, 3).map((r) => r.label[language]).join(', ')}</strong>
                    <small>{t.relationship[relationship]}</small>
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        )}
      </section>

      <button type="button" className="secondary-button mt-6" onClick={onOpenChain}>
        <GitBranch size={19} aria-hidden="true" />
        {t.unpack}
      </button>
    </div>
  )
}
