import { ExternalLink, Phone } from 'lucide-react'
import type { CrisisTier } from '../models/distress'

export function CrisisBanner({
  tier,
  crisisT,
  showTemporalNote = false,
}: {
  tier: CrisisTier
  crisisT: Record<string, string>
  showTemporalNote?: boolean
}) {
  function getMessageKey(tier: CrisisTier): string {
    switch (tier) {
      case 'tier4': return 'tier4'
      case 'tier3': return 'tier3'
      case 'tier2': return 'tier2'
      case 'tier1': return 'tier1'
      default: return 'tier1'
    }
  }

  const messageKey = getMessageKey(tier)
  const message = crisisT[messageKey] ?? crisisT.tier2 ?? 'Support is available.'
  const isTier4 = tier === 'tier4'

  return (
    <div className={`crisis-banner${isTier4 ? ' is-tier4' : ''}`} role="alert" aria-live="polite">
      <p className="crisis-message">{message}</p>
      <div className="crisis-resources">
        <a href="tel:+40374456420" className="crisis-resource">
          <Phone size={19} aria-hidden="true" />
          <span>{crisisT.roLine ?? 'Romania — DepreHUB: 0374 456 420 (free, confidential, 24/7)'}</span>
        </a>
        <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="crisis-resource">
          <ExternalLink size={19} aria-hidden="true" />
          <span>{crisisT.intLine ?? 'International: findahelpline.com'}</span>
        </a>
      </div>
      <p className="crisis-disclaimer">
        {crisisT.disclaimer ?? 'If you are in immediate danger, please call emergency services.'}
      </p>
      {showTemporalNote && (
        <p className="crisis-temporal-note">
          {crisisT.temporalNote ?? "We noticed this pattern appearing more often lately. That's okay — it's information, not a judgment."}
        </p>
      )}

      {(tier === 'tier2' || tier === 'tier3') && (
        <details className="crisis-grounding">
          <summary>
            {crisisT.groundingTitle ?? 'A quick grounding technique (5-for-3-2-1)'}
          </summary>
          <p>
            {crisisT.groundingBody ?? 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.'}
          </p>
        </details>
      )}
    </div>
  )
}
