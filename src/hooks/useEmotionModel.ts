import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { BaseEmotion, AnalysisResult, EmotionModel, ModelState } from '../models/types'

export function useEmotionModel(model: EmotionModel<BaseEmotion>) {
  const [selections, setSelections] = useState<BaseEmotion[]>([])
  const [modelState, setModelState] = useState<ModelState>(() => model.initialState)
  const selectionsRef = useRef(selections)
  useEffect(() => {
    selectionsRef.current = selections
  }, [selections])

  useEffect(() => {
    setSelections([])
    setModelState(model.initialState)
  }, [model])

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
    [model]
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
    [model]
  )

  const handleClear = useCallback(() => {
    setSelections([])
    setModelState(model.onClear())
  }, [model])

  // Derive breadcrumb path by walking the parent chain from any visible emotion
  const breadcrumbPath = useMemo(() => {
    if (modelState.currentGeneration === 0) return []
    const firstId = modelState.visibleEmotionIds.keys().next().value
    if (!firstId) return []
    const path: BaseEmotion[] = []
    let current = model.allEmotions[firstId] as BaseEmotion & { parents?: string[] }
    // Walk up the parent chain (skip the visible emotion itself — it's a child, not an ancestor)
    while (current?.parents?.[0]) {
      const parent = model.allEmotions[current.parents[0]]
      if (!parent) break
      path.push(parent)
      current = parent as BaseEmotion & { parents?: string[] }
    }
    path.reverse()
    return path
  }, [model, modelState.visibleEmotionIds, modelState.currentGeneration])

  // Select a breadcrumb emotion (branch node) and reset to root
  const handleBreadcrumbSelect = useCallback(
    (emotion: BaseEmotion) => {
      setSelections((prev) =>
        prev.find((e) => e.id === emotion.id) ? prev : [...prev, emotion]
      )
      setModelState(model.onClear())
    },
    [model]
  )

  const restore = useCallback((savedSelections: BaseEmotion[], savedState: ModelState) => {
    setSelections(savedSelections)
    setModelState(savedState)
  }, [])

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
    breadcrumbPath,
    handleSelect,
    handleDeselect,
    handleClear,
    handleBreadcrumbSelect,
    restore,
    analyze,
    analyzeSelections,
  }
}
