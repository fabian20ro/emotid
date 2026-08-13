export const HUMAN_TALKBACK_CHECKPOINT_IDS = Object.freeze([
  'onboarding-en',
  'word-en',
  'word-ro',
  'crisis-en',
  'crisis-ro',
  'installed-en',
  'installed-ro',
])

export function parseHumanTalkBackCheckpointArgs(args) {
  const checkpointArgs = args.filter((argument) => argument.startsWith('--checkpoint='))
  if (checkpointArgs.length !== 1 || args.length !== 1) {
    throw new Error(`Use --checkpoint=${HUMAN_TALKBACK_CHECKPOINT_IDS.join('|')}`)
  }
  const checkpoint = checkpointArgs[0].slice('--checkpoint='.length)
  if (!HUMAN_TALKBACK_CHECKPOINT_IDS.includes(checkpoint)) {
    throw new Error(`Unsupported human TalkBack checkpoint: ${checkpoint}`)
  }
  return checkpoint
}
