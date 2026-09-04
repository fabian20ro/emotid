import { lazy } from 'react'
import { ArrivalScreen } from '../../../screens/ArrivalScreen'
import { CheckInFeatureBoundary } from '../../../components/CheckInFeatureBoundary'
import { LazyRouteBoundary } from '../../../components/LazyRouteBoundary'
import type { AnalysisResult, BaseEmotion } from '../../../models/types'
import type {
  AppDestination,
  CheckInCompletion,
  CheckInRoute,
  ReflectionDetail,
  ReflectionSaveOutcome,
  SessionSaveState,
} from '../../../navigation/types'

const ReflectionScreen = lazy(async () => {
  const module = await import('../../../screens/ReflectionScreen')
  return { default: module.ReflectionScreen }
})

type CheckInDestination = Extract<
  AppDestination,
  { name: 'arrival' | 'check-in' | 'reflection' }
>

interface CheckInFlowHostProps {
  destination: CheckInDestination
  completion?: CheckInCompletion
  allowExternalAI: boolean
  saveState: SessionSaveState
  sessionCaptured: boolean
  onBack: () => void
  onGuideStepChange?: (step: 'closed' | 'body' | 'placement') => void
  onChoose: (route: Exclude<CheckInRoute, 'quick'>) => void
  onComplete: (
    route: CheckInRoute,
    modelId: string,
    selections: BaseEmotion[],
    results: AnalysisResult[],
  ) => void
  onRetryBaseSave: () => void
  onSaveReflection: (detail: ReflectionDetail) => Promise<ReflectionSaveOutcome>
  onFinish: () => void
}

export function CheckInFlowHost({
  destination,
  completion,
  allowExternalAI,
  saveState,
  sessionCaptured,
  onBack,
  onGuideStepChange,
  onChoose,
  onComplete,
  onRetryBaseSave,
  onSaveReflection,
  onFinish,
}: CheckInFlowHostProps) {
  if (destination.name === 'arrival') {
    return <ArrivalScreen initialGuideStep={destination.guideStep ?? 'body'} onGuideStepChange={onGuideStepChange} onBack={onBack} onChoose={onChoose} />
  }

  if (destination.name === 'check-in') {
    return (
      <CheckInFeatureBoundary
        route={destination.route}
        onBack={onBack}
        onComplete={(modelId, selections, results) => {
          onComplete(destination.route, modelId, selections, results)
        }}
      />
    )
  }

  if (!completion) return null

  return (
    <LazyRouteBoundary>
      <ReflectionScreen
        completion={completion}
        allowExternalAI={allowExternalAI}
        saveState={saveState}
        sessionCaptured={sessionCaptured}
        onBack={onBack}
        onRetryBaseSave={onRetryBaseSave}
        onSave={onSaveReflection}
        onFitChange={onSaveReflection}
        onReturn={onFinish}
      />
    </LazyRouteBoundary>
  )
}
