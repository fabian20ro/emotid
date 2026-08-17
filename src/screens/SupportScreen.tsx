import { ExternalLink, Phone } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { CRISIS_RESOURCES } from '../models/crisis-resources'

export function SupportScreen({ onBack }: { onBack: () => void }) {
  const { section } = useLanguage()
  const t = section('supportScreen')
  return (
    <div className="screen" data-testid="support-screen">
      <ScreenHeader title={t.title} lede={t.lede} onBack={onBack} />
      <div className="support-urgent" role="note">{t.urgent}</div>
      <a className="support-link" href={CRISIS_RESOURCES.romania.href}><Phone size={20} aria-hidden="true" /><span>{t.romania}</span></a>
      <a className="support-link" href={CRISIS_RESOURCES.international.href} target="_blank" rel="noopener noreferrer"><ExternalLink size={20} aria-hidden="true" /><span>{t.international}</span></a>
      <button type="button" className="primary-button mt-6" onClick={onBack}>{t.continue}</button>
    </div>
  )
}
