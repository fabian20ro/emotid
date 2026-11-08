import { useMemo, useCallback, useEffect, useRef } from 'react'
import { useDraftState } from '../features/check-in/workflow/draft'
import type { BaseEmotion, AnalysisResult, EmotionModel, ModelState } from '../models/types'

export function useEmotionModel(model: EmotionModel<BaseEmotion>) {
  const [selections, setSelections] = useDraftState('selections', [])
  const [modelState, setModelState] = useDraftState('modelState', () => model.initialState)
  const previousModel = useRef(model)
  const selectionsRef = useRef(selections)
  useEffect(() => {
    selectionsRef.current = selections
  }, [selections])

  useEffect(() => {
    if (previousModel.current === model) return
    previousModel.current = model
    setSelections([])
    setModelState(model.initialState)
  }, [model, setModelState, setSelections])

  const visibleEmotions = useMemo(() => {
    const ids = Array.from(modelState.visibleEmotionIds.keys())
    return ids
      .map((id) => model.allEmotions[id])
      .filter((e): e is BaseEmotion => e !== undefined)
  }, [modelState.visibleEmotionIds, model])

  const sizes = useMemo(() => {
    const map = new Map<string, 'small' | 'medium' | 'large'>()
    for (const id of modelState.visibleEmotionIds.keys()) {
      map.set(id, model.getEmotionSize?.(id, modelState) ?? 'medium')
    }
    return map
  }, [modelState, model])

  const handleSelect = useCallback(
    (emotion: BaseEmotion) => {
      setModelState((prevState) => {
        const effect = model.onSelect(emotion, prevState, selectionsRef.current)

        if (effect.newSelections !== undefined) {
          setSelections(effect.newSelections)
        } else {
          setSelections((prev) =>
            prev.find((e) => e.id === emotion.id) ? prev : [...prev, emotion]
          )
        }

        return effect.newState
      })
    },
    [model, setModelState, setSelections]
  )

  const handleDeselect = useCallback(
    (emotion: BaseEmotion) => {
      setModelState((prevState) => {
        const effect = model.onDeselect(emotion, prevState)

        if (effect.newSelections !== undefined) {
          setSelections(effect.newSelections)
        } else {
          setSelections((prev) => prev.filter((e) => e.id !== emotion.id))
        }

        return effect.newState
      })
    },
    [model, setModelState, setSelections]
  )

  const handleClear = useCallback(() => {
    setSelections([])
    setModelState(model.onClear())
  }, [model, setModelState, setSelections])

  // Select a breadcrumb emotion (branch node) and reset to root
  const handleBreadcrumbSelect = useCallback(
    (emotion: BaseEmotion) => {
      setSelections((prev) =>
        prev.find((e) => e.id === emotion.id) ? prev : [...prev, emotion]
      )
      setModelState(model.onClear())
    },
    [model, setModelState, setSelections]
  )

  const restore = useCallback((savedSelections: BaseEmotion[], savedState: ModelState) => {
    setSelections(savedSelections)
    setModelState(savedState)
  }, [setModelState, setSelections])

  const combos = useMemo(() => {
    return selections.length < 2 ? [] : model.analyze(selections).filter((r) => r.componentLabels)
  }, [model, selections])

  const analyze = useCallback((): AnalysisResult[] => {
    return model.analyze(selections)
  }, [model, selections])

  const analyzeSelections = useCallback((candidateSelections: BaseEmotion[]): AnalysisResult[] => {
    return model.analyze(candidateSelections)
  }, [model])

  return {
    modelReady: true,
    selections,
    modelState,
    visibleEmotions,
    sizes,
    combos,
    handleSelect,
    handleDeselect,
    handleClear,
    handleBreadcrumbSelect,
    restore,
    analyze,
    analyzeSelections,
  }
}
