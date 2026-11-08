import type { Language } from '../context/language-bootstrap'

export function countForm(count: number, language: Language, forms: { one: string; few: string; other: string }): string {
  const category = new Intl.PluralRules(language).select(count)
  return category === 'one' ? forms.one : category === 'few' ? forms.few : forms.other
}
