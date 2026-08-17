import { memo, useState, useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { findNearest } from '../models/dimensional'
import type { VisualizationProps } from '../models/types'
import type { DimensionalEmotion } from '../models/dimensional/types'

const FIELD_SIZE = 500
const PADDING = 30
const INNER = FIELD_SIZE - PADDING * 2
const KEYBOARD_STEP = 0.2
const AXIS_NEUTRAL_THRESHOLD = 0.1

function toPixel(value: number): number {
  // Map -1..+1 to PADDING..FIELD_SIZE-PADDING
  return PADDING + ((value + 1) / 2) * INNER
}

function readableEmotionInk(color: string): '#000000' | '#ffffff' {
  const match = /^#([0-9a-f]{6})$/i.exec(color)
  if (!match) return '#000000'
  const channels = [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255)
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ))
  const background = 0.2126 * red + 0.7152 * green + 0.0722 * blue
  const blackContrast = (background + 0.05) / 0.05
  const whiteContrast = 1.05 / (background + 0.05)
  return whiteContrast > blackContrast ? '#ffffff' : '#000000'
}

function DimensionalFieldBase({ emotions, onSelect, onDeselect, selections = [], progressive = false }: VisualizationProps) {
  const { language, section } = useLanguage()
  const dimensionalT = section('dimensional')
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  const [hasInteracted, setHasInteracted] = useState(false)
  const dimEmotions = useMemo(
    () => emotions as DimensionalEmotion[],
    [emotions]
  )
  const emotionMap = useMemo(() => {
    const map: Record<string, DimensionalEmotion> = {}
    for (const e of dimEmotions) map[e.id] = e
    return map
  }, [dimEmotions])

  const selectedIds = useMemo(
    () => new Set(selections.map((s) => s.id)),
    [selections]
  )
  const showAxisLabels = progressive || !isMobile || !hasInteracted

  // Compute label y-offsets with collision avoidance
  const labelOffsets = useMemo(() => {
    const MIN_GAP = 14
    const entries = dimEmotions.map((e) => {
      const px = toPixel(e.valence)
      const py = toPixel(-e.arousal)
      const isSelected = selectedIds.has(e.id)
      return { id: e.id, x: px, baseY: py - (isSelected ? 22 : 16) }
    })
    // Sort by y then x for greedy pass
    entries.sort((a, b) => a.baseY - b.baseY || a.x - b.x)
    const adjusted = new Map<string, number>()
    const placed: { x: number; y: number }[] = []
    for (const entry of entries) {
      let labelY = entry.baseY
      for (const prev of placed) {
        if (Math.abs(prev.x - entry.x) < 40 && Math.abs(prev.y - labelY) < MIN_GAP) {
          labelY = prev.y + MIN_GAP
        }
      }
      // Clamp to viewBox bounds so labels don't overflow
      labelY = Math.max(PADDING, Math.min(labelY, FIELD_SIZE - PADDING - 5))
      adjusted.set(entry.id, labelY)
      placed.push({ x: entry.x, y: labelY })
    }
    return adjusted
  }, [dimEmotions, selectedIds])

  const svgRef = useRef<SVGSVGElement>(null)
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null)
  const [placement, setPlacement] = useState<{ valence: number; arousal: number } | null>(null)
  const [suggestions, setSuggestions] = useState<DimensionalEmotion[]>([])
  const suggestionTrayRef = useRef<HTMLDivElement>(null)
  const suggestedIds = useMemo(() => new Set(suggestions.map((suggestion) => suggestion.id)), [suggestions])

  useEffect(() => {
    if (suggestions.length === 0) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    suggestionTrayRef.current?.scrollIntoView?.({ block: 'nearest', behavior })
  }, [suggestions])

  const placeAt = useCallback(
    (valence: number, arousal: number) => {
      setHasInteracted(true)
      setCrosshair({ x: toPixel(valence), y: toPixel(-arousal) })
      setPlacement({ valence, arousal })
      setSuggestions(findNearest(valence, arousal, emotionMap, 3))
    },
    [emotionMap]
  )

  const placeFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return

      const rect = svg.getBoundingClientRect()
      const scaleX = FIELD_SIZE / rect.width
      const scaleY = FIELD_SIZE / rect.height
      const px = (clientX - rect.left) * scaleX
      const py = (clientY - rect.top) * scaleY

      const valence = Math.max(-1, Math.min(1, ((px - PADDING) / INNER) * 2 - 1))
      const arousal = Math.max(-1, Math.min(1, -(((py - PADDING) / INNER) * 2 - 1)))
      placeAt(valence, arousal)
    },
    [placeAt]
  )

  const handleFieldClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    placeFromClientPoint(e.clientX, e.clientY)
  }, [placeFromClientPoint])

  const handleFieldKeyDown = useCallback((event: React.KeyboardEvent<SVGSVGElement>) => {
    const delta = {
      ArrowLeft: { valence: -KEYBOARD_STEP, arousal: 0 },
      ArrowRight: { valence: KEYBOARD_STEP, arousal: 0 },
      ArrowUp: { valence: 0, arousal: KEYBOARD_STEP },
      ArrowDown: { valence: 0, arousal: -KEYBOARD_STEP },
    }[event.key]
    if (!delta) return

    event.preventDefault()
    const current = placement ?? { valence: 0, arousal: 0 }
    placeAt(
      Math.max(-1, Math.min(1, current.valence + delta.valence)),
      Math.max(-1, Math.min(1, current.arousal + delta.arousal)),
    )
  }, [placeAt, placement])

  const handleSuggestionClick = useCallback(
    (emotion: DimensionalEmotion) => {
      setHasInteracted(true)
      if (selectedIds.has(emotion.id)) {
        onDeselect(emotion)
      } else {
        onSelect(emotion)
      }
    },
    [onSelect, onDeselect, selectedIds]
  )

  const handleEmotionDotClick = useCallback(
    (emotion: DimensionalEmotion, e: React.MouseEvent) => {
      e.stopPropagation()
      setHasInteracted(true)
      if (selectedIds.has(emotion.id)) {
        onDeselect(emotion)
      } else {
        onSelect(emotion)
      }
    },
    [onSelect, onDeselect, selectedIds]
  )

  return (
    <div className="dimensional-field">
      <p id="dimensional-instructions" className="dimensional-instructions">
        {dimensionalT.instructions}
      </p>
      <p id="dimensional-keyboard-instructions" className="sr-only">
        {dimensionalT.keyboardInstructions}
      </p>
      <div className="dimensional-content">
        <div data-testid="dimensional-plot-container" className="dimensional-plot">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${FIELD_SIZE} ${FIELD_SIZE}`}
            className="dimensional-plot-svg"
            role="group"
            tabIndex={0}
            aria-label={dimensionalT.fieldLabel}
            aria-describedby="dimensional-instructions dimensional-keyboard-instructions"
            onClick={handleFieldClick}
            onKeyDown={handleFieldKeyDown}
            onPointerMove={(event) => {
              if (event.buttons === 1) placeFromClientPoint(event.clientX, event.clientY)
            }}
            style={{ cursor: 'crosshair' }}
          >
          {/* Background grid */}
          <rect
            x={PADDING}
            y={PADDING}
            width={INNER}
            height={INNER}
            fill="var(--affect-field)"
            rx={8}
          />

          {/* Quadrant dividers */}
          <line
            x1={FIELD_SIZE / 2} y1={PADDING}
            x2={FIELD_SIZE / 2} y2={FIELD_SIZE - PADDING}
            stroke="var(--affect-grid)" strokeWidth={1}
          />
          <line
            x1={PADDING} y1={FIELD_SIZE / 2}
            x2={FIELD_SIZE - PADDING} y2={FIELD_SIZE / 2}
            stroke="var(--affect-grid)" strokeWidth={1}
          />

          {!hasInteracted && (
            <g aria-hidden="true" pointerEvents="none" data-testid="affect-placement-hint">
              <rect
                x={92}
                y={274}
                width={316}
                height={48}
                rx={24}
                fill="var(--surface-raised)"
                stroke="var(--line)"
              />
              <text
                x={FIELD_SIZE / 2}
                y={304}
                fill="var(--affect-axis)"
                fontSize={18}
                fontWeight={700}
                textAnchor="middle"
              >
                {dimensionalT.placeHint}
              </text>
            </g>
          )}

          {/* Axis labels */}
          {showAxisLabels && (
            <>
              <text x={PADDING} y={FIELD_SIZE / 2 - 8} fill="var(--affect-axis)" fontSize={18} textAnchor="start">
                {dimensionalT.unpleasant}
              </text>
              <text x={FIELD_SIZE - PADDING} y={FIELD_SIZE / 2 - 8} fill="var(--affect-axis)" fontSize={18} textAnchor="end">
                {dimensionalT.pleasant}
              </text>
              <text x={FIELD_SIZE / 2} y={PADDING - 8} fill="var(--affect-axis)" fontSize={18} textAnchor="middle">
                {dimensionalT.moreEnergy}
              </text>
              <text x={FIELD_SIZE / 2} y={FIELD_SIZE - PADDING + 22} fill="var(--affect-axis)" fontSize={18} textAnchor="middle">
                {dimensionalT.lessEnergy}
              </text>
            </>
          )}

          {/* Reference emotion dots and labels */}
          {dimEmotions.map((emotion) => {
            const px = toPixel(emotion.valence)
            const py = toPixel(-emotion.arousal) // Invert: top = intense
            const isSelected = selectedIds.has(emotion.id)
            const isSuggested = suggestedIds.has(emotion.id)

            if (progressive && !isSelected && !isSuggested) return null

            return (
              <g
                key={emotion.id}
                className="dimensional-emotion-control"
                role="button"
                tabIndex={0}
                aria-label={emotion.label[language]}
                aria-pressed={isSelected}
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleEmotionDotClick(emotion, e)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleEmotionDotClick(emotion, e as unknown as React.MouseEvent) } }}
              >
                {/* Invisible hit area for touch targets (~44px at mobile scale) */}
                <circle
                  className="dimensional-emotion-dot"
                  cx={px}
                  cy={py}
                  r={32}
                  fill="transparent"
                />
                <circle
                  cx={px}
                  cy={py}
                  r={isSelected ? 14 : 11}
                  fill={emotion.color}
                  fillOpacity={isSelected ? 0.9 : 0.6}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
                {(!progressive || isSuggested || isSelected) && <text
                  x={px}
                  y={labelOffsets.get(emotion.id) ?? (py - (isSelected ? 22 : 16))}
                  fill="var(--affect-label)"
                  fontSize={isSelected ? 12 : 11}
                  textAnchor="middle"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  stroke="var(--affect-label-stroke)"
                  strokeWidth={isSelected ? 3 : 2}
                  paintOrder="stroke"
                >
                  {emotion.label[language]}
                </text>}
              </g>
            )
          })}

          {/* Crosshair */}
          {crosshair && (
            <>
              <line
                x1={crosshair.x - 8} y1={crosshair.y}
                x2={crosshair.x + 8} y2={crosshair.y}
                stroke="#818CF8" strokeWidth={1.5} strokeOpacity={0.8}
              />
              <line
                x1={crosshair.x} y1={crosshair.y - 8}
                x2={crosshair.x} y2={crosshair.y + 8}
                stroke="#818CF8" strokeWidth={1.5} strokeOpacity={0.8}
              />
              <circle
                cx={crosshair.x} cy={crosshair.y}
                r={3} fill="#818CF8" fillOpacity={0.6}
              />
            </>
          )}
          </svg>
        </div>

        {placement && (
          <p data-testid="affect-readout" className="affect-readout" role="status">
            {`${Math.abs(placement.arousal) <= AXIS_NEUTRAL_THRESHOLD ? dimensionalT.readoutNeutralEnergy : placement.arousal > 0 ? dimensionalT.readoutMoreEnergy : dimensionalT.readoutLessEnergy}, ${Math.abs(placement.valence) <= AXIS_NEUTRAL_THRESHOLD ? dimensionalT.readoutNeutralPleasantness : placement.valence > 0 ? dimensionalT.readoutPleasant : dimensionalT.readoutUnpleasant}`}
          </p>
        )}

        {suggestions.length > 0 && (
          <motion.div
            ref={suggestionTrayRef}
            data-testid="dimensional-suggestion-tray"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="dimensional-suggestion-tray"
          >
            <p>{dimensionalT.nearby}</p>
            <div>
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  data-testid={`dimensional-suggestion-chip-${s.id}`}
                  aria-pressed={selectedIds.has(s.id)}
                  onClick={() => handleSuggestionClick(s)}
                  className="dimensional-suggestion-chip min-h-[48px]"
                  style={{ '--emotion-color': s.color, '--emotion-ink': readableEmotionInk(s.color) } as CSSProperties}
                >
                  {s.label[language]}
                </button>
              ))}
              <button
                type="button"
                aria-label={dimensionalT.clearPlacement}
                onClick={() => { setCrosshair(null); setPlacement(null); setSuggestions([]) }}
                className="dimensional-clear min-h-[48px]"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export const DimensionalField = memo(DimensionalFieldBase)
