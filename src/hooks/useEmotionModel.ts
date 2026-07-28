import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { BaseEmotion, AnalysisResult, ModelState } from '../models/types'
import { getModel, loadModel, defaultModelId } from '../models/registry'

export function useEmotionModel(modelId: string = defaultModelId) {
  const [model, setModel] = useState(() => getModel(modelId) ?? null)

  const [selections, setSelections] = useState<BaseEmotion[]>([])
  const [modelState, setModelState] = useState<ModelState>(() => model?.initialState ?? { visibleEmotionIds: new Map(), currentGeneration: 0 })
  const [modelReady, setModelReady] = useState(() => Boolean(model))
  const selectionsRef = useRef(selections)
  useEffect(() => {
    selectionsRef.current = selections
  }, [selections])

  useEffect(() => {
    let active = true
    setSelections([])
    const cached = getModel(modelId)
    if (cached) {
      setModel(cached)
      setModelState(cached.initialState)
      setModelReady(true)
      return () => {
        active = false
      }
    }

    setModel(null)
    setModelReady(false)
    setModelState({ visibleEmotionIds: new Map(), currentGeneration: 0 })
    void loadModel(modelId).then((loaded) => {
      if (!active || !loaded) return
      setModel(loaded)
      setModelState(loaded.initialState)
      setModelReady(true)
    })

    return () => {
      active = false
    }
  }, [modelId])

  const noopAnalyze = useCallback((): AnalysisResult[] => [], [])

  const visibleEmotions = useMemo(() => {
    if (!model) return []
    const ids = Array.from(modelState.visibleEmotionIds.keys())
    return ids
      .map((id) => model.allEmotions[id])
      .filter((e): e is BaseEmotion => e !== undefined)
  }, [modelState.visibleEmotionIds, model])

  const sizes = useMemo(() => {
    const map = new Map<string, 'small' | 'medium' | 'large'>()
    if (!model) return map
    for (const id of modelState.visibleEmotionIds.keys()) {
      map.set(id, model.getEmotionSize?.(id, modelState) ?? 'medium')
    }
    return map
  }, [modelState, model])

  const handleSelect = useCallback(
    (emotion: BaseEmotion) => {
      if (!model) return
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
      if (!model) return
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
    if (!model) return
    setSelections([])
    setModelState(model.onClear())
  }, [model])

  // Derive breadcrumb path by walking the parent chain from any visible emotion
  const breadcrumbPath = useMemo(() => {
    if (!model || modelState.currentGeneration === 0) return []
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
      if (!model) return
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
    if (!model) return []
    return selections.length < 2 ? [] : model.analyze(selections).filter((r) => r.componentLabels)
  }, [model, selections])

  const analyze = useCallback((): AnalysisResult[] => {
    if (!model) return noopAnalyze()
    return model.analyze(selections)
  }, [model, selections, noopAnalyze])

  const analyzeSelections = useCallback((candidateSelections: BaseEmotion[]): AnalysisResult[] => {
    if (!model) return noopAnalyze()
    return model.analyze(candidateSelections)
  }, [model, noopAnalyze])

  return {
    modelReady,
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
