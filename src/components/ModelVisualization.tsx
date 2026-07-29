import type { VisualizationProps } from '../models/types'
import { getVisualization } from '../models/registry'
import React, { useMemo } from 'react'
import type { ModelId } from '../models/constants'

interface ModelVisualizationProps extends VisualizationProps {
  modelId: ModelId
}

export function ModelVisualization({ modelId, ...props }: ModelVisualizationProps) {
  const Visualizer = useMemo(() => getVisualization(modelId), [modelId])

  if (!Visualizer) {
    console.warn(`emot-id: no visualization registered for modelId "${modelId}". Known models are derived from registry entries.`)
    return null
  }

  return React.createElement(Visualizer, props)
}
