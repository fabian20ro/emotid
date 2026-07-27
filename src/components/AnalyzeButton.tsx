import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { MODEL_IDS } from '../models/constants'

interface AnalyzeButtonProps {
  disabled: boolean
  onClick: () => void
  modelId: string
  selectionCount?: number
  /** When true, model is loaded and ready to analyze. Defaults to true when omitted. */
  modelReady?: boolean
}

export function AnalyzeButton({ disabled, onClick, modelId, selectionCount = 0, modelReady = true }: AnalyzeButtonProps) {
  const { t } = useLanguage()

  // While a new model is loading, show neutral feedback — users should not see static guidance text here.
  // Pulse animation signals activity so the user does not wonder if something happened.
  // A static spinner provides redundant encoding for users with reduced-motion preferences.
  const LOADING_SPINNER = (
    <svg className="inline-block w-5 h-5 mr-2 -ml-0.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.75"/>
    </svg>
  )

  if (!modelReady) {
    return (
      <motion.button
        type="button"
        disabled={!modelReady || disabled}
        aria-label="Analyzing..."
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-full py-2.5 px-6 rounded-xl font-semibold text-base shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white cursor-not-allowed">
        {LOADING_SPINNER}Analyzing...
      </motion.button>
    )
  }

  const disabledText = modelId === MODEL_IDS.SOMATIC
    ? t.analyze.buttonDisabledSomatic
    : modelId === MODEL_IDS.DIMENSIONAL
      ? t.analyze.buttonDisabledDimensional ?? t.analyze.buttonDisabledDefault
      : t.analyze.buttonDisabledDefault

  const label = selectionCount > 0
    ? `${t.analyze.button} (${selectionCount})`
    : t.analyze.button

  // Show selection count alongside the hint so users know what they've picked while waiting
  let displayText: string | null = disabled ? disabledText ?? null : null
  if (displayText && selectionCount > 0) {
    displayText = `${displayText}\n(${selectionCount} selected)`
  }

  const ariaLabel = !disabled && selectionCount > 0
    ? `${t.analyze.button} (${selectionCount})`
    : undefined

  const buttonClasses = disabled
    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none'

  return (
    <motion.button
      type="button"
      animate={disabled ? {} : { scale: [1, 1.03, 1] }}
      transition={disabled ? {} : { duration: 0.4, times: [0, 0.5, 1], repeat: 0 }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={!modelReady || disabled}
      aria-label={ariaLabel}
      className={`w-full py-2.5 px-6 rounded-xl font-semibold text-base shadow-lg transition-all ${buttonClasses}`}>
      {disabled ? displayText : label}
    </motion.button>
  )
}
