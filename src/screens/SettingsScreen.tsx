import { ChevronRight, Languages, LifeBuoy, LockKeyhole, Moon, RotateCcw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'

interface SettingsScreenProps {
  theme: 'light' | 'dark'
  onBack: () => void
  onThemeChange: (theme: 'light' | 'dark') => void
  onOpenPrivacy: () => void
  onOpenSupport: () => void
  onReplayIntroduction: (trigger: HTMLButtonElement) => void
}

export function SettingsScreen({ theme, onBack, onThemeChange, onOpenPrivacy, onOpenSupport, onReplayIntroduction }: SettingsScreenProps) {
  const { language, setLanguage, section } = useLanguage()
  const t = section('settingsScreen')

  return (
    <div className="screen" data-testid="settings-screen">
      <ScreenHeader title={t.title} onBack={onBack} />
      <h2 className="section-heading">{t.preferences}</h2>
      <div className="settings-list">
        <div className="settings-row">
          <Languages size={20} aria-hidden="true" />
          <span id="settings-language-label">{t.language}</span>
          <div className="segmented" role="group" aria-labelledby="settings-language-label">
            <button type="button" aria-pressed={language === 'en'} className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')}>EN</button>
            <button type="button" aria-pressed={language === 'ro'} className={language === 'ro' ? 'is-active' : ''} onClick={() => setLanguage('ro')}>RO</button>
          </div>
        </div>
        <div className="settings-row">
          <Moon size={20} aria-hidden="true" />
          <span id="settings-theme-label">{t.theme}</span>
          <div className="segmented settings-theme-segmented" role="group" aria-labelledby="settings-theme-label">
            <button type="button" aria-pressed={theme === 'light'} className={theme === 'light' ? 'is-active' : ''} onClick={() => onThemeChange('light')}>{t.light}</button>
            <button type="button" aria-pressed={theme === 'dark'} className={theme === 'dark' ? 'is-active' : ''} onClick={() => onThemeChange('dark')}>{t.dark}</button>
          </div>
        </div>
      </div>

      <h2 className="section-heading">{section('privacyData').title}</h2>
      <div className="settings-list">
        <button type="button" className="settings-link" onClick={onOpenPrivacy}><LockKeyhole size={20} aria-hidden="true" /><span>{t.privacy}</span><ChevronRight size={18} aria-hidden="true" /></button>
      </div>

      <h2 className="section-heading">{t.help}</h2>
      <div className="settings-list">
        <button type="button" className="settings-link" onClick={(event) => onReplayIntroduction(event.currentTarget)}><RotateCcw size={20} aria-hidden="true" /><span>{t.replayIntroduction}</span><ChevronRight size={18} aria-hidden="true" /></button>
        <button type="button" className="settings-link" onClick={onOpenSupport}><LifeBuoy size={20} aria-hidden="true" /><span>{t.support}</span><ChevronRight size={18} aria-hidden="true" /></button>
      </div>
    </div>
  )
}
