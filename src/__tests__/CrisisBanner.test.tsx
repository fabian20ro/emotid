import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CrisisBanner } from '../components/CrisisBanner'

const mockCrisisT = {
  tier1: 'Tier 1 message',
  tier2: 'Tier 2 message',
  tier3: 'Tier 3 message',
  tier4: 'Tier 4 message',
  roLine: 'Romania: DepreHUB',
  intLine: 'International: help',
  disclaimer: 'Disclaimer text',
  groundingTitle: 'Grounding title',
  groundingBody: 'Grounding body'
}

describe('CrisisBanner', () => {
  it('renders tier 1 correctly', () => {
    render(<CrisisBanner tier="tier1" crisisT={mockCrisisT} />)
    expect(screen.getByText('Tier 1 message')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Romania: DepreHUB' })).toHaveAttribute('href', 'tel:+40374456420')
    expect(screen.getByRole('link', { name: 'International: help' })).toHaveAttribute('href', 'https://findahelpline.com')
  })

  it('renders tier 2 with grounding details', () => {
    render(<CrisisBanner tier="tier2" crisisT={mockCrisisT} />)
    expect(screen.getByText('Tier 2 message')).toBeInTheDocument()
    expect(screen.getByText('Grounding title')).toBeInTheDocument()
    expect(screen.getByText('Grounding body')).toBeInTheDocument()
  })

  it('renders tier 3 with grounding details', () => {
    render(<CrisisBanner tier="tier3" crisisT={mockCrisisT} />)
    expect(screen.getByText('Tier 3 message')).toBeInTheDocument()
    expect(screen.getByText('Grounding title')).toBeInTheDocument()
  })

  it('renders tier 4 with semantic danger styling and a concise alert before support resources', () => {
    render(<CrisisBanner tier="tier4" crisisT={mockCrisisT} />)
    expect(screen.getByText('Tier 4 message')).toBeInTheDocument()
    // Note: tier 4 currently does not show grounding in the component logic
    expect(screen.queryByText('Grounding title')).not.toBeInTheDocument()
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Tier 4 message')
    expect(alert).not.toContainElement(screen.getByRole('link', { name: 'Romania: DepreHUB' }))
    expect(alert.closest('.crisis-banner')).toHaveClass('is-tier4')
    expect(alert).not.toHaveAttribute('aria-live')
  })

  it('falls back to "Support is available." when all translation keys are missing', () => {
    render(<CrisisBanner tier="tier3" crisisT={{}} />)
    expect(screen.getByText('Support is available.')).toBeInTheDocument()
  })
})
