import { useEffect, useState, type ComponentType } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  getLoadedCheckInFeature,
  loadCheckInFeature,
  type CheckInFeatureProps,
  type FeatureRoute,
} from '../features/check-in/registry'
import { useLanguage } from '../context/LanguageContext'
import { RouteLoading } from './LazyRouteBoundary'

interface CheckInFeatureBoundaryProps extends CheckInFeatureProps {
  route: FeatureRoute
}

export function CheckInFeatureBoundary({
  route,
  onBack,
  onComplete,
}: CheckInFeatureBoundaryProps) {
  const { section } = useLanguage()
  const t = section('routeLoading')
  const [attempt, setAttempt] = useState(0)
  const [Screen, setScreen] = useState<ComponentType<CheckInFeatureProps> | null>(
    () => getLoadedCheckInFeature(route) ?? null,
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const loaded = getLoadedCheckInFeature(route)
    setScreen(() => loaded ?? null)
    setFailed(false)
    if (loaded) return () => {
      active = false
    }

    void loadCheckInFeature(route).then(
      (FeatureScreen) => {
        if (active) setScreen(() => FeatureScreen)
      },
      () => {
        if (active) setFailed(true)
      },
    )
    return () => {
      active = false
    }
  }, [attempt, route])

  if (Screen) return <Screen onBack={onBack} onComplete={onComplete} />

  if (failed) {
    return (
      <div className="screen route-load-state" data-testid="route-load-error">
        <h1 id="screen-title" className="screen-title" tabIndex={-1}>{t.errorTitle}</h1>
        <p>{t.errorBody}</p>
        <button type="button" className="primary-button" onClick={() => setAttempt((value) => value + 1)}>
          <RotateCcw size={18} aria-hidden="true" />
          {t.retry}
        </button>
        <button type="button" className="text-button" onClick={onBack}>{t.back}</button>
      </div>
    )
  }

  return <RouteLoading />
}
