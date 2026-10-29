import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { PrivacyDataScreen } from '../screens/PrivacyDataScreen'

function renderPrivacy(overrides: Partial<React.ComponentProps<typeof PrivacyDataScreen>> = {}) {
  const props: React.ComponentProps<typeof PrivacyDataScreen> = {
    saveSessions: true,
    allowExternalAI: true,
    onBack: vi.fn(),
    onSaveSessionsChange: vi.fn(),
    onExternalAIChange: vi.fn(),
    onExport: vi.fn().mockResolvedValue(undefined),
    onClear: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return { ...render(<LanguageProvider><PrivacyDataScreen {...props} /></LanguageProvider>), props }
}

describe('PrivacyDataScreen', () => {
  beforeEach(() => localStorage.clear())

  it.each(['cancel', 'escape', 'success'])('restores a non-focused touch opener after %s', async (action) => {
    renderPrivacy()
    const trigger = screen.getByRole('button', { name: 'Delete all local data' })
    // Safari taps need not make the trigger document.activeElement.
    fireEvent.click(trigger)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    if (action === 'escape') fireEvent.keyDown(document, { key: 'Escape' })
    else fireEvent.click(screen.getByRole('button', { name: action === 'cancel' ? 'Cancel' : 'Delete everything' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('portals and focus-traps destructive confirmation, then clears all data', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn().mockResolvedValue(undefined)
    renderPrivacy({ onClear })
    const trigger = screen.getByRole('button', { name: 'Delete all local data' })

    trigger.focus()
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Delete all local data?' })
    expect(document.body).toContainElement(dialog)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Delete everything' }))
    await waitFor(() => expect(onClear).toHaveBeenCalledOnce())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Local data was deleted')
  })

  it('closes confirmation with Escape and restores focus', async () => {
    const user = userEvent.setup()
    renderPrivacy()
    const trigger = screen.getByRole('button', { name: 'Delete all local data' })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('reports export failures without opening a download', async () => {
    const user = userEvent.setup()
    renderPrivacy({ onExport: vi.fn().mockRejectedValue(new Error('failed')) })

    await user.click(screen.getByRole('button', { name: 'Export my data' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The action could not be completed')
  })
})
