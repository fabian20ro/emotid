import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const moduleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/android-physical/talkback.mjs'),
).href

async function loadTalkBack() {
  return import(moduleUrl)
}

describe('Android TalkBack supporting audit contract', () => {
  it('registers the complete J1-J9 browser scope without a new result class', async () => {
    const { TALKBACK_ACCEPTANCE_ADAPTER } = await loadTalkBack()

    expect(TALKBACK_ACCEPTANCE_ADAPTER).toMatchObject({
      name: 'android-talkback-supporting',
      journeyIds: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'j9'],
      resultClass: 'SUPPORTING_PASS',
      complete: true,
    })
  })

  it('parses strict filters and requires a destructive-safe loopback candidate', async () => {
    const { parseTalkBackArgs } = await loadTalkBack()

    expect(parseTalkBackArgs([
      '--preflight',
      '--journey=J8',
      '--language=RO',
      '--theme=DARK',
      '--audio-check',
      '--candidate-url=http://localhost:4176/emotid?fixture=a=b',
    ])).toEqual({
      help: false,
      preflight: true,
      journey: 'j8',
      language: 'ro',
      theme: 'dark',
      audioCheck: true,
      candidateUrl: 'http://localhost:4176/emotid/?fixture=a=b',
    })
    expect(parseTalkBackArgs([])).toMatchObject({
      candidateUrl: 'http://127.0.0.1:4176/emotid/',
      theme: undefined,
      audioCheck: false,
    })
    expect(() => parseTalkBackArgs(['--journey=j10'])).toThrow('Unsupported journey: j10')
    expect(() => parseTalkBackArgs(['--language=de'])).toThrow('Unsupported language: de')
    expect(() => parseTalkBackArgs(['--theme=sepia'])).toThrow('Unsupported theme: sepia')
    expect(() => parseTalkBackArgs(['--candidate-url=https://fabian20ro.github.io/emotid/']))
      .toThrow('HTTP loopback candidate')
    expect(() => parseTalkBackArgs(['--unknown'])).toThrow('Unsupported argument: --unknown')
  })

  it('builds all four language and theme combinations unless filtered', async () => {
    const { buildTalkBackVariants } = await loadTalkBack()

    expect(buildTalkBackVariants()).toEqual([
      { language: 'en', theme: 'light' },
      { language: 'en', theme: 'dark' },
      { language: 'ro', theme: 'light' },
      { language: 'ro', theme: 'dark' },
    ])
    expect(buildTalkBackVariants({ language: 'ro', theme: 'dark' }))
      .toEqual([{ language: 'ro', theme: 'dark' }])
  })

  it('extracts TTS readiness, locale, voice, and dispatch evidence', async () => {
    const { parseTalkBackTtsEvidence } = await loadTalkBack()
    const evidence = parseTalkBackTtsEvidence(`
      SpeechControllerImpl: TTS is not ready. Attempted to speak
      GoogleTTSServiceImpl: Synthesis request for locale eng-USA and name en-US-language
      GoogleTTSServiceImpl: TTS dispatch: en-us-x-iog-locomel-embedded
      GoogleTTSServiceImpl: Synthesis request for locale ron-ROU and name ro-RO-language
      GoogleTTSServiceImpl: TTS dispatch: ro-ro-x-vdf-local
    `)

    expect(evidence).toEqual({
      requests: [
        { locale: 'eng-USA', voice: 'en-US-language' },
        { locale: 'ron-ROU', voice: 'ro-RO-language' },
      ],
      dispatches: ['en-us-x-iog-locomel-embedded', 'ro-ro-x-vdf-local'],
      ttsNotReady: 1,
    })
  })

  it('reports language attribution without treating a browser mismatch as an app failure', async () => {
    const { buildLanguageDiagnostic } = await loadTalkBack()

    expect(buildLanguageDiagnostic({
      appLanguage: 'ro',
      browserLanguages: ['en-US', 'en'],
      androidLocale: 'en-US',
      requests: [{ locale: 'eng-USA', voice: 'en-US-language' }],
      dispatches: [],
    })).toEqual({
      appLanguage: 'ro',
      browserLanguages: ['en-US', 'en'],
      androidLocale: 'en-US',
      ttsLocales: ['eng-USA'],
      ttsVoices: ['en-US-language'],
      dispatchedVoices: [],
      appTtsLanguageMismatch: true,
      attribution: 'browser-or-assistive-technology-configuration',
    })
    expect(buildLanguageDiagnostic({
      appLanguage: 'ro',
      browserLanguages: ['en-US', 'en'],
      androidLocale: 'en-US',
      requests: [{ locale: 'eng-USA', voice: 'en-US-language' }],
      dispatches: ['ro-ro-x-vfv-lstm-embedded'],
    })).toMatchObject({
      appTtsLanguageMismatch: false,
      attribution: 'aligned-by-dispatched-voice',
    })
  })

  it('validates audible output and attributes locally detected speech language', async () => {
    const { buildAudioLanguageDiagnostic, parseVolumeDetect } = await loadTalkBack()

    expect(parseVolumeDetect(`
      [Parsed_volumedetect] mean_volume: -48.5 dB
      [Parsed_volumedetect] max_volume: -22.1 dB
    `)).toEqual({ meanVolumeDb: -48.5, maxVolumeDb: -22.1, audible: true })
    expect(parseVolumeDetect('[Parsed_volumedetect] max_volume: -91.0 dB').audible).toBe(false)
    expect(buildAudioLanguageDiagnostic({
      appLanguage: 'ro',
      detectedLanguage: 'en',
      probability: 0.93,
      transcript: 'TalkBack on. Progres zero la sută.',
    })).toEqual({
      appLanguage: 'ro',
      detectedLanguage: 'en',
      probability: 0.93,
      transcript: 'TalkBack on. Progres zero la sută.',
      languageMatch: false,
      attribution: 'mixed-or-assistive-technology-output-language-mismatch',
    })
  })

  it('requires real TalkBack state, native actions, TTS dispatch, and the route postcondition', async () => {
    const { validateTalkBackRowEvidence } = await loadTalkBack()
    const ready = {
      talkBack: { enabled: true, bound: true, touchExploration: true },
      focusSequence: [{ name: 'Try saving again', role: 'button' }],
      nativeActivationCount: 1,
      tts: {
        requests: [{ locale: 'eng-USA', voice: 'en-US-language' }],
        dispatches: ['en-us-x-iog-locomel-embedded'],
        ttsNotReady: 0,
      },
      postconditionPassed: true,
    }

    expect(validateTalkBackRowEvidence(ready)).toBe(ready)
    expect(() => validateTalkBackRowEvidence({ ...ready, nativeActivationCount: 0 }))
      .toThrow('no native activation')
    expect(() => validateTalkBackRowEvidence({
      ...ready,
      talkBack: { enabled: true, bound: false, touchExploration: true },
    })).toThrow('TalkBack service was not bound')
    expect(() => validateTalkBackRowEvidence({
      ...ready,
      tts: { requests: [], dispatches: [], ttsNotReady: 0 },
    })).toThrow('no TTS synthesis')
    expect(() => validateTalkBackRowEvidence({ ...ready, postconditionPassed: false }))
      .toThrow('postcondition failed')
  })

  it('fails the overall report when any journey row fails', async () => {
    const { classifyTalkBackRun } = await loadTalkBack()

    expect(classifyTalkBackRun([
      { result: 'SUPPORTING_PASS' },
      { result: 'SUPPORTING_PASS' },
    ])).toBe('SUPPORTING_PASS')
    expect(classifyTalkBackRun([
      { result: 'SUPPORTING_PASS' },
      { result: 'FAIL' },
    ])).toBe('FAIL')
  })
})
