import { useState } from 'react'
import { ArrowRight, GitBranch, LockKeyhole } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import type { ChainAnalysisEntry, Session } from '../data/types'
import { computeVocabulary } from '../data/vocabulary'
import { computeValenceRatio } from '../data/valence-ratio'
import { computeSomaticPatterns } from '../data/somatic-patterns'
import { getSomaticRegionLabel } from '../models/somatic/display'
import { getEmotionDisplayLabel, getResultRelationship, getSessionResultHeading } from '../data/session-presentation'
import { getJournalEvidence } from '../data/journal-evidence'
import { getChainEntryPreview, getLatestChainEntry } from '../data/chain-presentation'

interface JournalScreenProps {
  sessions: Session[]
  loading: boolean
  chainEntries: ChainAnalysisEntry[]
  chainLoading: boolean
  error?: boolean
  saveSessions: boolean
  onOpenSession: (id: string) => void
  onOpenChain: () => void
}

export function JournalScreen({ sessions, loading, chainEntries, chainLoading, error = false, saveSessions, onOpenSession, onOpenChain }: JournalScreenProps) {
  const { language, section } = useLanguage()
  const t = section('journalScreen')
  const historyT = section('history')
  const [now] = useState(() => Date.now())
  const vocab = computeVocabulary(sessions)
  const valence = computeValenceRatio(sessions, now)
  const somatic = computeSomaticPatterns(sessions)
  const evidence = getJournalEvidence(sessions, now)
  const hasSummaryEvidence = evidence.vocabulary || evidence.valence || evidence.somatic
  const latestExercise = getLatestChainEntry(chainEntries)
  const latestExercisePreview = latestExercise ? getChainEntryPreview(latestExercise) : undefined

  return (
    <div className="screen" data-testid="journal-screen">
      <ScreenHeader eyebrow={t.eyebrow} title={t.title} lede={t.lede} />

      {sessions.length > 0 && (
        <section aria-labelledby="patterns-title">
          <h2 id="patterns-title" className="section-heading">{hasSummaryEvidence ? t.patterns : t.earlyTitle}</h2>
          {hasSummaryEvidence ? (
            <>
              {evidence.vocabulary && (
                <>
                  <div className="journal-stats">
                    <div><strong>{vocab.totalSessions}</strong><span>{historyT.vocabSessions.replace('{count}', '')}</span></div>
                    <div><strong>{vocab.uniqueEmotionCount}</strong><span>{historyT.vocabEmotions.replace('{count}', '')}</span></div>
                  </div>
                  {vocab.topActiveEmotions.length > 0 && <div className="pattern-words">{vocab.topActiveEmotions.slice(0, 6).map((emotion) => <span key={emotion.id}>{getEmotionDisplayLabel(emotion, language)} <b>{emotion.count}</b></span>)}</div>}
                </>
              )}
              {evidence.valence && valence.total > 0 && <div className="pattern-row"><span>{historyT.valenceTitle}</span><strong>{historyT.valencePleasant.replace('{count}', String(valence.pleasant))} / {historyT.valenceUnpleasant.replace('{count}', String(valence.unpleasant))}</strong><small>{historyT.valenceNote}</small></div>}
              {evidence.somatic && somatic.regionFrequencies.length > 0 && <div className="pattern-row"><span>{historyT.somaticTitle}</span><strong>{somatic.regionFrequencies.slice(0, 3).map((item) => `${getSomaticRegionLabel(item.regionId, language)} (${item.count})`).join(', ')}</strong></div>}
            </>
          ) : (
            <p className="muted text-sm">{t.earlyBody}</p>
          )}
        </section>
      )}

      {(chainLoading || (latestExercise && latestExercisePreview)) && (
        <section aria-labelledby="journal-exercises-title">
          <h2 id="journal-exercises-title" className="section-heading">{t.exercises}</h2>
          {chainLoading ? (
            <p className="muted" role="status">{t.loadingExercises}</p>
          ) : latestExercise && latestExercisePreview ? (
            <button
              type="button"
              className="journal-entry-button"
              onClick={onOpenChain}
              aria-label={`${t.openExercises}: ${latestExercisePreview.title}`}
            >
              <span>
                <small>{new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(latestExercise.timestamp)}</small>
                <strong>{latestExercisePreview.title}</strong>
                <small>{t.openExercises}</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : null}
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
            <strong>{latestExercise ? t.emptyEmotionTitle : t.emptyTitle}</strong>
            <p>{saveSessions ? t.emptyBody : section('reflectionScreen').notSaved}</p>
          </div>
        ) : (
          <div className="journal-list">
            {sessions.map((session) => {
              const relationship = getResultRelationship(session)
              const resultHeading = getSessionResultHeading(session, language, t.rejectedResult)
              return (
                <button type="button" className="journal-entry-button" key={session.id} onClick={() => onOpenSession(session.id)} aria-label={`${t.open}: ${resultHeading}. ${t.relationship[relationship]}`}>
                  <span>
                    <small>{new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(session.timestamp)}</small>
                    <strong>{resultHeading}</strong>
                    <small>{t.relationship[relationship]}</small>
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        )}
      </section>

      {!chainLoading && !latestExercise && (
        <button type="button" className="secondary-button mt-6" onClick={onOpenChain}>
          <GitBranch size={19} aria-hidden="true" />
          {t.unpack}
        </button>
      )}
    </div>
  )
}
