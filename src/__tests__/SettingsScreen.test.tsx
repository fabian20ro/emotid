import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { SettingsScreen } from '../screens/SettingsScreen'

function renderSettings(theme: 'light' | 'dark' = 'light') {
  const props: React.ComponentProps<typeof SettingsScreen> = {
    theme,
    onBack: vi.fn(),
    onThemeChange: vi.fn(),
    onOpenPrivacy: vi.fn(),
    onOpenSupport: vi.fn(),
  }
  return {
    ...render(<LanguageProvider><SettingsScreen {...props} /></LanguageProvider>),
    props,
  }
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('emot-id-language', 'en')
  })

  it('shows only preferences the application actually implements', () => {
    renderSettings()

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Appearance' })).toBeInTheDocument()
    expect(screen.queryByText('Simple language')).not.toBeInTheDocument()
    expect(screen.queryByText('Sound effects')).not.toBeInTheDocument()
    expect(screen.queryByText('Daily reminder')).not.toBeInTheDocument()
  })

  it('exposes current language and appearance as pressed states', async () => {
    const user = userEvent.setup()
    const { props } = renderSettings()
    const english = screen.getByRole('button', { name: 'EN' })
    const romanian = screen.getByRole('button', { name: 'RO' })
    const light = screen.getByRole('button', { name: 'Light' })
    const dark = screen.getByRole('button', { name: 'Dark' })

    expect(english).toHaveAttribute('aria-pressed', 'true')
    expect(romanian).toHaveAttribute('aria-pressed', 'false')
    expect(light).toHaveAttribute('aria-pressed', 'true')
    expect(dark).toHaveAttribute('aria-pressed', 'false')

    await user.click(romanian)
    expect(romanian).toHaveAttribute('aria-pressed', 'true')
    await user.click(dark)
    expect(props.onThemeChange).toHaveBeenCalledWith('dark')
  })
})
