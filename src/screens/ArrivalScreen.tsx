import { useLayoutEffect, useState } from 'react'
import { focusDestination } from '../utils/focusDestination'
import { Activity, ArrowRight, Crosshair, ListTree, Sparkles } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import type { CheckInRoute } from '../navigation/types'

export type BodySignalAnswer = 'clear' | 'not-clear'
export type PlacementAnswer = 'can-place' | 'need-words'

export function chooseGuidedRoute(
  bodySignal: BodySignalAnswer | undefined,
  placement: PlacementAnswer | undefined,
): Exclude<CheckInRoute, 'quick'> | undefined {
  if (bodySignal === 'clear') return 'body'
  if (bodySignal !== 'not-clear') return undefined
  if (placement === 'can-place') return 'affect'
  if (placement === 'need-words') return 'words'
  return undefined
}

interface ArrivalScreenProps {
  initialGuideStep?: 'closed' | 'body' | 'placement'
  onGuideStepChange?: (step: 'closed' | 'body' | 'placement') => void
  onBack: () => void
  onChoose: (route: Exclude<CheckInRoute, 'quick'>) => void
}

export function ArrivalScreen({ onBack, onChoose, initialGuideStep = 'closed', onGuideStepChange }: ArrivalScreenProps) {
  const { section } = useLanguage()
  const t = section('arrival')
  const [guideStep, updateGuideStep] = useState(initialGuideStep)
  const setGuideStep = (step: 'closed' | 'body' | 'placement') => {
    updateGuideStep(step)
    onGuideStepChange?.(step)
  }
  useLayoutEffect(() => {
    focusDestination(document.getElementById('screen-title'))
  }, [guideStep])

  const routes = [
    { id: 'affect' as const, title: t.affect, hint: t.affectHint, Icon: Crosshair, tone: 'var(--mustard-soft)', color: 'var(--mustard)' },
    { id: 'words' as const, title: t.words, hint: t.wordsHint, Icon: ListTree, tone: 'var(--blue-soft)', color: 'var(--blue)' },
    { id: 'body' as const, title: t.body, hint: t.bodyHint, Icon: Activity, tone: 'var(--coral-soft)', color: 'var(--coral)' },
  ]

  const showAllRoutes = () => setGuideStep('closed')

  const handleBodyAnswer = (answer: BodySignalAnswer) => {
    const route = chooseGuidedRoute(answer, undefined)
    if (route) {
      onChoose(route)
      return
    }
    setGuideStep('placement')
  }

  const handlePlacementAnswer = (answer: PlacementAnswer) => {
    const route = chooseGuidedRoute('not-clear', answer)
    if (route) onChoose(route)
  }

  if (guideStep !== 'closed') {
    const asksAboutBody = guideStep === 'body'

    return (
      <div className="screen" data-testid="arrival-screen">
        <ScreenHeader
          onBack={asksAboutBody ? showAllRoutes : () => setGuideStep('body')}
          eyebrow={t.guideEyebrow}
          title={asksAboutBody ? t.guideBodyTitle : t.guidePlacementTitle}
          lede={asksAboutBody ? t.guideBodyHint : t.guidePlacementHint}
        />

        <div className="guide-options" data-testid={`arrival-guide-${guideStep}`}>
          {asksAboutBody ? (
            <>
              <button type="button" className="route-card guide-option" onClick={() => handleBodyAnswer('clear')}>
                <span className="route-icon" style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}>
                  <Activity size={22} aria-hidden="true" />
                </span>
                <span className="route-copy"><strong>{t.guideBodyYes}</strong><span>{t.guideBodyYesHint}</span></span>
                <ArrowRight size={18} className="muted" aria-hidden="true" />
              </button>
              <button type="button" className="route-card guide-option" onClick={() => handleBodyAnswer('not-clear')}>
                <span className="route-icon" style={{ background: 'var(--mustard-soft)', color: 'var(--mustard)' }}>
                  <Crosshair size={22} aria-hidden="true" />
                </span>
                <span className="route-copy"><strong>{t.guideBodyNotClear}</strong><span>{t.guideBodyNotClearHint}</span></span>
                <ArrowRight size={18} className="muted" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button type="button" className="route-card guide-option" onClick={() => handlePlacementAnswer('can-place')}>
                <span className="route-icon" style={{ background: 'var(--mustard-soft)', color: 'var(--mustard)' }}>
                  <Crosshair size={22} aria-hidden="true" />
                </span>
                <span className="route-copy"><strong>{t.guidePlacementYes}</strong><span>{t.guidePlacementYesHint}</span></span>
                <ArrowRight size={18} className="muted" aria-hidden="true" />
              </button>
              <button type="button" className="route-card guide-option" onClick={() => handlePlacementAnswer('need-words')}>
                <span className="route-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
                  <ListTree size={22} aria-hidden="true" />
                </span>
                <span className="route-copy"><strong>{t.guideWords}</strong><span>{t.guideWordsHint}</span></span>
                <ArrowRight size={18} className="muted" aria-hidden="true" />
              </button>
            </>
          )}
          <button type="button" className="text-button guide-all-routes" onClick={showAllRoutes}>
            {t.guideAllRoutes}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen" data-testid="arrival-screen">
      <ScreenHeader onBack={onBack} eyebrow={t.eyebrow} title={t.title} lede={t.lede} />

      <div className="route-grid">
        <button type="button" className="route-card route-card-recommended" data-testid="arrival-unsure" onClick={() => setGuideStep('body')}>
          <span className="route-icon" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}><Sparkles size={22} aria-hidden="true" /></span>
          <span className="route-copy"><strong>{t.unsure}</strong><span>{t.unsureHint}</span></span>
          <ArrowRight size={18} className="muted" aria-hidden="true" />
        </button>

        {routes.map(({ id, title, hint, Icon, tone, color }) => (
          <button type="button" className="route-card" key={id} data-testid={`arrival-${id}`} onClick={() => onChoose(id)}>
            <span className="route-icon" style={{ background: tone, color }}><Icon size={22} aria-hidden="true" /></span>
            <span className="route-copy"><strong>{title}</strong><span>{hint}</span></span>
            <ArrowRight size={18} className="muted" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
