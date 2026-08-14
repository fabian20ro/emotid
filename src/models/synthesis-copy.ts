export type SynthesisLanguage = 'ro' | 'en'

export interface SynthesisCopy {
  singleClear: (name: string) => string
  singleHighIntensity: (name: string) => string
  singleLowIntensity: (name: string) => string
  mixedValence: (names: string[]) => string
  concordantPleasant: (names: string[]) => string
  concordantUnpleasant: (names: string[]) => string
  concordantUnpleasantSevere: (names: string[]) => string
  complexityMultiple: (count: number) => string
  highIntensityGroup: string
  lowIntensityGroup: string
  needsClosing: (needs: string[]) => string
  needsClosingSevere: (needs: string[]) => string
}

function uniqueNeeds(needs: string[]): string[] {
  return [...new Set(needs)]
}

function formatEnglishList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

function formatRomanianList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} și ${items[1]}`
  return `${items.slice(0, -1).join(', ')} și ${items.at(-1)}`
}

export const synthesisCopy: Record<SynthesisLanguage, SynthesisCopy> = {
  en: {
    singleClear: (name) =>
      `${name} is the closest match among these suggestions. Notice whether that word fits your experience.`,
    singleHighIntensity: (name) =>
      `${name} sits near the high-energy end of this result. It may describe something that feels especially present right now.`,
    singleLowIntensity: (name) =>
      `${name} sits near the quieter end of this result. It may be subtle; keep the word only if it fits.`,
    mixedValence: (names) =>
      `${formatEnglishList(names)} appear together among the suggestions. Feelings can pull in different directions; keep only the words that fit.`,
    concordantPleasant: (names) =>
      `${formatEnglishList(names)} appear together as possible pleasant feelings. Notice whether this combination fits.`,
    concordantUnpleasant: (names) =>
      `${formatEnglishList(names)} appear together as possible difficult feelings. They may relate to something that matters to you, but only you can judge the context.`,
    concordantUnpleasantSevere: (names) =>
      `${formatEnglishList(names)} appear together among the suggestions and may describe a painful experience. Support is available if you want it.`,
    complexityMultiple: (count) =>
      `Several possibilities appeared: ${count} feelings in this result. You do not need to accept all of them.`,
    highIntensityGroup:
      'These suggestions sit toward the high-energy end of the model. This describes their placement, not their cause or severity.',
    lowIntensityGroup:
      'These suggestions sit toward the quieter end of the model. Subtle possibilities can still be useful if they fit.',
    needsClosing: (needs) => {
      const unique = uniqueNeeds(needs)
      if (unique.length === 0) return ''
      return `One possibility to consider is ${formatEnglishList(unique)}. Keep it only if it fits your situation.`
    },
    needsClosingSevere: (needs) => {
      const unique = uniqueNeeds(needs)
      if (unique.length === 0) return ''
      return `Support is available. You could also consider whether ${formatEnglishList(unique)} would help right now.`
    },
  },
  ro: {
    singleClear: (name) =>
      `${name} este cea mai apropiată potrivire dintre aceste sugestii. Observă dacă acest cuvânt se potrivește experienței tale.`,
    singleHighIntensity: (name) =>
      `${name} apare în zona cu energie ridicată a rezultatului. Poate descrie o trăire resimțită mai intens acum.`,
    singleLowIntensity: (name) =>
      `${name} apare în zona mai liniștită a rezultatului. Trăirea poate fi subtilă; păstrează cuvântul numai dacă se potrivește.`,
    mixedValence: (names) =>
      `${formatRomanianList(names)} apar împreună printre sugestii. Trăirile pot avea direcții diferite; păstrează doar cuvintele care se potrivesc.`,
    concordantPleasant: (names) =>
      `${formatRomanianList(names)} apar împreună ca posibile trăiri plăcute. Observă dacă această combinație se potrivește.`,
    concordantUnpleasant: (names) =>
      `${formatRomanianList(names)} apar împreună ca posibile trăiri dificile. Pot avea legătură cu ceva important pentru tine, dar numai tu poți aprecia contextul.`,
    concordantUnpleasantSevere: (names) =>
      `${formatRomanianList(names)} apar împreună printre sugestii și pot descrie o experiență dureroasă. Există sprijin dacă îl vrei.`,
    complexityMultiple: (count) =>
      `Au apărut mai multe posibilități: ${count} trăiri în acest rezultat. Nu este nevoie să le accepți pe toate.`,
    highIntensityGroup:
      'Aceste sugestii se află în zona cu energie ridicată a modelului. Poziția nu stabilește cauza sau gravitatea trăirii.',
    lowIntensityGroup:
      'Aceste sugestii se află în zona mai liniștită a modelului. Posibilitățile subtile pot fi utile dacă se potrivesc.',
    needsClosing: (needs) => {
      const unique = uniqueNeeds(needs)
      if (unique.length === 0) return ''
      return `O posibilitate de luat în considerare este ${formatRomanianList(unique)}. Păstreaz-o numai dacă se potrivește situației tale.`
    },
    needsClosingSevere: (needs) => {
      const unique = uniqueNeeds(needs)
      if (unique.length === 0) return ''
      return `Există sprijin. De asemenea, poți observa dacă ${formatRomanianList(unique)} te-ar ajuta acum.`
    },
  },
}

export const pleasantCombinationCopy: Record<string, Record<SynthesisLanguage, string>> = {
  'joy+gratitude': {
    en: 'Joy and gratitude appear together here. This combination can sometimes accompany appreciation or satisfaction; keep it only if it fits.',
    ro: 'Bucuria și recunoștința apar împreună aici. Această combinație poate însoți aprecierea sau mulțumirea; păstreaz-o numai dacă se potrivește.',
  },
  'love+trust': {
    en: 'Love and trust appear together here. This combination can sometimes accompany a sense of connection or safety; keep it only if it fits.',
    ro: 'Iubirea și încrederea apar împreună aici. Această combinație poate însoți un sentiment de apropiere sau siguranță; păstreaz-o numai dacă se potrivește.',
  },
  'joy+serenity': {
    en: 'Joy and serenity appear together here. This combination can sometimes accompany quiet contentment; keep it only if it fits.',
    ro: 'Bucuria și seninătatea apar împreună aici. Această combinație poate însoți o mulțumire liniștită; păstreaz-o numai dacă se potrivește.',
  },
  'gratitude+serenity': {
    en: 'Gratitude and serenity appear together here. This combination can sometimes accompany peaceful appreciation; keep it only if it fits.',
    ro: 'Recunoștința și seninătatea apar împreună aici. Această combinație poate însoți o apreciere liniștită; păstreaz-o numai dacă se potrivește.',
  },
}
