import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, ExternalLink, HeartHandshake, Lightbulb, LoaderCircle, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { synthesize } from '../models/synthesis'
import { CrisisBanner } from '../components/CrisisBanner'
import { ScreenHeader } from '../components/ScreenHeader'
import { buildGoogleAiSearchUrl } from '../utils/google-ai-search'
import { focusDestination } from '../utils/focusDestination'
import type { CheckInCompletion, ReflectionAnswer, ReflectionDetail, ReflectionSaveOutcome, SessionSaveState } from '../navigation/types'

type FinishState = 'idle' | 'saving' | 'error'

interface ReflectionScreenProps {
  completion: CheckInCompletion
  allowExternalAI: boolean
  saveState: SessionSaveState
  sessionCaptured: boolean
  onBack: () => void
  onRetryBaseSave: () => void
  onSave: (detail: ReflectionDetail) => Promise<ReflectionSaveOutcome>
  onReturn: () => void
}

export function ReflectionScreen({ completion, allowExternalAI, saveState, sessionCaptured, onBack, onRetryBaseSave, onSave, onReturn }: ReflectionScreenProps) {
  const { language, section } = useLanguage()
  const t = section('reflectionScreen')
  const analyzeT = section('analyze')
  const results = completion.results
  const needs = useMemo(
    () => [...new Set(results.map((result) => result.needs?.[language]).filter((need): need is string => Boolean(need)))],
    [language, results],
  )
  const [fit, setFit] = useState<ReflectionAnswer | undefined>()
  const [selectedNeed, setSelectedNeed] = useState<string | undefined>()
  const [tier4Acknowledged, setTier4Acknowledged] = useState(false)
  const [showExploration, setShowExploration] = useState(false)
  const [showStep, setShowStep] = useState(false)
  const [finishState, setFinishState] = useState<FinishState>('idle')
  const [nextStep, setNextStep] = useState<string | undefined>()
  const screenRef = useRef<HTMLDivElement>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const restoreExplorationTriggerRef = useRef(false)
  const savingRef = useRef(false)
  const pendingDetailRef = useRef<ReflectionDetail | null>(null)
  const synthesis = useMemo(() => synthesize(results, language), [results, language])
  const emotionNames = results.map((result) => result.label[language]).join(', ')
  const briefSynthesis = `${emotionNames} ${t.briefSynthesis}`
  const requiresAcknowledge = completion.crisisTier === 'tier4' && !tier4Acknowledged
  const rejected = fit === 'no'
  const nextStepOptions = [t.stepPause, t.stepWrite, t.stepConnect]
  const aiLink = allowExternalAI
    ? buildGoogleAiSearchUrl(results, language, analyzeT)
    : null

  useLayoutEffect(() => {
    if (finishState === 'saving') return
    screenRef.current?.scrollIntoView?.({ block: 'start' })
    if (restoreExplorationTriggerRef.current) {
      restoreExplorationTriggerRef.current = false
      focusDestination(screenRef.current?.querySelector<HTMLElement>('[data-testid="reflection-explore-more"]') ?? null)
      return
    }
    focusDestination(screenRef.current?.querySelector<HTMLElement>('#screen-title') ?? null)
  }, [finishState, showExploration, showStep])

  useLayoutEffect(() => {
    if (completion.crisisTier === 'tier4' && tier4Acknowledged) {
      focusDestination(resultHeadingRef.current)
    }
  }, [completion.crisisTier, tier4Acknowledged])

  const attemptSave = async (detail: ReflectionDetail) => {
    if (savingRef.current) return
    savingRef.current = true
    pendingDetailRef.current = detail
    setFinishState('saving')
    try {
      const outcome = await onSave(detail)
      if (outcome === 'saved' || outcome === 'not-saved') onReturn()
    } catch {
      setFinishState('error')
    } finally {
      savingRef.current = false
    }
  }

  const finish = (step = nextStep) => {
    void attemptSave({
      reflectionAnswer: fit,
      selectedNeed: rejected ? undefined : selectedNeed,
      nextStep: rejected ? undefined : step,
    })
  }

  const retrySave = () => {
    if (pendingDetailRef.current) void attemptSave(pendingDetailRef.current)
  }

  const continueWithoutSaving = () => {
    onReturn()
  }

  const chooseFit = (answer: ReflectionAnswer) => {
    setFit(answer)
    setNextStep(undefined)
    if (answer === 'no') setSelectedNeed(undefined)
  }

  const closeExploration = () => {
    restoreExplorationTriggerRef.current = true
    setShowExploration(false)
  }

  if (finishState === 'error') {
    return (
      <div ref={screenRef} className="screen reflection-save-state" data-testid="reflection-save-error-screen">
        <span className="save-state-mark is-error"><TriangleAlert size={28} aria-hidden="true" /></span>
        <h1 id="screen-title" className="screen-title" tabIndex={-1}>
          {sessionCaptured ? t.detailSaveErrorTitle : t.baseSaveErrorTitle}
        </h1>
        <p className="screen-lede" role="alert">{sessionCaptured ? t.detailSaveErrorBody : t.saveErrorBody}</p>
        <div className="save-error-actions">
          <button type="button" className="primary-button" onClick={retrySave}>
            <RotateCcw size={18} aria-hidden="true" />{t.retrySave}
          </button>
          <button type="button" className="text-button" onClick={continueWithoutSaving}>
            {sessionCaptured ? t.finishWithoutDetails : t.continueWithoutSaving}
          </button>
        </div>
      </div>
    )
  }

  if (showStep) {
    return (
      <div ref={screenRef} className="screen" data-testid="next-step-screen" aria-busy={finishState === 'saving'}>
        <ScreenHeader title={t.nextStep} onBack={() => setShowStep(false)} lede={t.nextStepChoicePrompt} />
        {selectedNeed && <p className="next-step-need"><Lightbulb size={18} aria-hidden="true" />{t.need}: {selectedNeed}</p>}
        <div className="next-step-options" role="group" aria-label={t.nextStepChoicePrompt}>
          {nextStepOptions.map((option) => (
            <button
              type="button"
              key={option}
              className={nextStep === option ? 'is-active' : ''}
              aria-pressed={nextStep === option}
              onClick={() => setNextStep(nextStep === option ? undefined : option)}
            >
              <span className="need-choice-mark" aria-hidden="true">{nextStep === option && <Check size={16} />}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>
        <button type="button" className="primary-button mt-5" disabled={!nextStep || finishState === 'saving'} onClick={() => finish(nextStep)}>
          {finishState === 'saving' ? <LoaderCircle size={19} aria-hidden="true" /> : <Check size={19} aria-hidden="true" />}
          {finishState === 'saving' ? t.finishing : t.keepStep}
        </button>
        <button type="button" className="text-button w-full mt-2" disabled={finishState === 'saving'} onClick={() => finish()}>{t.done}</button>
      </div>
    )
  }

  if (showExploration) {
    const contextResults = results.filter((result, index) => {
      const context = result.description?.[language] ?? result.needs?.[language]
      return Boolean(context) && !(index === 0 && result.description?.[language])
    })

    return (
      <div ref={screenRef} className="screen reflection-exploration-screen" data-testid="reflection-exploration-screen" aria-busy={finishState === 'saving'}>
        <ScreenHeader title={t.exploreMore} onBack={closeExploration} lede={t.exploreHint} />

        {needs.length > 0 && (
          <fieldset className="need-choice">
            <legend><Lightbulb size={19} aria-hidden="true" />{t.needPrompt}</legend>
            <p>{t.needHint}</p>
            <div>
              {needs.map((need) => {
                const active = selectedNeed === need
                return (
                  <button
                    type="button"
                    key={need}
                    className={active ? 'is-active' : ''}
                    aria-pressed={active}
                    onClick={() => setSelectedNeed(active ? undefined : need)}
                  >
                    <span className="need-choice-mark" aria-hidden="true">{active && <Check size={16} />}</span>
                    <span>{need}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <button type="button" className="secondary-button" disabled={finishState === 'saving'} onClick={() => setShowStep(true)}>{t.nextStep}</button>

        {results[0]?.description?.[language] && (
          <section className="meaning-block"><HeartHandshake size={21} aria-hidden="true" /><div><h2>{t.function}</h2><p>{results[0].description[language]}</p></div></section>
        )}

        <details className="more-context">
          <summary>{t.more}<ChevronDown size={18} aria-hidden="true" /></summary>
          <p>{synthesis}</p>
          {contextResults.map((result) => <p key={result.id}><strong>{result.label[language]}:</strong> {result.description?.[language] ?? result.needs?.[language]}</p>)}
        </details>

        {aiLink ? (
          <div className="external-ai-action">
            <a className="secondary-button external-ai-link" href={aiLink} target="_blank" rel="noopener noreferrer">
              {analyzeT.exploreAI}<ExternalLink size={18} aria-hidden="true" />
            </a>
            <p>{analyzeT.aiDisclosure}</p>
            <small>{analyzeT.aiWarning}</small>
          </div>
        ) : (
          <p className="external-ai-disabled">{analyzeT.externalAIDisabled}</p>
        )}

        <div className="reflection-exploration-finish">
          <button type="button" className="primary-button" disabled={finishState === 'saving'} onClick={() => finish()}>
            {finishState === 'saving' && <LoaderCircle size={18} aria-hidden="true" />}
            {finishState === 'saving' ? t.finishing : t.done}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={screenRef} className="screen reflection-screen" data-testid="reflection-screen" aria-busy={finishState === 'saving'}>
      <ScreenHeader onBack={onBack} eyebrow={t.eyebrow} title={t.title} />

      {completion.crisisTier !== 'none' && (
        <CrisisBanner tier={completion.crisisTier} crisisT={section('crisis')} />
      )}

      {(completion.crisisTier === 'none' || saveState === 'error') && (
        <div
          className={`session-save-status is-${saveState}`}
          role={saveState === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span>
            {saveState === 'saving' && <LoaderCircle size={17} aria-hidden="true" />}
            {saveState === 'saved' && <Check size={17} aria-hidden="true" />}
            {saveState === 'error' && <TriangleAlert size={17} aria-hidden="true" />}
            {saveState === 'disabled' && <X size={17} aria-hidden="true" />}
            {saveState === 'saving'
              ? t.baseSaving
              : saveState === 'saved'
                ? t.baseSaved
                : saveState === 'error'
                  ? t.baseSaveError
                  : t.baseNotSaved}
          </span>
          {saveState === 'error' && (
            <button type="button" className="text-button" onClick={onRetryBaseSave}>
              <RotateCcw size={16} aria-hidden="true" />{t.retrySave}
            </button>
          )}
        </div>
      )}

      {requiresAcknowledge ? (
        <button type="button" className="crisis-ack" onClick={() => setTier4Acknowledged(true)}>{t.acknowledge}</button>
      ) : (
        <>
          <h2 ref={resultHeadingRef} className="emotion-heading" tabIndex={-1}>
            {results.map((result) => <span key={result.id}><i style={{ background: result.color }} />{result.label[language]}</span>)}
          </h2>

          <p className="reflection-synthesis">{briefSynthesis}</p>

          <fieldset className="fit-check">
            <legend>{t.fit}</legend>
            <div>
              {(['yes', 'partly', 'no'] as const).map((answer) => (
                <button type="button" key={answer} className={fit === answer ? 'is-active' : ''} aria-pressed={fit === answer} onClick={() => chooseFit(answer)}>
                  {answer === 'yes' ? t.yes : answer === 'partly' ? t.partly : t.no}
                </button>
              ))}
            </div>
          </fieldset>

          {fit === 'partly' && <p className="fit-response" role="status">{t.partlyHint}</p>}

          {rejected ? (
            <section className="mismatch-panel" aria-labelledby="mismatch-title">
              <h2 id="mismatch-title">{t.mismatchTitle}</h2>
              <p>{t.mismatchBody}</p>
              <button type="button" className="secondary-button" onClick={onBack}>
                <ArrowLeft size={18} aria-hidden="true" />{t.revise}
              </button>
              <button type="button" className="text-button w-full" onClick={() => finish()}>{t.finishWithoutLabel}</button>
            </section>
          ) : (
            <>
              <div className="reflection-actions">
                <button type="button" className="primary-button" disabled={finishState === 'saving'} onClick={() => finish()}>
                  {finishState === 'saving' && <LoaderCircle size={18} aria-hidden="true" />}
                  {finishState === 'saving' ? t.finishing : t.done}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  data-testid="reflection-explore-more"
                  disabled={finishState === 'saving'}
                  onClick={() => setShowExploration(true)}
                >
                  {t.exploreMore}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
