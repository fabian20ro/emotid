import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Session } from '../data/types'
import { useLanguage } from '../context/LanguageContext'

type Presentation = typeof import('../data/session-presentation')

export function RecentThread({ session, onOpenJournal }: { session: Session; onOpenJournal: () => void }) {
  const { language, section } = useLanguage()
  const t = section('today')
  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    void import('../data/session-presentation').then(
      (module) => { if (active) setPresentation(module) },
      () => { if (active) setFailed(true) },
    )
    return () => { active = false }
  }, [])

  return (
    <>
      <div className="recent-thread-main">
        <span className="muted text-xs">{new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(session.timestamp)}</span>
        {presentation ? <>
          <strong>{presentation.getSessionResultHeading(session, language, t.rejectedResult)}</strong>
          <span className="muted text-xs">{section('journalScreen').relationship[presentation.getResultRelationship(session)]}</span>
        </> : <p className="muted text-sm m-0" role="status">{failed ? t.recentUnavailable : t.recentLoading}</p>}
      </div>
      <button type="button" className="icon-button" onClick={onOpenJournal} aria-label={t.continue}>
        <ArrowRight size={19} aria-hidden="true" />
      </button>
    </>
  )
}
