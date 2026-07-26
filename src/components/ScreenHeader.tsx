import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface ScreenHeaderProps {
  eyebrow?: string
  title: string
  lede?: string
  onBack?: () => void
}

export function ScreenHeader({ eyebrow, title, lede, onBack }: ScreenHeaderProps) {
  const { section } = useLanguage()
  const navT = section('navigation')

  return (
    <>
      {onBack && (
        <button type="button" className="screen-back" onClick={onBack}>
          <ArrowLeft size={19} aria-hidden="true" />
          {navT.back}
        </button>
      )}
      {eyebrow && <p className="screen-eyebrow">{eyebrow}</p>}
      <h1 id="screen-title" className="screen-title" tabIndex={-1}>{title}</h1>
      {lede && <p className="screen-lede">{lede}</p>}
    </>
  )
}
