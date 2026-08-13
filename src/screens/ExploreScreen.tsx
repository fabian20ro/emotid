import { Activity, Boxes, Crosshair, GraduationCap, ListTree } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import type { CheckInRoute } from '../navigation/types'

interface ExploreScreenProps {
  onChoose: (route: Exclude<CheckInRoute, 'quick'>) => void
  onPractice: () => void
}

export function ExploreScreen({ onChoose, onPractice }: ExploreScreenProps) {
  const { section } = useLanguage()
  const t = section('exploreScreen')
  const namingItems = [
    { id: 'affect' as const, label: t.affect, hint: t.affectHint, Icon: Crosshair, color: 'var(--mustard)', bg: 'var(--mustard-soft)' },
    { id: 'words' as const, label: t.words, hint: t.wordsHint, Icon: ListTree, color: 'var(--blue)', bg: 'var(--blue-soft)' },
    { id: 'body' as const, label: t.body, hint: t.bodyHint, Icon: Activity, color: 'var(--coral)', bg: 'var(--coral-soft)' },
  ]
  const learningItems = [
    { id: 'plutchik' as const, label: t.plutchik, hint: t.plutchikHint, Icon: Boxes, color: 'var(--teal)', bg: 'var(--teal-soft)' },
  ]

  const routeCard = ({ id, label, hint, Icon, color, bg }: (typeof namingItems)[number] | (typeof learningItems)[number]) => (
    <button type="button" className="route-card" key={id} data-testid={`explore-${id}`} onClick={() => onChoose(id)}>
      <span className="route-icon" style={{ color, background: bg }}><Icon size={22} aria-hidden="true" /></span>
      <span className="route-copy"><strong>{label}</strong><span>{hint}</span></span>
    </button>
  )

  return (
    <div className="screen" data-testid="explore-screen">
      <ScreenHeader eyebrow={t.eyebrow} title={t.title} lede={t.lede} />
      <section aria-labelledby="explore-naming-title">
        <h2 id="explore-naming-title" className="section-heading">{t.namingTitle}</h2>
        <div className="route-grid explore-route-grid">
          {namingItems.map(routeCard)}
        </div>
      </section>
      <section aria-labelledby="explore-learning-title">
        <h2 id="explore-learning-title" className="section-heading">{t.learningTitle}</h2>
        <div className="route-grid explore-route-grid">
          {learningItems.map(routeCard)}
          <button type="button" className="route-card" data-testid="explore-practice" onClick={onPractice}>
            <span className="route-icon" style={{ color: 'var(--blue)', background: 'var(--blue-soft)' }}><GraduationCap size={22} aria-hidden="true" /></span>
            <span className="route-copy"><strong>{t.practice}</strong><span>{t.practiceHint}</span></span>
          </button>
        </div>
      </section>
    </div>
  )
}
