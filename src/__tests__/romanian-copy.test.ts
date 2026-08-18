import { describe, expect, it } from 'vitest'
import ro from '../i18n/ro.json'
import { emotionCatalog } from '../models/catalog'
import { dimensionalModel } from '../models/dimensional'
import { plutchikModel } from '../models/plutchik'
import { somaticModel, somaticRegions } from '../models/somatic'
import { INTENSITY_LABELS, SENSATION_CONFIG } from '../models/somatic/display'
import { pleasantCombinationCopy, synthesisCopy } from '../models/synthesis-copy'
import { wheelModel } from '../models/wheel'

const REVIEWED_ROMANIAN_LABELS = {
  accomplished: 'Împlinit',
  afraid: 'înfricoșat',
  alienated: 'Înstrăinat',
  appalled: 'Îngrozit',
  apprehensive: 'Cu presimțiri',
  ashamed: 'Rușinat',
  bad: 'Rău',
  betrayed: 'Trădat',
  bitter: 'Amărât',
  blessed: 'Binecuvântat',
  brave: 'Îndrăzneț',
  confident: 'Încrezător',
  compassion: 'compasiune',
  contemptuous: 'Disprețuitor',
  content: 'Mulțumit',
  deceived: 'Înșelat',
  defenseless: 'Fără apărare',
  delighted: 'Încântat',
  depleted: 'Secătuit',
  detached: 'Detașat',
  determined: 'Hotărât',
  disappointed_disg: 'Dezamăgit',
  disappointed_sad: 'Dezamăgit',
  disrespected: 'Lipsă de respect',
  dread: 'Groază',
  eager: 'Nerăbdător',
  fearful: 'Temător',
  fed_up: 'Sătul',
  frightened: 'Înfricoșat',
  heartbroken: 'Cu inima frântă',
  hopeful: 'Plin de speranță',
  hopeless: 'Deznădăjduit',
  hurt: 'Rănit',
  infuriated: 'Înfuriat',
  let_down: 'Dezamăgit',
  loneliness: 'Singurătate',
  moved: 'Emoționat',
  nauseated: 'Greață',
  on_edge: 'Cu nervii întinși',
  on_guard: 'În gardă',
  out_of_control: 'Scăpat de sub control',
  overwhelmed: 'Copleșit',
  overwhelmed_bad: 'Copleșit',
  overwhelmed_fear: 'Copleșit',
  patronized: 'Tratat cu condescendență',
  peaceful: 'Pașnic',
  pensive: 'gânditor',
  playful: 'Jucăuș',
  proud: 'Mândru',
  relief: 'Ușurare',
  remorseful: 'Plin de remușcări',
  repugnant: 'Respingător',
  repulsed: 'Scârbit',
  restless: 'Neliniștit',
  rushed: 'Grăbit',
  safe: 'În siguranță',
  satisfied: 'Satisfăcut',
  self_conscious: 'Stânjenit',
  self_doubting: 'Plin de îndoieli',
  shocked: 'Șocat',
  sickened: 'Îngrețoșat',
  speechless: 'Fără cuvinte',
  spiteful: 'Răuvoitor',
  startled: 'Tresărit',
  tainted: 'Întinat',
  tender: 'Gingaș',
  thankful: 'Recunoscător',
  threatened: 'Amenințat',
  trapped: 'Prins în capcană',
  trusting: 'Încredere',
  vengeful: 'Dornic de răzbunare',
  worried: 'Îngrijorat',
  worry: 'Îngrijorare',
  wounded: 'Rănit profund',
} as const

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(collectStrings)
}

const FORMAL_SECOND_PERSON = new RegExp(
  String.raw`\b(?:acceptați|ați|aveți|ajutați|alegeți|adăugați|apelați|apreciați|arătați|atingeți|auziți|căutați|cereți|combinați|comparați|confirmați|contactați|continuați|descrieți|deschideți|desfaceți|doriți|editați|eliminați|explorați|exportați|exersați|faceți|folosiți|găsiți|gândiți|ghidați|gustați|identificați|indicați|includeți|încercați|începeți|încheiați|închideți|lăsați|luați|mirosiți|notați|numiți|observați|opriți|păstrați|permiteți|plasați|priviți|redeschideți|reflectați|reîncepeți|reluați|restrângeți|reveniți|revizuiți|salvați|selectați|simțiți|spuneți|sunteți|ștergeți|știți|treceți|vedeți|vi|voi|vouă|vostru|voastră|voștri|voastre|vă)(?=$|\s|[-–—,.;:!?])`,
  'iu',
)

