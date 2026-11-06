import { lazy, useState, useSyncExternalStore, type ReactNode } from 'react'
import { LifeBuoy, RotateCcw } from 'lucide-react'
import { getStorageInvalidation, subscribeStorageInvalidation } from '../data/storage-lifecycle'
import { useLanguage } from '../context/LanguageContext'
import { LazyRouteBoundary } from './LazyRouteBoundary'
import { AppShell } from './AppShell'

const SupportScreen = lazy(() => import('../screens/SupportScreen').then((module) => ({ default: module.SupportScreen })))

export function StorageBoundary({ children }: { children: ReactNode }) {
  const reason = useSyncExternalStore(subscribeStorageInvalidation, getStorageInvalidation)
  const { section } = useLanguage()
  const t = section('storageRecovery')
  const [support, setSupport] = useState(false)
  if (!reason) return children
  return (
    <AppShell
      activeTab={null}
      isOffline={!navigator.onLine}
      showTabs={false}
      showSettings={false}
      screenKey={`storage-${reason}-${support}`}
      onTabChange={() => {}}
      onOpenSettings={() => {}}
    >
      {support ? <LazyRouteBoundary><SupportScreen onBack={() => setSupport(false)} /></LazyRouteBoundary> : (
        <div className="screen route-load-state" data-testid="storage-invalidated">
          <h1 id="screen-title" className="screen-title" tabIndex={-1}>{reason === 'upgrade' ? t.upgradeTitle : t.title}</h1>
          <p>{reason === 'upgrade' ? t.upgradeBody : t.body}</p>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}><RotateCcw size={18} aria-hidden="true" />{t.reload}</button>
          <button className="secondary-button mt-3" type="button" onClick={() => setSupport(true)}><LifeBuoy size={18} aria-hidden="true" />{section('settingsScreen').support}</button>
        </div>
      )}
    </AppShell>
  )
}
