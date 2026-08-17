import { Suspense, useEffect, useRef } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useEmotionModel } from '../hooks/useEmotionModel'
import { MODEL_IDS } from '../models/constants'
import { ModelVisualization } from '../components/ModelVisualization'
import { ScreenHeader } from '../components/ScreenHeader'
import type { AnalysisResult, BaseEmotion, EmotionModel } from '../models/types'
import type { CheckInRoute } from '../navigation/types'

interface ModelCheckInScreenProps {
  route: Extract<CheckInRoute, 'affect' | 'plutchik'>
  model: EmotionModel<BaseEmotion>
  onBack: () => void
  onComplete: (modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void
}

const MODEL_BY_ROUTE = {
  affect: MODEL_IDS.DIMENSIONAL,
  plutchik: MODEL_IDS.PLUTCHIK,
} as const

export function ModelCheckInScreen({ route, model: emotionModel, onBack, onComplete }: ModelCheckInScreenProps) {
  const { language, section } = useLanguage()
  const modelId = MODEL_BY_ROUTE[route]
  const model = useEmotionModel(emotionModel)
  const affectT = section('affectMap')
  const plutchikT = section('plutchik')

  const copy = route === 'affect'
      ? { eyebrow: affectT.eyebrow, title: affectT.title, lede: affectT.lede, step: affectT.step, action: affectT.continue }
      : { eyebrow: plutchikT.eyebrow, title: plutchikT.title, lede: plutchikT.lede, step: plutchikT.step, action: plutchikT.continue }

  const requiredSelections = route === 'plutchik' ? 2 : 1
  const plutchikCombo = route === 'plutchik' ? model.combos[0] : undefined
  const completionRef = useRef<HTMLDivElement>(null)
  const readyToComplete = model.modelReady && model.selections.length >= requiredSelections

  useEffect(() => {
    if (!readyToComplete) return
    const frame = window.requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      completionRef.current?.scrollIntoView({ block: 'nearest', behavior })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [readyToComplete])

  const finish = () => {
    const results = model.analyze()
    if (model.selections.length > 0 && results.length > 0) onComplete(modelId, model.selections, results)
  }

  return (
    <div className={`screen checkin-screen checkin-screen-${route}`} data-testid={`${route}-screen`}>
      <ScreenHeader onBack={onBack} eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
      <div className="checkin-step"><span>{copy.step}</span>{model.selections.length > 0 && <span><Check size={15} aria-hidden="true" />{model.selections.length}</span>}</div>

      <div className={`model-stage model-stage-${route}`}>
        <Suspense fallback={<div className="model-loading">...</div>}>
          <ModelVisualization
            modelId={modelId}
            emotions={model.visibleEmotions}
            selections={model.selections}
            sizes={model.sizes}
            progressive
            onSelect={model.handleSelect}
            onDeselect={model.handleDeselect}
          />
        </Suspense>
      </div>

      {model.selections.length > 0 && (
        <div className="selection-summary" aria-live="polite">
          {model.selections.map((selection) => (
            <button type="button" key={selection.id} onClick={() => model.handleDeselect(selection)}>
              <span style={{ background: selection.color }} aria-hidden="true" />
              {selection.label[language]}
            </button>
          ))}
        </div>
      )}

      <div ref={completionRef} className="route-completion">
        {plutchikCombo && (
          <div className="plutchik-combination" aria-live="polite" data-testid="plutchik-combination">
            <span>{plutchikT.combination}</span>
            <strong>{model.selections.slice(0, 2).map((selection) => selection.label[language]).join(' + ')}</strong>
            <span aria-hidden="true">&#8594;</span>
            <strong style={{ color: plutchikCombo.color }}>{plutchikCombo.label[language]}</strong>
          </div>
        )}

        <div className="route-action">
          <button type="button" className="primary-button" disabled={!readyToComplete} onClick={finish}>
            {copy.action}<ChevronRight size={19} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
