import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowLeftRight, Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import { ScreenHeader } from '../components/ScreenHeader'
import { useLanguage } from '../context/LanguageContext'
import { useEmotionModel } from '../hooks/useEmotionModel'
import { MODEL_IDS } from '../models/constants'
import type { AnalysisResult, BaseEmotion, ModelState } from '../models/types'

interface WordLadderScreenProps {
  onBack: () => void
  onComplete: (modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void
}

interface LadderEmotion extends BaseEmotion {
  children?: string[]
}

interface LadderSnapshot {
  emotions: BaseEmotion[]
  selections: BaseEmotion[]
  state: ModelState
}

interface ComparisonContext {
  selected: BaseEmotion
  siblings: BaseEmotion[]
}

function hasChildren(emotion: BaseEmotion): emotion is LadderEmotion {
  return Boolean((emotion as LadderEmotion).children?.length)
}

export function WordLadderScreen({ onBack, onComplete }: WordLadderScreenProps) {
  const { language, section } = useLanguage()
  const t = section('wordLadder')
  const selectionT = section('selectionBar')
  const model = useEmotionModel(MODEL_IDS.WHEEL)
  const [path, setPath] = useState<BaseEmotion[]>([])
  const [history, setHistory] = useState<LadderSnapshot[]>([])
  const [comparisonContext, setComparisonContext] = useState<ComparisonContext | null>(null)
  const [comparison, setComparison] = useState<BaseEmotion | null>(null)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const stopChoiceRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (path.length > 0) stopChoiceRef.current?.focus({ preventScroll: true })
  }, [path.length])

  const prepareComparison = (selected: BaseEmotion, level: BaseEmotion[]) => {
    setComparisonContext({
      selected,
      siblings: level.filter((emotion) => emotion.id !== selected.id),
    })
    setComparison(null)
    setComparisonOpen(false)
  }

  const select = (emotion: BaseEmotion) => {
    if (hasChildren(emotion)) {
      setHistory((current) => [...current, {
        emotions: model.visibleEmotions,
        selections: model.selections,
        state: model.modelState,
      }])
      setPath((current) => [...current, emotion])
      setComparisonOpen(false)
    } else {
      prepareComparison(emotion, model.visibleEmotions)
      setHistory([])
      setPath([])
    }
    model.handleSelect(emotion)
  }

  const choosePathLevel = (index: number) => {
    const selected = path[index]
    prepareComparison(selected, history[index]?.emotions ?? [])
    model.handleBreadcrumbSelect(selected)
    setHistory([])
    setPath([])
  }

  const backOneLevel = () => {
    const previous = history[history.length - 1]
    if (!previous) return
    model.restore(previous.selections, previous.state)
    setHistory((current) => current.slice(0, -1))
    setPath((current) => current.slice(0, -1))
  }

  const clear = () => {
    model.handleClear()
    setHistory([])
    setPath([])
    setComparisonContext(null)
    setComparison(null)
    setComparisonOpen(false)
  }

  const deselect = (emotion: BaseEmotion) => {
    model.handleDeselect(emotion)
    if (comparisonContext?.selected.id === emotion.id) {
      setComparisonContext(null)
      setComparison(null)
      setComparisonOpen(false)
    }
  }

  const finish = () => {
    const results = model.analyze()
    if (model.selections.length > 0 && results.length > 0) {
      onComplete(MODEL_IDS.WHEEL, model.selections, results)
    }
  }

  const finishWithPathEmotion = (emotion: BaseEmotion) => {
    const results = model.analyzeSelections([emotion])
    if (results.length > 0) onComplete(MODEL_IDS.WHEEL, [emotion], results)
  }

  return (
    <div className="screen checkin-screen checkin-screen-words" data-testid="words-screen">
      <ScreenHeader onBack={onBack} eyebrow={t.eyebrow} title={t.title} lede={t.lede} />
      <div className="checkin-step">
        <span>{t.level}</span>
        {model.selections.length > 0 && <span><Check size={15} aria-hidden="true" />{model.selections.length}</span>}
      </div>

      <div className="word-ladder">
        {path.length > 0 && (
          <>
            <section className="word-path" aria-label={t.path}>
              <span>{t.path}</span>
              <p>{t.pathHint}</p>
              <div className="word-path-levels">
                {path.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.id}-${index}`}
                    onClick={() => choosePathLevel(index)}
                    aria-label={t.useWord.replace('{word}', item.label[language])}
                  >
                    {t.useWord.replace('{word}', item.label[language])}
                  </button>
                ))}
              </div>
              <button type="button" className="word-level-back" onClick={backOneLevel}>
                <ArrowLeft size={17} aria-hidden="true" />{t.backLevel}
              </button>
            </section>
            <section ref={stopChoiceRef} className="word-stop-choice" aria-labelledby="word-stop-title" tabIndex={-1}>
              <span>{t.stopHere}</span>
              <strong id="word-stop-title">{path[path.length - 1].label[language]}</strong>
              <button type="button" className="primary-button" onClick={() => finishWithPathEmotion(path[path.length - 1])}>
                {t.continueWith.replace('{word}', path[path.length - 1].label[language])}
                <ChevronRight size={19} aria-hidden="true" />
              </button>
              <p>{t.moreSpecific}</p>
            </section>
          </>
        )}

        {model.selections.length > 0 && (
          <section className="word-selection" aria-label={t.selected} aria-live="polite">
            <div>
              <span>{t.selected}</span>
              <button type="button" className="icon-button" onClick={clear} aria-label={selectionT.clear}>
                <RotateCcw size={18} aria-hidden="true" />
              </button>
            </div>
            <div>
              {model.selections.map((emotion) => (
                <button type="button" key={emotion.id} onClick={() => deselect(emotion)}>
                  <i style={{ background: emotion.color }} aria-hidden="true" />
                  {emotion.label[language]}
                  <X size={15} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        )}

        {path.length === 0 && comparisonContext && comparisonContext.siblings.length > 0 && (
          <>
            <button
              type="button"
              className="secondary-button word-compare-toggle"
              aria-expanded={comparisonOpen}
              onClick={() => setComparisonOpen((open) => !open)}
            >
              <ArrowLeftRight size={18} aria-hidden="true" />
              {comparisonOpen ? t.hideComparison : t.compare}
            </button>
            {comparisonOpen && (
              <section className="word-compare" aria-labelledby="word-compare-title">
                <h2 id="word-compare-title">{t.compare}</h2>
                <p>{t.compareHint}</p>
                <div className="word-compare-options">
                  {comparisonContext.siblings.map((sibling) => (
                    <button
                      type="button"
                      key={sibling.id}
                      aria-pressed={comparison?.id === sibling.id}
                      aria-label={t.compareWith.replace('{word}', sibling.label[language])}
                      onClick={() => setComparison(sibling)}
                    >
                      <i style={{ background: sibling.color }} aria-hidden="true" />
                      {sibling.label[language]}
                    </button>
                  ))}
                </div>
                {comparison && (
                  <>
                    <p className="word-compare-note">{t.compareNote}</p>
                    <div
                      className="word-compare-result"
                      role="group"
                      aria-label={t.comparisonLabel
                        .replace('{selected}', comparisonContext.selected.label[language])
                        .replace('{other}', comparison.label[language])}
                    >
                      {[comparisonContext.selected, comparison].map((emotion) => (
                        <article key={emotion.id} style={{ '--emotion-color': emotion.color } as CSSProperties}>
                          <h3>{emotion.label[language]}</h3>
                          <p>{emotion.description?.[language] ?? t.noDescription}</p>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}

        {model.selections.length > 0 && (
          <div className="route-action">
            <button type="button" className="primary-button" disabled={!model.modelReady} onClick={finish}>
              {t.continueWith.replace('{word}', model.selections.map((emotion) => emotion.label[language]).join(', '))}
              <ChevronRight size={19} aria-hidden="true" />
            </button>
          </div>
        )}

        <ul className="word-options" aria-label={t.level}>
          {model.visibleEmotions.map((emotion) => (
            <li key={emotion.id}>
              <button type="button" aria-label={emotion.label[language]} onClick={() => select(emotion)}>
                <span className="word-swatch" style={{ background: emotion.color }} aria-hidden="true" />
                <span>
                  <strong>{emotion.label[language]}</strong>
                  {emotion.description && <small>{emotion.description[language]}</small>}
                </span>
                {hasChildren(emotion) ? <ChevronRight size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
