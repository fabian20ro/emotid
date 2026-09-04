import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GranularityTraining } from '../components/GranularityTraining'
import { LanguageProvider } from '../context/LanguageContext'
import en from '../i18n/en.json'
import ro from '../i18n/ro.json'

function renderTraining(props: Partial<React.ComponentProps<typeof GranularityTraining>> = {}) {
  const defaults: React.ComponentProps<typeof GranularityTraining> = {
    isOpen: true,
    onClose: vi.fn(),
    ...props,
  }

  return {
    ...render(
      <LanguageProvider>
        <GranularityTraining {...defaults} />
      </LanguageProvider>,
    ),
    props: defaults,
  }
}

describe('GranularityTraining', () => {
  for (const [language, copy] of [['en', en], ['ro', ro]] as const) {
    it(`shows a distinct contrast and concrete example before each choice (${language})`, async () => {
      localStorage.setItem('emot-id-language', language)
      const user = userEvent.setup()
      const { unmount } = renderTraining()
      for (const contrast of Object.values(copy.granularity.contrasts)) {
        expect(screen.getByText(contrast.meaning)).toBeInTheDocument()
        expect(screen.getByText(contrast.example)).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: copy.granularity.notSure }))
        await user.click(screen.getByRole('button', { name: copy.granularity.continue }))
      }
      expect(screen.getByText(copy.granularity.completedTitle)).toBeInTheDocument()
      unmount()
      localStorage.clear()
    })
  }
  it('renders step progress and keeps continue disabled until a response is selected', () => {
    renderTraining()

    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('shows normalized lowercase options in practice mode', () => {
    renderTraining()

    expect(screen.getByRole('button', { name: 'anxiety' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'apprehension' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'fear' })).toBeInTheDocument()
  })

  it('shows immediate feedback after selecting an emotion option', async () => {
    const user = userEvent.setup()
    renderTraining()

    await user.click(screen.getByRole('button', { name: 'anxiety' }))

    expect(screen.getByText(/You chose anxiety/i)).toBeInTheDocument()
    expect(screen.getByText(/not a fixed intensity ladder/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  it('shows dedicated non-judgmental feedback for not-sure path', async () => {
    const user = userEvent.setup()
    renderTraining()

    await user.click(screen.getByRole('button', { name: 'Not sure yet' }))

    expect(screen.getByText('You can continue without choosing among these words.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  it('completes after 5 steps without scoring answers and can restart', async () => {
    const user = userEvent.setup()
    renderTraining()

    const choices = ['anxiety', 'annoyance', 'sadness', 'guilt', 'interest']

    for (const choice of choices) {
      await user.click(screen.getByRole('button', { name: choice }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
    }

    expect(screen.getByText('Practice session completed')).toBeInTheDocument()
    expect(screen.queryByText('Clear choices')).not.toBeInTheDocument()
    expect(screen.queryByText('Unsure choices')).not.toBeInTheDocument()
    expect(screen.queryByText(/^5$/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restart' }))
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('finishes the not-sure path without reporting it as a result', async () => {
    const user = userEvent.setup()
    renderTraining()

    // Select some emotions and use "not-sure" for others
    await user.click(screen.getByRole('button', { name: 'anxiety' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await user.click(screen.getByText('Not sure yet'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    // Continue through remaining steps with selections
    const remaining = ['sadness', 'guilt', 'interest']
    for (const choice of remaining) {
      await user.click(screen.getByRole('button', { name: choice }))
      await user.click(screen.getByRole('button', { name: 'Continue' }))
    }

    expect(screen.getByText('Practice session completed')).toBeInTheDocument()
    expect(screen.queryByText('Clear choices')).not.toBeInTheDocument()
    expect(screen.queryByText('Unsure choices')).not.toBeInTheDocument()
    expect(screen.queryByText(/^1$/)).not.toBeInTheDocument()
  })

  it('renders as a routed screen with a Back affordance', () => {
    renderTraining()

    expect(screen.getByTestId('granularity-screen')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
  })
})
