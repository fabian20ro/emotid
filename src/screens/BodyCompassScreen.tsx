import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { Check, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { ScreenHeader } from '../components/ScreenHeader'
import { useLanguage } from '../context/LanguageContext'
import { useEmotionModel } from '../hooks/useEmotionModel'
import { MODEL_IDS } from '../models/constants'
import { INTENSITY_LABELS, SENSATION_CONFIG } from '../models/somatic/display'
import { isCompleteSomaticSelection } from '../models/somatic/scoring'
import type { BodyGroup, SomaticRegion, SomaticSelection, SensationType } from '../models/somatic/types'
import type { BodySide } from '../components/BodyRegionMap'
import type { AnalysisResult, BaseEmotion, EmotionModel } from '../models/types'

type BodyStep = 'region' | 'sensation' | 'intensity'
type BodyPickerMode = BodySide | 'list'
type FocusTarget = { kind: 'signal'; id: string } | { kind: 'picker' } | null

const BODY_GROUPS: BodyGroup[] = ['head', 'torso', 'arms', 'legs']

const BodyRegionMap = lazy(async () => {
  const module = await import('../components/BodyRegionMap')
  return { default: module.BodyRegionMap }
})

interface BodyCompassScreenProps {
  model: EmotionModel<BaseEmotion>
  onBack: () => void
  onComplete: (modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void
}

export function BodyCompassScreen({ model: emotionModel, onBack, onComplete }: BodyCompassScreenProps) {
  const { language, section } = useLanguage()
  const t = section('bodyCompass')
  const somaticT = section('somatic')
  const model = useEmotionModel(emotionModel)
  const [step, setStep] = useState<BodyStep>('region')
  const [activeRegion, setActiveRegion] = useState<SomaticRegion | null>(null)
  const [draftSensation, setDraftSensation] = useState<SensationType | null>(null)
  const [pickerMode, setPickerMode] = useState<BodyPickerMode>('front')
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null)
  const [noSuggestion, setNoSuggestion] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const signalRefs = useRef(new Map<string, HTMLDivElement>())
  const selections = model.selections.filter(isCompleteSomaticSelection)
  const regions = Object.values(emotionModel.allEmotions) as SomaticRegion[]
  const groupLabels: Record<BodyGroup, string> = {
    head: t.groupHead,
    torso: t.groupTorso,
    arms: t.groupArms,
    legs: t.groupLegs,
  }

  useLayoutEffect(() => {
    if (step !== 'region' || !focusTarget) return
    const target = focusTarget.kind === 'signal'
      ? signalRefs.current.get(focusTarget.id)
      : pickerRef.current
    if (!target) return
    target.focus()
    setFocusTarget(null)
  }, [focusTarget, selections, step])

  const startRegion = (region: SomaticRegion) => {
    setNoSuggestion(false)
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
    setActiveRegion(null)
    setDraftSensation(null)
    setFocusTarget({ kind: 'signal', id: selection.id })
    setStep('region')
  }

  const returnToRegions = () => {
    setActiveRegion(null)
    setDraftSensation(null)
    setFocusTarget({ kind: 'picker' })
    setStep('region')
  }

  const handleBack = () => {
    if (step === 'region') onBack()
    else if (step === 'intensity') setStep('sensation')
    else returnToRegions()
  }

  const removeSelection = (selection: SomaticSelection) => {
    setNoSuggestion(false)
    const nextSelection = selections.find((candidate) => candidate.id !== selection.id)
    model.handleDeselect(selection)
    setFocusTarget(nextSelection ? { kind: 'signal', id: nextSelection.id } : { kind: 'picker' })
  }

  const finish = () => {
    const results = model.analyze()
    if (selections.length > 0 && results.length > 0) {
      onComplete(MODEL_IDS.SOMATIC, selections, results)
    } else if (selections.length > 0) setNoSuggestion(true)
  }

  const titles: Record<BodyStep, string> = {
    region: t.title,
    sensation: somaticT.pickSensation,
    intensity: somaticT.pickIntensity,
  }
  const ledes: Record<BodyStep, string> = {
    region: t.lede,
    sensation: t.sensationHint.replace('{region}', activeRegion?.label[language].toLowerCase() ?? ''),
    intensity: t.intensityHint,
  }
  const stepNumber = step === 'region' ? 1 : step === 'sensation' ? 2 : 3

  return (
    <div className="screen checkin-screen body-compass-screen" data-testid="body-screen">
      <ScreenHeader onBack={handleBack} eyebrow={t.eyebrow} title={titles[step]} lede={ledes[step]} />

      <ol className="body-progress" aria-label={t.progress}>
        {([t.region, t.sensation, t.intensity] as const).map((label, index) => {
          const number = index + 1
          const complete = number < stepNumber
          const current = number === stepNumber
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
          <div className={`model-stage model-stage-body${pickerMode === 'list' ? ' is-list' : ''}`}>
            <div ref={pickerRef} tabIndex={-1} className="body-side-switch segmented" role="group" aria-label={somaticT.bodySide}>
              <button type="button" className={pickerMode === 'front' ? 'is-active' : ''} aria-pressed={pickerMode === 'front'} onClick={() => setPickerMode('front')}>
                {somaticT.front}
              </button>
              <button type="button" className={pickerMode === 'back' ? 'is-active' : ''} aria-pressed={pickerMode === 'back'} onClick={() => setPickerMode('back')}>
                {somaticT.back}
              </button>
              <button type="button" className={pickerMode === 'list' ? 'is-active' : ''} aria-pressed={pickerMode === 'list'} onClick={() => setPickerMode('list')}>
                {t.list}
              </button>
            </div>
            {pickerMode === 'list' ? (
              <div className="body-region-list" role="group" aria-label={t.areasLabel}>
                {BODY_GROUPS.map((group) => {
                  const groupRegions = regions.filter((region) => region.group === group)
                  if (groupRegions.length === 0) return null
                  return (
                    <section key={group}>
                      <h2>{groupLabels[group]}</h2>
                      <div>
                        {groupRegions.map((region) => {
                          const selection = selections.find((candidate) => candidate.id === region.id)
                          return (
                            <button
                              type="button"
                              key={region.id}
                              aria-label={region.label[language]}
                              aria-pressed={Boolean(selection)}
                              className={selection ? 'is-selected' : ''}
                              onClick={() => startRegion(region)}
                            >
                              <span className="body-list-swatch" style={{ background: region.color }} aria-hidden="true" />
                              <span>
                                <strong>{region.label[language]}</strong>
                                {selection && <small>{SENSATION_CONFIG[selection.selectedSensation].label[language]} - {INTENSITY_LABELS[selection.selectedIntensity][language]}</small>}
                              </span>
                              <ChevronRight size={18} aria-hidden="true" />
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            ) : model.modelReady ? (
              <Suspense fallback={<div className="model-loading">...</div>}>
                <BodyRegionMap
                  regions={regions}
                  selections={selections}
                  side={pickerMode}
                  onRegionActivate={startRegion}
                />
              </Suspense>
            ) : <div className="model-loading">...</div>}
          </div>
          {selections.length === 0 && <div className="body-region-actions"><button type="button" className="text-button" onClick={onBack}>{t.notNow}</button></div>}

          {selections.length > 0 && (
            <section className="body-signal-section" aria-labelledby="body-signals-title">
              <h2 id="body-signals-title">{t.signalsTitle}</h2>
              <div className="body-signal-list" aria-live="polite">
                {selections.map((selection) => (
                  <div
                    ref={(node) => {
                      if (node) signalRefs.current.set(selection.id, node)
                      else signalRefs.current.delete(selection.id)
                    }}
                    tabIndex={-1}
                    className="body-signal-card"
                    key={selection.id}
                    data-testid={`body-signal-${selection.id}`}
                  >
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
              <p className="body-stage-hint body-evidence-note" data-testid="body-evidence-note">{t.evidenceNote}</p>
              <div className="route-action">
                {noSuggestion ? <div data-testid="body-no-suggestion">
                  <h2>{t.noSuggestionTitle}</h2>
                  <p role="status">{t.noSuggestionBody}</p>
                  <button type="button" className="primary-button" onClick={() => onComplete(MODEL_IDS.SOMATIC, selections, [])}>{t.keepObservation}</button>
                  <button type="button" className="secondary-button" onClick={() => setNoSuggestion(false)}>{t.reviseSignals}</button>
                  <button type="button" className="text-button" onClick={onBack}>{t.leaveWithoutSaving}</button>
                </div> :
                <button type="button" className="primary-button" onClick={finish}>
                  {t.continue}<ChevronRight size={19} aria-hidden="true" />
                </button>}
              </div>
            </section>
          )}
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

    </div>
  )
}
