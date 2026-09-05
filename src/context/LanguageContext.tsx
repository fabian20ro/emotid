import { useState, useEffect, useCallback, type ReactNode } from 'react'
import roStrings from '../i18n/ro.json'
import enStrings from '../i18n/en.json'
import { storage } from '../data/storage'
import { getInitialLanguage, setDocumentLanguage, type Language } from './language-bootstrap'
import { LanguageContext, type Strings, type StringSection } from './language-context'

export type { Language } from './language-bootstrap'
export { useLanguage } from './language-context'

const strings: Record<Language, Strings> = {
  ro: roStrings,
  en: enStrings,
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
