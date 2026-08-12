import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Compass, HeartHandshake, LockKeyhole, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { storage } from '../data/storage'
import { focusDestination } from '../utils/focusDestination'

interface OnboardingProps {
  mode?: 'initial' | 'replay'
  onComplete: () => void
  onClose?: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

export function Onboarding({ mode = 'initial', onComplete, onClose, returnFocusRef }: OnboardingProps) {
  const { section, language, setLanguage } = useLanguage()
  const t = section('onboarding')
  const privacyT = section('privacyData')
  const [step, setStep] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusTrapRef = useFocusTrap(
    true,
    mode === 'replay' ? onClose : undefined,
    headingRef,
    mode === 'replay' ? returnFocusRef : undefined,
  )

  const screens = [
    { title: t.screen1Title, body: t.screen1Body, Icon: Compass },
    { title: t.screen2Title, body: t.screen2Body, Icon: HeartHandshake },
    { title: privacyT.title, body: privacyT.lede, Icon: LockKeyhole },
  ]
  const isLast = step === screens.length - 1
  const current = screens[step]

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => focusDestination(headingRef.current))
    return () => window.cancelAnimationFrame(frame)
  }, [step])

  const finish = useCallback(() => {
    if (mode === 'initial') storage.set('onboarded', 'true')
    onComplete()
  }, [mode, onComplete])

  useEffect(() => {
    if (mode !== 'replay' || !onClose) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mode, onClose])

  const content = (
    <div
      className="onboarding"
      style={mode === 'replay' ? { position: 'fixed', inset: 0, zIndex: 'var(--z-onboarding)' } : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div ref={focusTrapRef} className="onboarding-panel">
        <div className="onboarding-header">
          <div className="onboarding-brand">Emot-ID</div>
          {mode === 'replay' && onClose && (
            <button type="button" className="icon-button" onClick={onClose} aria-label={t.close}>
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        <div
          className="onboarding-progress"
          role="progressbar"
          aria-label={t.progress}
          aria-valuemin={1}
          aria-valuemax={screens.length}
          aria-valuenow={step + 1}
        >
          {screens.map((_, index) => <span key={index} data-step={index} className={index === step ? 'is-active' : ''} />)}
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="onboarding-copy">
          <span className="onboarding-icon"><current.Icon size={27} aria-hidden="true" /></span>
          <h1 ref={headingRef} id="onboarding-title" tabIndex={-1}>{current.title}</h1>
          <p>{current.body}</p>
          {isLast && mode === 'initial' && (
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
            {isLast ? (mode === 'replay' ? t.done : t.getStarted) : t.next}
            {!isLast && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  )

  return mode === 'replay' && typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content
}
