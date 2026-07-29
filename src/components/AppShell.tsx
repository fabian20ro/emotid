import { useEffect, useRef, type ReactNode } from 'react'
import { BookOpen, Compass, Settings, SunMedium } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import type { AppTab } from '../navigation/types'

interface AppShellProps {
  activeTab: AppTab | null
  children: ReactNode
  isOffline: boolean
  showTabs?: boolean
  screenKey: string
  isBlocked?: boolean
  showSettings?: boolean
  onTabChange: (tab: AppTab) => void
  onOpenSettings: () => void
}

export function AppShell({
  activeTab,
  children,
  isOffline,
  isBlocked = false,
  showTabs = true,
  showSettings = true,
  screenKey,
  onTabChange,
  onOpenSettings,
}: AppShellProps) {
  const { section } = useLanguage()
  const contentRef = useRef<HTMLElement>(null)
  const navT = section('navigation')

  const tabs: Array<{ id: AppTab; label: string; Icon: typeof SunMedium }> = [
    { id: 'today', label: navT.today, Icon: SunMedium },
    { id: 'explore', label: navT.explore, Icon: Compass },
    { id: 'journal', label: navT.journal, Icon: BookOpen },
  ]

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 })
    contentRef.current?.querySelector<HTMLElement>('#screen-title')?.focus({ preventScroll: true })
  }, [screenKey])

  return (
    <div className="app-shell" aria-hidden={isBlocked || undefined} inert={isBlocked || undefined}>
      <header className="app-header">
        <div>
          <strong className="app-wordmark">Emot-ID</strong>
          <span className="app-kicker">{navT.private}</span>
        </div>
        {showSettings && (
          <button
            type="button"
            className="icon-button"
            onClick={onOpenSettings}
            aria-label={navT.settings}
            title={navT.settings}
          >
            <Settings size={21} aria-hidden="true" />
          </button>
        )}
      </header>

      {isOffline && <div className="offline-strip" role="status">{navT.offline}</div>}

      <main ref={contentRef} className="app-content" aria-labelledby="screen-title">{children}</main>

      {showTabs && (
        <nav className="bottom-nav" aria-label={navT.mainNavigation}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={activeTab === id ? 'bottom-nav-item is-active' : 'bottom-nav-item'}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => onTabChange(id)}
            >
              <Icon size={21} strokeWidth={activeTab === id ? 2.3 : 1.8} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
