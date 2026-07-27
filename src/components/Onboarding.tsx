import { useCallback, useState } from 'react'
import { ArrowLeft, ArrowRight, Compass, HeartHandshake, LockKeyhole } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { storage } from '../data/storage'

interface OnboardingProps {
  onComplete: (modelId: string | null) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { section, language, setLanguage } = useLanguage()
  const t = section('onboarding')
  const privacyT = section('privacyData')
  const [step, setStep] = useState(0)
  const focusTrapRef = useFocusTrap(true)

  const screens = [
    { title: t.screen1Title, body: t.screen1Body, Icon: Compass },
    { title: t.screen2Title, body: t.screen2Body, Icon: HeartHandshake },
    { title: privacyT.title, body: privacyT.lede, Icon: LockKeyhole },
  ]
  const isLast = step === screens.length - 1
  const current = screens[step]

  const finish = useCallback(() => {
    storage.set('onboarded', 'true')
    onComplete(null)
  }, [onComplete])

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div ref={focusTrapRef} className="onboarding-panel">
        <div className="onboarding-brand">Emot-ID</div>
        <div className="onboarding-progress" aria-label={`${step + 1}/${screens.length}`}>
          {screens.map((_, index) => <span key={index} data-step={index} className={index === step ? 'is-active' : ''} />)}
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="onboarding-copy">
          <span className="onboarding-icon"><current.Icon size={27} aria-hidden="true" /></span>
          <h1 id="onboarding-title">{current.title}</h1>
          <p>{current.body}</p>
          {isLast && (
            <div className="segmented onboarding-language" role="group" aria-label={section('settingsScreen').language}>
              <button type="button" aria-pressed={language === 'en'} className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')}>English</button>
              <button type="button" aria-pressed={language === 'ro'} className={language === 'ro' ? 'is-active' : ''} onClick={() => setLanguage('ro')}>Română</button>
            </div>
          )}
        </motion.div>

        <div className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="secondary-button" onClick={() => setStep((value) => value - 1)} aria-label={t.back ?? 'Back'}>
              <ArrowLeft size={18} aria-hidden="true" />{t.back ?? 'Back'}
            </button>
          ) : <span />}
          <button type="button" className="primary-button" onClick={() => isLast ? finish() : setStep((value) => value + 1)}>
            {isLast ? (t.getStarted ?? 'Get started') : (t.next ?? 'Next')}
            {!isLast && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  )
}
