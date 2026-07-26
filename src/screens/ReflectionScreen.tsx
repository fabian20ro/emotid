import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, ExternalLink, HeartHandshake, Lightbulb, LoaderCircle, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { synthesize } from '../models/synthesis'
import { CrisisBanner } from '../components/CrisisBanner'
import { ScreenHeader } from '../components/ScreenHeader'
import { buildGoogleAiSearchUrl } from '../utils/google-ai-search'
import type { CheckInCompletion, ReflectionAnswer, ReflectionDetail, ReflectionSaveOutcome } from '../navigation/types'

type FinishState = 'idle' | 'saving' | 'error' | 'finished'

interface ReflectionScreenProps {
  completion: CheckInCompletion
  allowExternalAI: boolean
  onBack: () => void
  onSave: (detail: ReflectionDetail) => Promise<ReflectionSaveOutcome>
  onReturn: () => void
}

export function ReflectionScreen({ completion, allowExternalAI, onBack, onSave, onReturn }: ReflectionScreenProps) {
  const { language, section } = useLanguage()
  const t = section('reflectionScreen')
  const analyzeT = section('analyze')
  const results = completion.results
  const needs = useMemo(
    () => [...new Set(results.map((result) => result.needs?.[language]).filter((need): need is string => Boolean(need)))],
    [language, results],
  )
  const [fit, setFit] = useState<ReflectionAnswer | undefined>()
  const [selectedNeed, setSelectedNeed] = useState<string | undefined>(() => needs.length === 1 ? needs[0] : undefined)
  const [tier4Acknowledged, setTier4Acknowledged] = useState(false)
  const [showStep, setShowStep] = useState(false)
  const [finishState, setFinishState] = useState<FinishState>('idle')
  const [saveOutcome, setSaveOutcome] = useState<ReflectionSaveOutcome>()
  const [nextStep, setNextStep] = useState<string | undefined>()
  const screenRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const pendingDetailRef = useRef<ReflectionDetail | null>(null)
  const synthesis = useMemo(() => synthesize(results, language), [results, language])
  const emotionNames = results.map((result) => result.label[language]).join(language === 'ro' ? ', ' : ', ')
  const briefSynthesis = language === 'ro'
    ? `${emotionNames} ar putea face parte din ceea ce este aici. Voi puteți aprecia cel mai bine ce se potrivește.`
    : `${emotionNames} may be part of what is here. You are the best judge of what fits.`
  const requiresAcknowledge = completion.crisisTier === 'tier4' && !tier4Acknowledged
  const rejected = fit === 'no'
  const nextStepOptions = [t.stepPause, t.stepWrite, t.stepConnect]
  const aiLink = allowExternalAI
    ? buildGoogleAiSearchUrl(results, language, analyzeT)
    : null

  useLayoutEffect(() => {
    screenRef.current?.scrollIntoView?.({ block: 'start' })
  }, [finishState, showStep])

  const attemptSave = async (detail: ReflectionDetail) => {
    if (savingRef.current) return
    savingRef.current = true
    pendingDetailRef.current = detail
    setFinishState('saving')
    try {
      const outcome = await onSave(detail)
      setSaveOutcome(outcome)
      setFinishState('finished')
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
    setSaveOutcome('not-saved')
    setFinishState('finished')
  }

  const chooseFit = (answer: ReflectionAnswer) => {
    setFit(answer)
    setNextStep(undefined)
    if (answer === 'no') setSelectedNeed(undefined)
  }

  if (finishState === 'saving') {
    return (
      <div ref={screenRef} className="screen reflection-save-state" data-testid="reflection-saving-screen" role="status" aria-live="polite">
        <span className="save-state-mark"><LoaderCircle size={28} aria-hidden="true" /></span>
        <h1 className="screen-title">{t.savingTitle}</h1>
        <p className="screen-lede">{t.savingBody}</p>
      </div>
    )
  }

  if (finishState === 'error') {
    return (
      <div ref={screenRef} className="screen reflection-save-state" data-testid="reflection-save-error-screen" role="alert">
        <span className="save-state-mark is-error"><TriangleAlert size={28} aria-hidden="true" /></span>
        <h1 className="screen-title">{t.saveErrorTitle}</h1>
        <p className="screen-lede">{t.saveErrorBody}</p>
        <div className="save-error-actions">
          <button type="button" className="primary-button" onClick={retrySave}>
            <RotateCcw size={18} aria-hidden="true" />{t.retrySave}
          </button>
          <button type="button" className="text-button" onClick={continueWithoutSaving}>{t.continueWithoutSaving}</button>
        </div>
      </div>
    )
  }

  if (finishState === 'finished') {
    return (
      <div ref={screenRef} className="screen reflection-close" data-testid="reflection-close-screen">
        <span className="close-mark"><Check size={28} aria-hidden="true" /></span>
        <h1 className="screen-title">{t.closeTitle}</h1>
        <p className="screen-lede">{t.closeBody}</p>
        <p className="privacy-line">{saveOutcome === 'saved' ? t.saved : t.notSaved}</p>
        <button type="button" className="primary-button mt-6" onClick={onReturn}>{t.returnToday}</button>
      </div>
    )
  }

  if (showStep) {
    return (
      <div ref={screenRef} className="screen" data-testid="next-step-screen">
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
        <button type="button" className="primary-button mt-5" disabled={!nextStep} onClick={() => finish(nextStep)}>
          <Check size={19} aria-hidden="true" />{t.keepStep}
        </button>
        <button type="button" className="text-button w-full mt-2" onClick={() => finish()}>{t.done}</button>
      </div>
    )
  }

  return (
    <div ref={screenRef} className="screen" data-testid="reflection-screen">
      <ScreenHeader onBack={onBack} eyebrow={t.eyebrow} title={t.title} />

      {completion.crisisTier !== 'none' && (
        <CrisisBanner tier={completion.crisisTier} crisisT={section('crisis')} showTemporalNote={completion.temporalEscalation} />
      )}

      {requiresAcknowledge ? (
        <button type="button" className="crisis-ack" onClick={() => setTier4Acknowledged(true)}>{t.acknowledge}</button>
      ) : (
        <>
          <div className="emotion-heading">
            {results.map((result) => <span key={result.id}><i style={{ background: result.color }} />{result.label[language]}</span>)}
          </div>

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

              <button type="button" className="primary-button mt-4" onClick={() => setShowStep(true)}>{t.nextStep}</button>
              <button type="button" className="text-button w-full mt-1" onClick={() => finish()}><X size={17} aria-hidden="true" />{t.done}</button>

              {results[0]?.description?.[language] && (
                <section className="meaning-block"><HeartHandshake size={21} aria-hidden="true" /><div><h2>{t.function}</h2><p>{results[0].description[language]}</p></div></section>
              )}

              <details className="more-context">
                <summary>{t.more}<ChevronDown size={18} aria-hidden="true" /></summary>
                <p>{synthesis}</p>
                {results.map((result) => <p key={result.id}><strong>{result.label[language]}:</strong> {result.description?.[language] ?? result.needs?.[language]}</p>)}
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
            </>
          )}
        </>
      )}
    </div>
  )
}
