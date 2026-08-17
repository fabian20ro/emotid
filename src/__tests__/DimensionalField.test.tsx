import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DimensionalField } from '../components/DimensionalField'
import { LanguageProvider } from '../context/LanguageContext'
import type { DimensionalEmotion } from '../models/dimensional/types'

const mockEmotions: DimensionalEmotion[] = [
  {
    id: 'happy',
    label: { ro: 'fericit', en: 'happy' },
    color: '#FFEB3B',
    valence: 0.7,
    arousal: 0.4,
    quadrant: 'pleasant-intense',
  },
  {
    id: 'sad',
    label: { ro: 'trist', en: 'sad' },
    color: '#5C6BC0',
    valence: -0.6,
    arousal: -0.4,
    quadrant: 'unpleasant-calm',
  },
  {
    id: 'angry',
    label: { ro: 'furios', en: 'angry' },
    color: '#F44336',
    valence: -0.7,
    arousal: 0.8,
    quadrant: 'unpleasant-intense',
  },
]

const defaultSizes = new Map<string, 'small' | 'medium' | 'large'>([
  ['happy', 'small'],
  ['sad', 'small'],
  ['angry', 'small'],
])

function renderField(overrides: Partial<React.ComponentProps<typeof DimensionalField>> = {}) {
  const defaults: React.ComponentProps<typeof DimensionalField> = {
    emotions: mockEmotions,
    onSelect: vi.fn(),
    onDeselect: vi.fn(),
    sizes: defaultSizes,
    ...overrides,
  }
  return {
    ...render(
      <LanguageProvider>
        <DimensionalField {...defaults} />
      </LanguageProvider>
    ),
    onSelect: defaults.onSelect as ReturnType<typeof vi.fn>,
    onDeselect: defaults.onDeselect as ReturnType<typeof vi.fn>,
  }
}

function setMobileMatchMedia(matches: boolean) {
  const original = window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: matches && query.includes('max-width: 639px'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })

  return () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: original,
    })
  }
}

