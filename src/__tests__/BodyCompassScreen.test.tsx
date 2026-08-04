import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BodyCompassScreen } from '../screens/BodyCompassScreen'
import { LanguageProvider } from '../context/LanguageContext'
import type { AnalysisResult, BaseEmotion } from '../models/types'
import { somaticModel } from '../models/somatic'

function renderScreen() {
  const onBack = vi.fn()
  const onComplete = vi.fn<(modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void>()
  render(
    <LanguageProvider>
      <BodyCompassScreen model={somaticModel} onBack={onBack} onComplete={onComplete} />
    </LanguageProvider>
  )
  return { onBack, onComplete }
}

async function chooseChest(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByTestId('bodymap-root')
  const chest = document.querySelector('[data-region="chest"]')
  expect(chest).not.toBeNull()
  await user.click(chest!)
}

describe('BodyCompassScreen', () => {
  beforeEach(() => window.localStorage.clear())

  it('collects a region, sensation, and intensity before completing', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderScreen()

    await chooseChest(user)
    expect(screen.getByRole('heading', { name: 'What do you feel here?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /tension/i }))
    expect(screen.getByRole('heading', { name: 'How intense?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /moderate/i }))

    const signal = screen.getByTestId('body-signal-chest')
    expect(screen.getByRole('heading', { name: 'Where do you notice a body sensation?' })).toBeInTheDocument()
    expect(signal).toHaveTextContent('Chest')
    expect(signal).toHaveTextContent('Tension - Moderate')
    expect(signal).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Review your body signals' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'See what might fit' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
    const [modelId, selections, results] = onComplete.mock.calls[0]
    expect(modelId).toBe('somatic')
    expect(selections).toMatchObject([{ id: 'chest', selectedSensation: 'tension', selectedIntensity: 2 }])
    expect(results.some((result) => result.id === 'anxiety')).toBe(true)
  })

  it('offers front, back, and semantic list selection through one region flow', async () => {
    const user = userEvent.setup()
    renderScreen()
    await screen.findByTestId('bodymap-root')

    expect(screen.getByRole('button', { name: 'Front' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('[data-region="chest"]')).toBeInTheDocument()
    expect(document.querySelector('[data-region="upper-back"]')).not.toBeInTheDocument()

    const sideSwitcher = screen.getByRole('group', { name: 'Body side' })
    const backSide = within(sideSwitcher).getByRole('button', { name: 'Back', exact: true })
    await user.click(backSide)
    expect(backSide).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('[data-region="upper-back"]')).toBeInTheDocument()
    expect(document.querySelector('[data-region="chest"]')).not.toBeInTheDocument()

    await user.click(within(sideSwitcher).getByRole('button', { name: 'List' }))
    expect(screen.queryByTestId('bodymap-root')).not.toBeInTheDocument()
    const list = screen.getByRole('group', { name: 'Body areas' })
    const chest = within(list).getByRole('button', { name: 'Chest' })
    chest.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: 'What do you feel here?' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('supports step back and abandoning a draft without leaving the route', async () => {
    const user = userEvent.setup()
    const { onBack } = renderScreen()

    await chooseChest(user)
    await user.click(screen.getByRole('button', { name: /tension/i }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'What do you feel here?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose another area' }))
    expect(screen.getByRole('heading', { name: 'Where do you notice a body sensation?' })).toBeInTheDocument()
    expect(onBack).not.toHaveBeenCalled()
  })

  it('edits and removes an inline signal while keeping the region available', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderScreen()

    await chooseChest(user)
    await user.click(screen.getByRole('button', { name: /tension/i }))
    await user.click(screen.getByRole('button', { name: /mild/i }))

    expect(screen.getByTestId('body-signal-chest')).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Edit Chest' }))
    await user.click(screen.getByRole('button', { name: /warmth/i }))
    await user.click(screen.getByRole('button', { name: /strong/i }))
    const signal = screen.getByTestId('body-signal-chest')
    expect(signal).toHaveTextContent('Warmth - Strong')
    expect(signal).not.toHaveTextContent('Tension')

    await user.click(screen.getByRole('button', { name: 'See what might fit' }))
    expect(onComplete.mock.calls[0][1]).toHaveLength(1)

    onComplete.mockClear()
    await user.click(screen.getByRole('button', { name: 'Edit Chest' }))
    await user.click(screen.getByRole('button', { name: 'Choose another area' }))
    await user.click(within(screen.getByTestId('body-signal-chest')).getByRole('button', { name: 'Remove Chest' }))
    expect(screen.getByRole('heading', { name: 'Where do you notice a body sensation?' })).toBeInTheDocument()
    expect(screen.queryByTestId('body-signal-chest')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'List' }))
    expect(within(screen.getByRole('group', { name: 'Body areas' })).getByRole('button', { name: 'Chest' })).toBeInTheDocument()
  })
})
