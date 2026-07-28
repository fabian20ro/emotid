import safetyRules from './safety-rules.json'

export const SAFETY_RULESET_VERSION = safetyRules.version

/**
 * Words that make support more visible. This explicit list is a product safety rule,
 * not a risk assessment or a conclusion about the user's state.
 */
export const HIGH_DISTRESS_IDS: ReadonlySet<string> = new Set(safetyRules.highDistressIds)

/** Word pairs that make the conditional support prompt more prominent. */
export const TIER3_COMBOS: ReadonlyArray<readonly [string, string]> =
  safetyRules.tier3Combos.map(([first, second]) => [first, second] as const)

/** Word triples that place support before reflection until acknowledged. */
export const TIER4_COMBOS: ReadonlyArray<readonly [string, string, string]> =
  safetyRules.tier4Combos.map(([first, second, third]) => [first, second, third] as const)

export type CrisisTier = 'none' | 'tier1' | 'tier2' | 'tier3' | 'tier4'

/**
 * Determine support-prompt prominence from selected result IDs.
 * Labels cannot establish severity, danger, or self-harm intent.
 */
export function getCrisisTier(resultIds: string[]): CrisisTier {
  const distressIds = [...new Set(resultIds.filter((id) => HIGH_DISTRESS_IDS.has(id)))]

  if (distressIds.length === 0) return 'none'

  // Check tier 4 triples first (highest prompt prominence).
  for (const [a, b, c] of TIER4_COMBOS) {
    if (distressIds.includes(a) && distressIds.includes(b) && distressIds.includes(c)) {
      return 'tier4'
    }
  }

  // Check tier 3 combinations.
  for (const [a, b] of TIER3_COMBOS) {
    if (distressIds.includes(a) && distressIds.includes(b)) {
      return 'tier3'
    }
  }

  if (distressIds.length >= 2) return 'tier2'
  return 'tier1'
}