const CONFIRMED_MISSPELLINGS = new RegExp(
  String.raw`\b(?:actiune|asociata|blanda|bratelor|caldura|compașiune|dorinta|emotional|emotionala|emotionale|impamantrare|inclestrare|intindere|legata|lenta|lombara|mandrie|miscare|neliniste|profunda|respiratie|rusine|strangere|sustinuta|talpilor|tristete)\b`,
  'iu',
)

function generatedRomanianCopy(): string[] {
  const copy = synthesisCopy.ro
  return [
    copy.singleClear('calm'),
    copy.singleHighIntensity('calm'),
    copy.singleLowIntensity('calm'),
    copy.mixedValence(['calm', 'teamă']),
    copy.concordantPleasant(['calm', 'bucurie']),
    copy.concordantUnpleasant(['teamă', 'tristețe']),
    copy.concordantUnpleasantSevere(['teroare', 'disperare']),
    copy.complexityMultiple(3),
    copy.highIntensityGroup,
    copy.lowIntensityGroup,
    copy.needsClosing(['odihnă']),
    copy.needsClosingSevere(['sprijin']),
    ...Object.values(pleasantCombinationCopy).map((entry) => entry.ro),
  ]
}

function productRomanianCopy(): string[] {
  const modelMetadata = [wheelModel, dimensionalModel, plutchikModel, somaticModel]
    .flatMap((model) => [model.name.ro, model.shortName?.ro, model.description.ro])
    .filter((value): value is string => Boolean(value))
  const catalogCopy = Object.values(emotionCatalog)
    .flatMap((emotion) => [emotion.label.ro, emotion.description?.ro, emotion.needs?.ro])
    .filter((value): value is string => Boolean(value))
  const regionCopy = Object.values(somaticRegions).flatMap((region) => collectStrings({
    label: region.label.ro,
    description: region.description?.ro,
    needs: region.needs?.ro,
  }))
  const somaticDisplayCopy = [
    ...Object.values(SENSATION_CONFIG).map((sensation) => sensation.label.ro),
    ...Object.values(INTENSITY_LABELS).flatMap((intensity) => [intensity.ro, intensity.anchor.ro]),
  ]

  return [
    ...collectStrings(ro),
    ...generatedRomanianCopy(),
    ...catalogCopy,
    ...regionCopy,
    ...somaticDisplayCopy,
    ...modelMetadata,
  ]
}

describe('Romanian copy quality', () => {
  it('uses informal singular address throughout the product voice', () => {
    for (const value of [...collectStrings(ro), ...generatedRomanianCopy()]) {
      expect(value, value).not.toMatch(FORMAL_SECOND_PERSON)
    }
  })

  it('keeps the reviewed emotion labels exact', () => {
    for (const [id, expected] of Object.entries(REVIEWED_ROMANIAN_LABELS)) {
      expect(emotionCatalog[id]?.label.ro, id).toBe(expected)
    }
  })

  it('rejects confirmed Romanian misspellings across product copy', () => {
    for (const value of productRomanianCopy()) {
      expect(value, value).not.toMatch(CONFIRMED_MISSPELLINGS)
    }
  })

  it('keeps visible model metadata and body-region labels exact', () => {
    expect(wheelModel.name.ro).toBe('Roata emoțiilor')
    expect(wheelModel.description.ro).toBe(
      'Navigare ierarhică pe 3 niveluri (bazată pe Parrott, 2001) — de la emoții generale la specifice prin explorare în profunzime',
    )
    expect(dimensionalModel.name.ro).toBe('Spațiul emoțional')
    expect(dimensionalModel.shortName?.ro).toBe('Spațiu')
    expect(dimensionalModel.description.ro).toBe(
      'Câmp bidimensional (bazat pe Russell, 1980) — plasează-ți experiența pe axele plăcut/neplăcut și calm/intens',
    )
    expect(plutchikModel.name.ro).toBe('Roata emoțiilor Plutchik')
    expect(plutchikModel.description.ro).toBe(
      '8 emoții primare care se combină în diade (bazat pe Plutchik, 1980) — selectează două emoții primare pentru a descoperi combinația lor',
    )
    expect(somaticModel.name.ro).toBe('Harta corporală')
    expect(somaticRegions.arms.label.ro).toBe('Brațe')
  })

  it('stores Romanian source strings in NFC form', () => {
    for (const value of productRomanianCopy()) {
      expect(value, value).toBe(value.normalize('NFC'))
    }
  })
})
