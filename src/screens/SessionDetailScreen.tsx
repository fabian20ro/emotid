import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { getIntensityLabel, getSensationLabel, getSomaticRegionLabel } from '../models/somatic/display'
import type { Session } from '../data/types'
import { getResultRelationship } from '../data/session-presentation'

export function SessionDetailScreen({ session, onBack }: { session?: Session; onBack: () => void }) {
  const { language, section } = useLanguage()
  const t = section('sessionDetail')
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

  return (
    <div className="screen" data-testid="session-detail-screen">
      <ScreenHeader title={t.title} onBack={onBack} lede={new Intl.DateTimeFormat(language, { dateStyle: 'long', timeStyle: 'short' }).format(session.timestamp)} />
      <dl className="detail-list">
        <div><dt>{t.relationship[relationship]}</dt><dd>{session.results.map((r) => r.label[language]).join(', ')}</dd></div>
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
    </div>
  )
}
