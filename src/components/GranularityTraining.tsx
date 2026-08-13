import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  GRANULARITY_SETS,
  getGranularityLabel,
  getValidGranularitySets,
  type GranularityDistinction,
} from '../data/granularity-triads'
import { ScreenHeader } from './ScreenHeader'

const DISTINCTION_FALLBACKS: Record<GranularityDistinction, string> = {
  intensity: 'These words can differ by emotional intensity, from mild to strong.',
  duration: 'These words can differ by duration and perceived weight over time.',
  focus: 'These words can differ by where attention turns: self, social image, or repair.',
  time: 'These words can differ by time orientation: present interest, active exploration, or future readiness.',
}

type StepAnswer = string | 'not-sure'

interface GranularityTrainingProps {
  isOpen: boolean
  onClose: () => void
}

function formatTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((text, [key, value]) => {
    return text.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }, template)
}

export function GranularityTraining({ isOpen, onClose }: GranularityTrainingProps) {
  const { language, section } = useLanguage()
  const granularityT = section('granularity')

  const validSets = useMemo(() => getValidGranularitySets(GRANULARITY_SETS), [])
  const totalSteps = validSets.length

  const [stepIndex, setStepIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState<StepAnswer | null>(null)
  const [completed, setCompleted] = useState(false)

  const resetSession = useCallback(() => {
    setStepIndex(0)
    setCurrentAnswer(null)
    setCompleted(false)
  }, [])

  const handleClose = useCallback(() => {
    resetSession()
    onClose()
  }, [onClose, resetSession])

  useEffect(() => {
    if (isOpen) resetSession()
  }, [isOpen, resetSession])

  const currentSet = validSets[stepIndex]

  const distinctionTemplate =
    (granularityT.distinctions as Partial<Record<GranularityDistinction, string>> | undefined)?.[currentSet?.distinction as GranularityDistinction]

  const feedbackLine2 = currentSet
    ? distinctionTemplate ?? DISTINCTION_FALLBACKS[currentSet.distinction]
    : ''

  const feedbackLine1 = currentAnswer && currentAnswer !== 'not-sure'
    ? formatTemplate(
      granularityT.feedbackSelected ?? 'You chose {emotion}. If that is closest to your experience, your choice is valid.',
      { emotion: getGranularityLabel(currentAnswer, language) },
    )
    : granularityT.feedbackNotSure ?? 'You can continue without choosing among these words.'

  const handleContinue = () => {
    if (!currentSet || currentAnswer === null) return

    if (stepIndex >= totalSteps - 1) {
      setCompleted(true)
      return
    }

    setStepIndex((prev) => prev + 1)
    setCurrentAnswer(null)
  }

  if (!isOpen) return null

  return (
    <div className="screen guided-screen" data-testid="granularity-screen">
      <ScreenHeader
        onBack={handleClose}
        eyebrow={granularityT.eyebrow}
        title={granularityT.title ?? 'Notice the difference'}
        lede={granularityT.lede}
      />

      {totalSteps === 0 && (
        <div className="soft-panel guided-empty" id="granularity-body">
          <p>{granularityT.errorBody ?? 'Practice sets are unavailable right now. Please try again later.'}</p>
          <button type="button" onClick={handleClose} className="primary-button">{granularityT.close ?? 'Close'}</button>
        </div>
      )}

      {totalSteps > 0 && completed && (
        <section className="guided-complete" id="granularity-body" aria-labelledby="granularity-complete-title">
          <h2 id="granularity-complete-title">{granularityT.completedTitle ?? 'Practice complete'}</h2>
          <p>{granularityT.completedBody ?? 'You practiced noticing subtle differences between similar emotions.'}</p>
          <p className="muted">{granularityT.completedEncouragement ?? 'Emotional nuance grows through repetition, not perfection.'}</p>
          <div className="guided-actions">
            <button type="button" onClick={resetSession} className="secondary-button">{granularityT.restart ?? 'Restart'}</button>
            <button type="button" onClick={handleClose} className="primary-button">{granularityT.close ?? 'Close'}</button>
          </div>
        </section>
      )}

      {totalSteps > 0 && !completed && currentSet && (
        <section id="granularity-body" className="guided-step" aria-labelledby="granularity-prompt">
          <div className="guided-progress">
            <span>{formatTemplate(granularityT.progress ?? 'Step {current} of {total}', { current: String(stepIndex + 1), total: String(totalSteps) })}</span>
            <progress value={stepIndex + 1} max={totalSteps} />
          </div>
          <h2 id="granularity-prompt">{granularityT.prompt ?? 'Which word feels closest?'}</h2>
          <div className="guided-options">
            {currentSet.options.map((option) => {
              const active = currentAnswer === option.id
              return (
                <button type="button" key={option.id} onClick={() => setCurrentAnswer(option.id)} aria-pressed={active} className={`guided-option${active ? ' is-selected' : ''}`}>
                  {getGranularityLabel(option.id, language)}
                </button>
              )
            })}
            <button type="button" onClick={() => setCurrentAnswer('not-sure')} aria-pressed={currentAnswer === 'not-sure'} className={`guided-option guided-unsure${currentAnswer === 'not-sure' ? ' is-selected' : ''}`}>
              {granularityT.notSure ?? 'Not sure yet'}
            </button>
          </div>
          {currentAnswer && (
            <div className="guided-feedback" role="status" aria-live="polite">
              <strong>{feedbackLine1}</strong>
              <p>{feedbackLine2}</p>
            </div>
          )}
          <div className="guided-primary-action">
            <button type="button" onClick={handleContinue} disabled={currentAnswer === null} className="primary-button guided-primary">
              {granularityT.continue ?? 'Continue'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
