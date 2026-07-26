import { ExternalLink, Phone } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'

export function SupportScreen({ onBack }: { onBack: () => void }) {
  const { section } = useLanguage()
  const t = section('supportScreen')
  return (
    <div className="screen" data-testid="support-screen">
      <ScreenHeader title={t.title} lede={t.lede} onBack={onBack} />
      <div className="support-urgent" role="note">{t.urgent}</div>
      <a className="support-link" href="tel:+40374456420"><Phone size={20} aria-hidden="true" /><span>{t.romania}</span></a>
      <a className="support-link" href="https://findahelpline.com" target="_blank" rel="noopener noreferrer"><ExternalLink size={20} aria-hidden="true" /><span>{t.international}</span></a>
      <button type="button" className="primary-button mt-6" onClick={onBack}>{t.continue}</button>
    </div>
  )
}
