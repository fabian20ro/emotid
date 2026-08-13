import {
  ACCEPTANCE_JOURNEY_IDS,
  ACCEPTANCE_LANGUAGES,
  ACCEPTANCE_RESULTS,
  validateAcceptanceAdapter,
} from '../acceptance/contract.mjs'

export const TALKBACK_ACCEPTANCE_ADAPTER = validateAcceptanceAdapter({
  name: 'android-talkback-supporting',
  journeyIds: ACCEPTANCE_JOURNEY_IDS,
  resultClass: ACCEPTANCE_RESULTS.supportingPass,
  complete: true,
})

export const TALKBACK_THEMES = Object.freeze(['light', 'dark'])

function normalizeCandidateUrl(candidateUrl) {
  let candidate
  try {
    candidate = new URL(candidateUrl)
  } catch {
    throw new Error(`Invalid candidate URL: ${candidateUrl}`)
  }
  if (candidate.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(candidate.hostname)) {
    throw new Error('TalkBack audit requires an HTTP loopback candidate')
  }
  if (!candidate.pathname.endsWith('/')) candidate.pathname += '/'
  return candidate.href
}

export function parseTalkBackArgs(args) {
  const options = {
    help: false,
    preflight: false,
    audioCheck: false,
    journey: undefined,
    language: undefined,
    theme: undefined,
    candidateUrl: 'http://127.0.0.1:4176/emotid/',
  }

  for (const argument of args) {
    if (argument === '--help') options.help = true
    else if (argument === '--preflight') options.preflight = true
    else if (argument === '--audio-check') options.audioCheck = true
    else if (argument.startsWith('--journey=')) options.journey = argument.slice(10).toLowerCase()
    else if (argument.startsWith('--language=')) options.language = argument.slice(11).toLowerCase()
    else if (argument.startsWith('--theme=')) options.theme = argument.slice(8).toLowerCase()
    else if (argument.startsWith('--candidate-url=')) options.candidateUrl = argument.slice(16)
    else throw new Error(`Unsupported argument: ${argument}`)
  }

  if (options.journey && !ACCEPTANCE_JOURNEY_IDS.includes(options.journey)) {
    throw new Error(`Unsupported journey: ${options.journey}`)
  }
  if (options.language && !ACCEPTANCE_LANGUAGES.includes(options.language)) {
    throw new Error(`Unsupported language: ${options.language}`)
  }
  if (options.theme && !TALKBACK_THEMES.includes(options.theme)) {
    throw new Error(`Unsupported theme: ${options.theme}`)
  }
  options.candidateUrl = normalizeCandidateUrl(options.candidateUrl)
  return options
}

export function buildTalkBackVariants(filters = {}) {
  const languages = filters.language ? [filters.language] : ACCEPTANCE_LANGUAGES
  const themes = filters.theme ? [filters.theme] : TALKBACK_THEMES
  return languages.flatMap((language) => themes.map((theme) => ({ language, theme })))
}

export function parseTalkBackTtsEvidence(logcat) {
  return {
    requests: [...logcat.matchAll(/Synthesis request for locale ([^\s]+) and name ([^\s]+)/g)]
      .map((match) => ({ locale: match[1], voice: match[2] })),
    dispatches: [...logcat.matchAll(/TTS dispatch: ([^\s]+)/g)].map((match) => match[1]),
    ttsNotReady: (logcat.match(/TTS is not ready/g) ?? []).length,
  }
}

export function buildLanguageDiagnostic({
  appLanguage,
  browserLanguages,
  androidLocale,
  requests,
  dispatches = [],
}) {
  const ttsLocales = [...new Set(requests.map(({ locale }) => locale))]
  const ttsVoices = [...new Set(requests.map(({ voice }) => voice))]
  const expectedPrefix = appLanguage === 'ro' ? 'ro' : 'en'
  const dispatchMatches = dispatches.some((voice) => voice.toLowerCase().startsWith(expectedPrefix))
  const appTtsLanguageMismatch = !dispatchMatches && ttsLocales.length > 0
    && ttsLocales.every((locale) => !locale.toLowerCase().startsWith(expectedPrefix))
  return {
    appLanguage,
    browserLanguages,
    androidLocale,
    ttsLocales,
    ttsVoices,
    dispatchedVoices: [...new Set(dispatches)],
    appTtsLanguageMismatch,
    attribution: dispatchMatches
      ? 'aligned-by-dispatched-voice'
      : appTtsLanguageMismatch
        ? 'browser-or-assistive-technology-configuration'
        : 'aligned-or-undetermined',
  }
}

export function parseVolumeDetect(output) {
  const meanVolumeDb = Number(output.match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/)?.[1] ?? Number.NEGATIVE_INFINITY)
  const maxVolumeDb = Number(output.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/)?.[1] ?? Number.NEGATIVE_INFINITY)
  return {
    meanVolumeDb,
    maxVolumeDb,
    audible: Number.isFinite(maxVolumeDb) && maxVolumeDb > -60,
  }
}

export function buildAudioLanguageDiagnostic({
  appLanguage,
  detectedLanguage,
  probability,
  transcript,
  dispatchedVoices = [],
}) {
  const languageMatch = appLanguage === detectedLanguage
  const expectedPrefix = appLanguage === 'ro' ? 'ro' : 'en'
  const appVoiceMatch = dispatchedVoices.some((voice) => voice.toLowerCase().startsWith(expectedPrefix))
  return {
    appLanguage,
    detectedLanguage,
    probability,
    transcript,
    languageMatch,
    dispatchedVoices: [...new Set(dispatchedVoices)],
    appVoiceMatch,
    attribution: appVoiceMatch && languageMatch
      ? 'app-and-assistive-technology-output-aligned'
      : appVoiceMatch
        ? 'localized-app-voice-with-mixed-assistive-technology-output'
        : 'mixed-or-assistive-technology-output-language-mismatch',
  }
}

export function validateTalkBackRowEvidence(evidence) {
  if (!evidence.talkBack.enabled) throw new Error('TalkBack was not enabled')
  if (!evidence.talkBack.bound) throw new Error('TalkBack service was not bound')
  if (!evidence.talkBack.touchExploration) throw new Error('TalkBack touch exploration was disabled')
  if (evidence.focusSequence.length === 0) throw new Error('TalkBack row captured no focused controls')
  if (evidence.nativeActivationCount === 0) throw new Error('TalkBack row captured no native activation')
  if (evidence.tts.requests.length === 0) throw new Error('TalkBack row generated no TTS synthesis request')
  if (evidence.tts.dispatches.length === 0) throw new Error('TalkBack row generated no TTS dispatch')
  if (evidence.tts.ttsNotReady > 0) throw new Error('TalkBack TTS was not ready during the row')
  if (!evidence.postconditionPassed) throw new Error('TalkBack row postcondition failed')
  return evidence
}

export function classifyTalkBackRun(rows) {
  return rows.some(({ result }) => result === ACCEPTANCE_RESULTS.fail)
    ? ACCEPTANCE_RESULTS.fail
    : ACCEPTANCE_RESULTS.supportingPass
}
