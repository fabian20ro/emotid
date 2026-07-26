import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from './context/LanguageContext'
import './index.css'
import App from './App.tsx'

document.documentElement.dataset.appVersion = import.meta.env.VITE_APP_VERSION ?? 'current'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
