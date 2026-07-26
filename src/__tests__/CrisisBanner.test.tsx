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
  temporalNote: 'Temporal note text',
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
    render(<CrisisBanner tier="tier2" crisisT={mockCrisisT} showTemporalNote={true} />)
    expect(screen.getByText('Tier 2 message')).toBeInTheDocument()
    expect(screen.getByText('Grounding title')).toBeInTheDocument()
    expect(screen.getByText('Grounding body')).toBeInTheDocument()
  })

  it('renders tier 3 with grounding details', () => {
    render(<CrisisBanner tier="tier3" crisisT={mockCrisisT} showTemporalNote={true} />)
    expect(screen.getByText('Tier 3 message')).toBeInTheDocument()
    expect(screen.getByText('Grounding title')).toBeInTheDocument()
  })

  it('renders tier 4 with semantic danger styling, temporal note, and an alert region', () => {
    render(<CrisisBanner tier="tier4" crisisT={mockCrisisT} showTemporalNote={true} />)
    expect(screen.getByText('Tier 4 message')).toBeInTheDocument()
    // Tier 4 still shows the temporal note when requested (safety-critical gating)
    expect(screen.getByText('Temporal note text')).toBeInTheDocument()
    // Note: tier 4 currently does not show grounding in the component logic
    expect(screen.queryByText('Grounding title')).not.toBeInTheDocument()
    // Deterministic accessibility check: root must announce as alert region (safety-critical gating)
    const container = document.querySelector('[role="alert"]')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('crisis-banner', 'is-tier4')
    expect(container?.getAttribute('aria-live')).toBe('polite')
  })

  it('does not render temporal note when showTemporalNote is false', () => {
    render(<CrisisBanner tier="tier2" crisisT={mockCrisisT} showTemporalNote={false} />)
    expect(screen.getByText('Tier 2 message')).toBeInTheDocument()
    expect(screen.queryByText('Temporal note text')).not.toBeInTheDocument()
  })

  it('shows temporal note when requested', () => {
    render(<CrisisBanner tier="tier1" crisisT={mockCrisisT} showTemporalNote={true} />)
    expect(screen.getByText('Temporal note text')).toBeInTheDocument()
  })

  it('falls back to "Support is available." when all translation keys are missing', () => {
    render(<CrisisBanner tier="tier3" crisisT={{}} />)
    expect(screen.getByText('Support is available.')).toBeInTheDocument()
  })
})
