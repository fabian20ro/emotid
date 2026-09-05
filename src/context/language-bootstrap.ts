import { storage } from '../data/storage'

export type Language = 'ro' | 'en'

export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const saved = storage.get('language')
  if (saved === 'ro' || saved === 'en') return saved
  return navigator.language.startsWith('ro') ? 'ro' : 'en'
}

export function setDocumentLanguage(language: Language) {
  document.documentElement.lang = language
}
