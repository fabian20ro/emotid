import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getInitialLanguage, LanguageProvider, setDocumentLanguage } from './context/LanguageContext'
import './index.css'
import App from './App.tsx'

const initialLanguage = getInitialLanguage()
setDocumentLanguage(initialLanguage)
document.documentElement.dataset.appVersion = import.meta.env.VITE_APP_VERSION ?? 'current'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider initialLanguage={initialLanguage}>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
