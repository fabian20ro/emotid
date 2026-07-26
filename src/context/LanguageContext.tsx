import { createContext, useState, useEffect, useContext, type ReactNode } from 'react'
import roStrings from '../i18n/ro.json'
import enStrings from '../i18n/en.json'
import { storage } from '../data/storage'

type Language = 'ro' | 'en'

type Strings = typeof roStrings

/** Type-safe section accessor — returns the flat string record for a given i18n section */
type StringSection = keyof Strings

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  simpleLanguage: boolean
  setSimpleLanguage: (enabled: boolean) => void
  t: Strings
  /** Type-safe section accessor: `section('today')` returns `Strings['today']` */
  section: <K extends StringSection>(key: K) => Strings[K]
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const strings: Record<Language, Strings> = {
  ro: roStrings,
  en: enStrings,
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = storage.get('language')
      if (saved === 'ro' || saved === 'en') return saved
      const browserLang = navigator.language
      if (browserLang.startsWith('ro')) return 'ro'
    }
    return 'en'
  })
  const [simpleLanguage, setSimpleLanguage] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return storage.get('simpleLanguage') === 'true'
    }
    return false
  })

  useEffect(() => {
    storage.set('language', language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    storage.set('simpleLanguage', String(simpleLanguage))
  }, [simpleLanguage])

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      simpleLanguage,
      setSimpleLanguage,
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
