import { describe, expect, it } from 'vitest'

async function loadCheckpointContract() {
  return import('../../scripts/android-physical/human-talkback.mjs')
}

describe('Android human TalkBack checkpoint contract', () => {
  it('keeps the bounded browser and installed checkpoints explicit', async () => {
    const { HUMAN_TALKBACK_CHECKPOINT_IDS } = await loadCheckpointContract()

    expect(HUMAN_TALKBACK_CHECKPOINT_IDS).toEqual([
      'onboarding-en',
      'word-en',
      'word-ro',
      'crisis-en',
      'crisis-ro',
      'installed-en',
      'installed-ro',
    ])
  })

  it('accepts exactly one known checkpoint and rejects ambiguous input', async () => {
    const { parseHumanTalkBackCheckpointArgs } = await loadCheckpointContract()

    expect(parseHumanTalkBackCheckpointArgs(['--checkpoint=word-ro'])).toBe('word-ro')
    expect(() => parseHumanTalkBackCheckpointArgs([])).toThrow('Use --checkpoint=')
    expect(() => parseHumanTalkBackCheckpointArgs(['--checkpoint=word-ro', '--checkpoint=word-en']))
      .toThrow('Use --checkpoint=')
    expect(() => parseHumanTalkBackCheckpointArgs(['--checkpoint=unknown']))
      .toThrow('Unsupported human TalkBack checkpoint')
    expect(() => parseHumanTalkBackCheckpointArgs(['--checkpoint=word-ro', '--unknown']))
      .toThrow('Use --checkpoint=')
  })
})
