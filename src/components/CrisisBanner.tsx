import { ExternalLink, Phone } from 'lucide-react'
import type { CrisisTier } from '../models/distress'
import { CRISIS_RESOURCES } from '../models/crisis-resources'

export function CrisisBanner({
  tier,
  crisisT,
}: {
  tier: CrisisTier
  crisisT: Record<string, string>
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
    <div className={`crisis-banner${isTier4 ? ' is-tier4' : ''}`}>
      <p className="crisis-message" role="alert">{message}</p>
      <div className="crisis-resources">
        <a href={CRISIS_RESOURCES.romania.href} className="crisis-resource">
          <Phone size={19} aria-hidden="true" />
          <span>{crisisT.roLine ?? 'Romania — DepreHUB: 0374 456 420 (free, confidential, 24/7)'}</span>
        </a>
        <a href={CRISIS_RESOURCES.international.href} target="_blank" rel="noopener noreferrer" className="crisis-resource">
          <ExternalLink size={19} aria-hidden="true" />
          <span>{crisisT.intLine ?? 'International: findahelpline.com'}</span>
        </a>
      </div>
      <p className="crisis-disclaimer">
        {crisisT.disclaimer ?? 'If you are in immediate danger, please call emergency services.'}
      </p>
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
