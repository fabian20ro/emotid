import { createContext, useState, useEffect, useContext, useCallback, type ReactNode } from 'react'
import roStrings from '../i18n/ro.json'
import enStrings from '../i18n/en.json'
import { storage } from '../data/storage'

export type Language = 'ro' | 'en'

type Strings = typeof roStrings

/** Type-safe section accessor — returns the flat string record for a given i18n section */
type StringSection = keyof Strings

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Strings
  /** Type-safe section accessor: `section('today')` returns `Strings['today']` */
  section: <K extends StringSection>(key: K) => Strings[K]
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const strings: Record<Language, Strings> = {
  ro: roStrings,
  en: enStrings,
}

export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const saved = storage.get('language')
  if (saved === 'ro' || saved === 'en') return saved
  return navigator.language.startsWith('ro') ? 'ro' : 'en'
}

export function setDocumentLanguage(language: Language) {
  document.documentElement.lang = language
}

export function LanguageProvider({
  children,
  initialLanguage = getInitialLanguage(),
}: {
  children: ReactNode
  initialLanguage?: Language
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  const setLanguage = useCallback((nextLanguage: Language) => {
    setDocumentLanguage(nextLanguage)
    setLanguageState(nextLanguage)
  }, [])

  useEffect(() => {
    storage.set('language', language)
    setDocumentLanguage(language)
  }, [language])

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t: strings[language],
      section: <K extends StringSection>(key: K) => strings[language][key],
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