describe('DimensionalField', () => {
  it('renders an SVG with the field', () => {
    renderField()
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders axis labels', () => {
    renderField()
    expect(screen.getByText('Pleasant')).toBeInTheDocument()
    expect(screen.getByText('Unpleasant')).toBeInTheDocument()
    expect(screen.getByText('More energy')).toBeInTheDocument()
    expect(screen.getByText('Less energy')).toBeInTheDocument()
    expect(screen.getByTestId('affect-placement-hint')).toHaveTextContent(
      'Tap anywhere to place the feeling',
    )
  })

  it('keeps axis labels visible after interacting with the field', () => {
    renderField()
    const svg = document.querySelector('svg') as SVGSVGElement

    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      top: 0,
      left: 0,
      right: 300,
      bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.click(svg, { clientX: 120, clientY: 200 })
    expect(screen.getByText('Pleasant')).toBeInTheDocument()
    expect(screen.getByText('Unpleasant')).toBeInTheDocument()
    expect(screen.getByText('More energy')).toBeInTheDocument()
    expect(screen.getByText('Less energy')).toBeInTheDocument()
  })

  it('hides axis labels on mobile after the first interaction', () => {
    const restoreMatchMedia = setMobileMatchMedia(true)
    try {
      renderField()
      const svg = document.querySelector('svg') as SVGSVGElement

      expect(screen.getByText('Pleasant')).toBeInTheDocument()
      expect(screen.getByText('Unpleasant')).toBeInTheDocument()

      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        top: 0,
        left: 0,
        right: 300,
        bottom: 300,
        toJSON: () => ({}),
      } as DOMRect)

      fireEvent.click(svg, { clientX: 120, clientY: 200 })

      expect(screen.queryByText('Pleasant')).not.toBeInTheDocument()
      expect(screen.queryByText('Unpleasant')).not.toBeInTheDocument()
      expect(screen.queryByText('More energy')).not.toBeInTheDocument()
      expect(screen.queryByText('Less energy')).not.toBeInTheDocument()
    } finally {
      restoreMatchMedia()
    }
  })

  it('renders emotion labels as text', () => {
    renderField()
    expect(screen.getByText('happy')).toBeInTheDocument()
    expect(screen.getByText('sad')).toBeInTheDocument()
    expect(screen.getByText('angry')).toBeInTheDocument()
  })

  it('renders circles for each emotion', () => {
    renderField()
    const circles = document.querySelectorAll('circle')
    // 3 emotions × 2 circles each (invisible hit area + visible dot)
    expect(circles.length).toBe(6)
  })

  it('emotion dots have ARIA attributes for accessibility', () => {
    renderField()
    const buttons = document.querySelectorAll('g[role="button"]')
    expect(buttons.length).toBe(3)
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('tabindex', '0')
      expect(btn).toHaveAttribute('aria-label')
      expect(btn).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('renders suggestions below the plot after field click', () => {
    renderField()
    const plotContainer = screen.getByTestId('dimensional-plot-container')
    const svg = document.querySelector('svg') as SVGSVGElement
    expect(plotContainer).toBeInTheDocument()

    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      top: 0,
      left: 0,
      right: 300,
      bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.click(svg, { clientX: 150, clientY: 240 })
    expect(screen.queryByTestId('affect-placement-hint')).not.toBeInTheDocument()
    const tray = screen.getByTestId('dimensional-suggestion-tray')
    expect(tray).toBeInTheDocument()
    expect(tray.className).not.toContain('absolute')
  })

  it('places the state with arrow keys and exposes a live readout', () => {
    renderField({ progressive: true })
    const field = screen.getByRole('group', { name: 'Energy and pleasantness map' })

    expect(field).toHaveAttribute('tabindex', '0')
    expect(field).toHaveAttribute(
      'aria-describedby',
      'dimensional-instructions dimensional-keyboard-instructions',
    )

    fireEvent.keyDown(field, { key: 'ArrowLeft' })
    fireEvent.keyDown(field, { key: 'ArrowUp' })

    expect(screen.getByRole('status')).toHaveTextContent('more energy, more unpleasant')
    expect(screen.getByTestId('dimensional-suggestion-tray')).toBeInTheDocument()
    expect(document.querySelectorAll('g[role="button"]')).toHaveLength(3)
  })

  it('describes the center without forcing either axis into a direction', () => {
    renderField({ progressive: true })
    const svg = document.querySelector('svg') as SVGSVGElement
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 300, height: 300,
      top: 0, left: 0, right: 300, bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.click(svg, { clientX: 150, clientY: 150 })

    expect(screen.getByRole('status')).toHaveTextContent(
      'mid-range energy, neither pleasant nor unpleasant',
    )
  })

  it('ignores unrelated keys and clamps keyboard placement to the field', () => {
    renderField()
    const field = screen.getByRole('group', { name: 'Energy and pleasantness map' })

    fireEvent.keyDown(field, { key: 'Enter' })
    expect(screen.queryByTestId('dimensional-suggestion-tray')).not.toBeInTheDocument()

    for (let index = 0; index < 8; index++) {
      fireEvent.keyDown(field, { key: 'ArrowRight' })
      fireEvent.keyDown(field, { key: 'ArrowDown' })
    }

    expect(screen.getByRole('status')).toHaveTextContent('less energy, more pleasant')
    const crosshair = document.querySelector('[data-testid="dimensional-plot-container"] circle[r="3"]')
    expect(crosshair).toHaveAttribute('cx', '470')
    expect(crosshair).toHaveAttribute('cy', '470')
  })

  it('does not smooth-scroll suggestions when reduced motion is requested', () => {
    const originalMatchMedia = window.matchMedia
    const originalScrollIntoView = Element.prototype.scrollIntoView
    const scrollIntoView = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
    Element.prototype.scrollIntoView = scrollIntoView

    try {
      renderField()
      fireEvent.keyDown(screen.getByRole('group', { name: 'Energy and pleasantness map' }), {
        key: 'ArrowRight',
      })
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' })
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      })
      Element.prototype.scrollIntoView = originalScrollIntoView
    }
  })

  it('reveals nearby emotion pins after placement in progressive mode', () => {
    renderField({ progressive: true })
    const svg = document.querySelector('svg') as SVGSVGElement
    expect(document.querySelectorAll('g[role="button"]')).toHaveLength(0)

    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 300, height: 300,
      top: 0, left: 0, right: 300, bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.click(svg, { clientX: 120, clientY: 220 })
    expect(document.querySelectorAll('g[role="button"]')).toHaveLength(3)
  })

  it('uses 48px touch targets for suggestion chips', () => {
    renderField()
    const svg = document.querySelector('svg') as SVGSVGElement
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      top: 0,
      left: 0,
      right: 300,
      bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.click(svg, { clientX: 120, clientY: 220 })
    const tray = screen.getByTestId('dimensional-suggestion-tray')
    const chipButtons = tray.querySelectorAll('button')
    expect(chipButtons.length).toBeGreaterThan(0)
    for (const chip of chipButtons) {
      expect(chip.className).toContain('min-h-[48px]')
    }
  })

  it('selects an unselected emotion dot via onSelect', () => {
    const { onSelect, onDeselect } = renderField()
    const buttons = document.querySelectorAll('g[role="button"]')
    // Click the first button (happy)
    fireEvent.click(buttons[0])
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'happy' }))
    expect(onDeselect).not.toHaveBeenCalled()
  })

  it('chooses a contrast-safe foreground for selected suggestion colors', () => {
    renderField({ selections: [mockEmotions[1]] })
    const svg = document.querySelector('svg') as SVGSVGElement
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 300, height: 300,
      top: 0, left: 0, right: 300, bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.click(svg, { clientX: 71, clientY: 203 })

    expect(screen.getByTestId('dimensional-suggestion-chip-sad').style.getPropertyValue('--emotion-ink'))
      .toBe('#ffffff')
  })

  it('deselected a selected emotion dot via onDeselect', () => {
    const mockOnSelect = vi.fn()
    const mockOnDeselect = vi.fn()

    renderField({
      emotions: mockEmotions,
      onSelect: mockOnSelect,
      onDeselect: mockOnDeselect,
      sizes: defaultSizes,
      selections: [{ id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#FFEB3B', valence: 0.7 }],
    })

    const buttons = Array.from(document.querySelectorAll('g[role="button"]'))
    expect(buttons.length).toBeGreaterThan(0)

    // Verify the pre-selected dot renders with aria-pressed=true — confirms selections prop flows through.
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')

    // Click the happy button — it should deselect since already selected.
    fireEvent.click(buttons[0])
    expect(mockOnDeselect).toHaveBeenCalledWith(expect.objectContaining({ id: 'happy' }))
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('maps left-side click to unpleasant emotion suggestions', () => {
    renderField()
    const svg = document.querySelector('svg') as SVGSVGElement

    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      top: 0,
      left: 0,
      right: 300,
      bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    // Click in left-upper area → high arousal, low valence ≈ "angry" quadrant.
    fireEvent.click(svg, { clientX: 120, clientY: 50 })
    const tray = screen.getByTestId('dimensional-suggestion-tray')
    expect(tray).toBeInTheDocument()

    // The suggestion tray should include the angry emotion for this coordinate.
    const chipTexts = Array.from(tray.querySelectorAll('button')).map((b) => b.textContent)
    expect(chipTexts.some((t) => t?.includes('angry'))).toBe(true)
  })

  it('calls onSelect when clicking a suggestion chip', () => {
    const mockOnSelect = vi.fn()
    renderField({ onSelect: mockOnSelect })
    const svg = document.querySelector('svg') as SVGSVGElement

    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      top: 0,
      left: 0,
      right: 300,
      bottom: 300,
      toJSON: () => ({}),
    } as DOMRect)

    // Click in lower-left area → low valence, high arousal ≈ "sad" direction.
    fireEvent.click(svg, { clientX: 150, clientY: 240 })
    const tray = screen.getByTestId('dimensional-suggestion-tray')
    expect(tray).toBeInTheDocument()

    // Find and click the "sad" suggestion chip via stable data-testid selector.
    const sadChip = screen.getByTestId('dimensional-suggestion-chip-sad') as HTMLButtonElement
    expect(sadChip).toBeInTheDocument()
    fireEvent.click(sadChip)

    expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'sad' }))
    expect(screen.getByTestId('dimensional-suggestion-tray')).toBeInTheDocument()
  })
})
