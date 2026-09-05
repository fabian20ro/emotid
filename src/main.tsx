import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from './context/LanguageContext'
import { getInitialLanguage, setDocumentLanguage } from './context/language-bootstrap'
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
