import { createContext, useContext } from 'react'
import type roStrings from '../i18n/ro.json'
import type { Language } from './language-bootstrap'

export type Strings = typeof roStrings
export type StringSection = keyof Strings

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Strings
  section: <K extends StringSection>(key: K) => Strings[K]
}

export const LanguageContext = createContext<LanguageContextType | null>(null)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
