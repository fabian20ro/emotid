import { lazy, Suspense, useState } from 'react'
import { Check, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { ScreenHeader } from '../components/ScreenHeader'
import { useLanguage } from '../context/LanguageContext'
import { useEmotionModel } from '../hooks/useEmotionModel'
import { MODEL_IDS } from '../models/constants'
import { INTENSITY_LABELS, SENSATION_CONFIG } from '../models/somatic/display'
import type { SomaticRegion, SomaticSelection, SensationType } from '../models/somatic/types'
import type { BodySide } from '../components/BodyRegionMap'
import type { AnalysisResult, BaseEmotion } from '../models/types'

type BodyStep = 'region' | 'sensation' | 'intensity' | 'review'

const BodyRegionMap = lazy(async () => {
  const module = await import('../components/BodyRegionMap')
  return { default: module.BodyRegionMap }
})

interface BodyCompassScreenProps {
  onBack: () => void
  onComplete: (modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void
}

function isSomaticSelection(selection: BaseEmotion): selection is SomaticSelection {
  return 'selectedSensation' in selection && 'selectedIntensity' in selection
}

export function BodyCompassScreen({ onBack, onComplete }: BodyCompassScreenProps) {
  const { language, section } = useLanguage()
  const t = section('bodyCompass')
  const somaticT = section('somatic')
  const model = useEmotionModel(MODEL_IDS.SOMATIC)
  const [step, setStep] = useState<BodyStep>('region')
  const [activeRegion, setActiveRegion] = useState<SomaticRegion | null>(null)
  const [draftSensation, setDraftSensation] = useState<SensationType | null>(null)
  const [bodySide, setBodySide] = useState<BodySide>('front')
  const selections = model.selections.filter(isSomaticSelection)
  const regions = model.visibleEmotions as SomaticRegion[]

  const startRegion = (region: SomaticRegion) => {
    const existing = selections.find((selection) => selection.id === region.id)
    setActiveRegion(region)
    setDraftSensation(existing?.selectedSensation ?? null)
    setStep('sensation')
  }

  const chooseSensation = (sensation: SensationType) => {
    setDraftSensation(sensation)
    setStep('intensity')
  }

  const chooseIntensity = (selectedIntensity: 1 | 2 | 3) => {
    if (!activeRegion || !draftSensation) return
    const selection: SomaticSelection = {
      ...activeRegion,
      selectedSensation: draftSensation,
      selectedIntensity,
    }
    model.handleSelect(selection)
    setStep('review')
  }

  const returnToRegions = () => {
    setActiveRegion(null)
    setDraftSensation(null)
    setStep('region')
  }

  const handleBack = () => {
    if (step === 'region') onBack()
    else if (step === 'intensity') setStep('sensation')
    else returnToRegions()
  }

  const removeSelection = (selection: SomaticSelection) => {
    model.handleDeselect(selection)
    if (selections.length === 1) returnToRegions()
  }

  const finish = () => {
    const results = model.analyze()
    if (selections.length > 0 && results.length > 0) {
      onComplete(MODEL_IDS.SOMATIC, selections, results)
    }
  }

  const titles: Record<BodyStep, string> = {
    region: t.title,
    sensation: somaticT.pickSensation,
    intensity: somaticT.pickIntensity,
    review: t.reviewTitle,
  }
  const ledes: Record<BodyStep, string> = {
    region: t.lede,
    sensation: t.sensationHint.replace('{region}', activeRegion?.label[language].toLowerCase() ?? ''),
    intensity: t.intensityHint,
    review: t.reviewLede,
  }
  const stepNumber = step === 'region' ? 1 : step === 'sensation' ? 2 : 3

  return (
    <div className="screen checkin-screen body-compass-screen" data-testid="body-screen">
      <ScreenHeader onBack={handleBack} eyebrow={t.eyebrow} title={titles[step]} lede={ledes[step]} />

      <ol className="body-progress" aria-label={t.progress}>
        {([t.region, t.sensation, t.intensity] as const).map((label, index) => {
          const number = index + 1
          const complete = step === 'review' || number < stepNumber
          const current = step !== 'review' && number === stepNumber
          return (
            <li key={label} className={complete ? 'is-complete' : current ? 'is-current' : ''} aria-current={current ? 'step' : undefined}>
              <span>{complete ? <Check size={13} aria-hidden="true" /> : number}</span>
              {label}
            </li>
          )
        })}
      </ol>

      {step === 'region' && (
        <>
          <p className="body-stage-hint">{t.regionHint}</p>
          <div className="model-stage model-stage-body">
            <div className="body-side-switch segmented" role="group" aria-label={somaticT.bodySide}>
              <button type="button" className={bodySide === 'front' ? 'is-active' : ''} aria-pressed={bodySide === 'front'} onClick={() => setBodySide('front')}>
                {somaticT.front}
              </button>
              <button type="button" className={bodySide === 'back' ? 'is-active' : ''} aria-pressed={bodySide === 'back'} onClick={() => setBodySide('back')}>
                {somaticT.back}
              </button>
            </div>
            {model.modelReady ? (
              <Suspense fallback={<div className="model-loading">...</div>}>
                <BodyRegionMap
                  regions={regions}
                  selections={selections}
                  side={bodySide}
                  onRegionActivate={startRegion}
                />
              </Suspense>
            ) : <div className="model-loading">...</div>}
          </div>
          <div className="body-region-actions">
            {selections.length > 0 && (
              <button type="button" className="primary-button" onClick={() => setStep('review')}>
                {t.review}<ChevronRight size={19} aria-hidden="true" />
              </button>
            )}
            <button type="button" className="text-button" onClick={onBack}>{t.notNow}</button>
          </div>
        </>
      )}

      {step === 'sensation' && activeRegion && (
        <div className="body-choice-grid" role="group" aria-label={somaticT.pickSensation}>
          {activeRegion.commonSensations.map((sensation) => {
            const config = SENSATION_CONFIG[sensation]
            return (
              <button type="button" key={sensation} className={draftSensation === sensation ? 'is-selected' : ''} onClick={() => chooseSensation(sensation)}>
                <span className="body-choice-icon" aria-hidden="true">{config.icon}</span>
                <strong>{config.label[language]}</strong>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )
          })}
          <button type="button" className="text-button body-abandon" onClick={returnToRegions}>{t.chooseAnother}</button>
        </div>
      )}

      {step === 'intensity' && draftSensation && (
        <div className="body-intensity-list" role="group" aria-label={somaticT.pickIntensity}>
          <div className="body-draft-label">
            <span aria-hidden="true">{SENSATION_CONFIG[draftSensation].icon}</span>
            {SENSATION_CONFIG[draftSensation].label[language]}
          </div>
          {([1, 2, 3] as const).map((intensity) => (
            <button type="button" key={intensity} onClick={() => chooseIntensity(intensity)}>
              <span className="body-intensity-dots" aria-hidden="true">
                {[1, 2, 3].map((dot) => <i key={dot} className={dot <= intensity ? 'is-on' : ''} />)}
              </span>
              <span><strong>{INTENSITY_LABELS[intensity][language]}</strong><small>{INTENSITY_LABELS[intensity].anchor[language]}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="text-button body-abandon" onClick={returnToRegions}>{t.chooseAnother}</button>
        </div>
      )}

      {step === 'review' && (
        <>
          <p className="body-stage-hint body-evidence-note" data-testid="body-evidence-note">{t.evidenceNote}</p>
          <div className="body-review-list" aria-live="polite">
            {selections.map((selection) => (
              <div className="body-signal-card" key={selection.id} data-testid={`body-signal-${selection.id}`}>
                <span className="body-signal-swatch" style={{ background: selection.color }} aria-hidden="true" />
                <span className="body-signal-copy">
                  <strong>{selection.label[language]}</strong>
                  <small>{SENSATION_CONFIG[selection.selectedSensation].label[language]} - {INTENSITY_LABELS[selection.selectedIntensity][language]}</small>
                </span>
                <button type="button" className="icon-button" aria-label={`${t.edit} ${selection.label[language]}`} onClick={() => startRegion(selection)}><Pencil size={17} aria-hidden="true" /></button>
                <button type="button" className="icon-button" aria-label={`${t.remove} ${selection.label[language]}`} onClick={() => removeSelection(selection)}><Trash2 size={17} aria-hidden="true" /></button>
              </div>
            ))}
          </div>
          <button type="button" className="secondary-button body-add" onClick={returnToRegions}><Plus size={18} aria-hidden="true" />{t.addAnother}</button>
          <div className="route-action">
            <button type="button" className="primary-button" disabled={selections.length === 0} onClick={finish}>
              {t.continue}<ChevronRight size={19} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
