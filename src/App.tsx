import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { AppShell } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { LazyRouteBoundary } from './components/LazyRouteBoundary'
import { TodayScreen } from './screens/TodayScreen'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useSessionHistory } from './hooks/useSessionHistory'
import { useChainAnalysis } from './hooks/useChainAnalysis'
import { useLanguage } from './context/LanguageContext'
import { storage } from './data/storage'
import { exportStoredUserDataJSON } from './data/user-data'
import type { AnalysisResult, BaseEmotion } from './models/types'
import type { CheckInRoute, AppTab } from './navigation/types'
import { preloadCheckInFeature } from './features/check-in/registry'
import { useCheckInWorkflow } from './features/check-in/workflow/useCheckInWorkflow'

const CheckInFlowHost = lazy(async () => {
  const module = await import('./features/check-in/workflow/CheckInFlowHost')
  return { default: module.CheckInFlowHost }
})

const ExploreScreen = lazy(async () => {
  const module = await import('./screens/ExploreScreen')
  return { default: module.ExploreScreen }
})
const JournalScreen = lazy(async () => {
  const module = await import('./screens/JournalScreen')
  return { default: module.JournalScreen }
})
const SessionDetailScreen = lazy(async () => {
  const module = await import('./screens/SessionDetailScreen')
  return { default: module.SessionDetailScreen }
})
const SettingsScreen = lazy(async () => {
  const module = await import('./screens/SettingsScreen')
  return { default: module.SettingsScreen }
})
const PrivacyDataScreen = lazy(async () => {
  const module = await import('./screens/PrivacyDataScreen')
  return { default: module.PrivacyDataScreen }
})
const SupportScreen = lazy(async () => {
  const module = await import('./screens/SupportScreen')
  return { default: module.SupportScreen }
})
const GranularityTraining = lazy(async () => {
  const module = await import('./components/GranularityTraining')
  return { default: module.GranularityTraining }
})
const ChainAnalysis = lazy(async () => {
  const module = await import('./components/ChainAnalysis')
  return { default: module.ChainAnalysis }
})

export default function App() {
  const { setLanguage } = useLanguage()
  const navigation = useAppNavigation()
  const [onboardingMode, setOnboardingMode] = useState<'initial' | 'replay' | null>(() => storage.get('onboarded') !== 'true' ? 'initial' : null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const onboardingReturnFocusRef = useRef<HTMLElement | null>(null)

  const { sessions, loading: sessionsLoading, error: sessionsError, save: saveSession, remove: removeSession, clearAll: clearAllSessions } = useSessionHistory()
  const { entries: chainEntries, loading: chainLoading, error: chainError, save: saveChainEntry, clearAll: clearAllChains } = useChainAnalysis()
  const [saveSessions, setSaveSessions] = useState(() => storage.get('saveSessions') !== 'false')
  const [allowExternalAI, setAllowExternalAI] = useState(() => storage.get('allowExternalAI') !== 'false')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.get('theme') === 'dark' ? 'dark' : 'light')

  const showReflection = useCallback(() => {
    navigation.navigate({ name: 'reflection' })
  }, [navigation])

  const returnToday = useCallback(() => {
    navigation.reset({ name: 'today' })
  }, [navigation])

  const {
    state: checkInState,
    begin: beginCheckIn,
    complete: completeCheckIn,
    saveReflection,
    retryBaseSave,
    finish: finishCheckIn,
    runExclusiveReset,
  } = useCheckInWorkflow({
    saveSessions,
    saveSession,
    onShowReflection: showReflection,
    onReturnToday: returnToday,
  })

  const completion = checkInState.phase === 'reflecting'
    ? checkInState.completion
    : undefined
  const sessionSaveState = checkInState.phase === 'reflecting'
    ? checkInState.saveState
    : 'disabled'
  const sessionCaptured = checkInState.phase === 'reflecting'
    ? checkInState.sessionCaptured
    : false

  useEffect(() => {
    const online = () => setIsOffline(false)
    const offline = () => setIsOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    storage.set('theme', theme)
  }, [theme])

  const setSaving = useCallback((enabled: boolean) => {
    storage.set('saveSessions', String(enabled))
    setSaveSessions(enabled)
  }, [])

  const setExternalAI = useCallback((enabled: boolean) => {
    storage.set('allowExternalAI', String(enabled))
    setAllowExternalAI(enabled)
  }, [])

  const startRoute = useCallback((route: Exclude<CheckInRoute, 'quick'>) => {
    preloadCheckInFeature(route)
    beginCheckIn()
    navigation.navigate({ name: 'check-in', route })
  }, [beginCheckIn, navigation])

  const completeQuick = useCallback((
    selection: BaseEmotion,
    result: AnalysisResult,
  ) => {
    completeCheckIn('quick', 'quick-check-in', [selection], [result])
  }, [completeCheckIn])

  const exportData = useCallback(async () => {
    const json = await exportStoredUserDataJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'emot-id-data.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }, [])

  const clearData = useCallback(async () => {
    await runExclusiveReset(async () => {
      await Promise.all([clearAllSessions(), clearAllChains()])
    })
    storage.resetPreferences()
    setLanguage(navigator.language.startsWith('ro') ? 'ro' : 'en')
    setSaving(true)
    setExternalAI(true)
    setTheme('light')
  }, [clearAllChains, clearAllSessions, runExclusiveReset, setExternalAI, setLanguage, setSaving])

  const deleteJournalSession = useCallback(async (sessionId: string) => {
    await removeSession(sessionId)
    navigation.replace({ name: 'journal' })
  }, [navigation, removeSession])

  const destination = navigation.destination
  const activeTab: AppTab | null = destination.name === 'today' || destination.name === 'explore' || destination.name === 'journal' ? destination.name : null
  const showTabs = destination.name === 'today' || destination.name === 'explore' || destination.name === 'journal' || destination.name === 'arrival'

  const content = useMemo(() => {
    switch (destination.name) {
      case 'today':
        return <TodayScreen sessions={sessions} saveSessions={saveSessions} onPlaceFeeling={() => startRoute('affect')} onHelpChoose={() => navigation.navigate({ name: 'arrival' })} onQuickComplete={completeQuick} onOpenJournal={() => navigation.reset({ name: 'journal' })} />
      case 'arrival':
      case 'check-in':
      case 'reflection':
        if (destination.name === 'reflection' && !completion) {
          return <TodayScreen sessions={sessions} saveSessions={saveSessions} onPlaceFeeling={() => startRoute('affect')} onHelpChoose={() => navigation.navigate({ name: 'arrival' })} onQuickComplete={completeQuick} onOpenJournal={() => navigation.reset({ name: 'journal' })} />
        }
        return (
          <LazyRouteBoundary>
            <CheckInFlowHost destination={destination} completion={completion} allowExternalAI={allowExternalAI} saveState={sessionSaveState} sessionCaptured={sessionCaptured} onBack={navigation.back} onChoose={startRoute} onComplete={completeCheckIn} onRetryBaseSave={retryBaseSave} onSaveReflection={saveReflection} onFinish={finishCheckIn} />
          </LazyRouteBoundary>
        )
      case 'explore':
        return <LazyRouteBoundary><ExploreScreen onChoose={startRoute} onPractice={() => navigation.navigate({ name: 'granularity' })} /></LazyRouteBoundary>
      case 'journal':
        return <LazyRouteBoundary><JournalScreen sessions={sessions} loading={sessionsLoading} chainEntries={chainEntries} chainLoading={chainLoading} chainError={chainError} error={sessionsError} saveSessions={saveSessions} onOpenSession={(sessionId) => navigation.navigate({ name: 'session', sessionId })} onOpenChain={() => navigation.navigate({ name: 'chain' })} /></LazyRouteBoundary>
      case 'session':
        return <LazyRouteBoundary><SessionDetailScreen session={sessions.find((session) => session.id === destination.sessionId)} onBack={navigation.back} onDelete={deleteJournalSession} /></LazyRouteBoundary>
      case 'settings':
        return (
          <LazyRouteBoundary>
            <SettingsScreen theme={theme} onBack={navigation.back} onThemeChange={setTheme} onOpenPrivacy={() => navigation.navigate({ name: 'privacy' })} onOpenSupport={() => navigation.navigate({ name: 'support' })} onReplayIntroduction={(trigger) => {
              onboardingReturnFocusRef.current = trigger
              setOnboardingMode('replay')
            }} />
          </LazyRouteBoundary>
        )
      case 'privacy':
        return <LazyRouteBoundary><PrivacyDataScreen saveSessions={saveSessions} allowExternalAI={allowExternalAI} onBack={navigation.back} onSaveSessionsChange={setSaving} onExternalAIChange={setExternalAI} onExport={exportData} onClear={clearData} /></LazyRouteBoundary>
      case 'support':
        return <LazyRouteBoundary><SupportScreen onBack={navigation.back} /></LazyRouteBoundary>
      case 'granularity':
        return <LazyRouteBoundary><GranularityTraining isOpen onClose={navigation.back} /></LazyRouteBoundary>
      case 'chain':
        return <LazyRouteBoundary><ChainAnalysis isOpen onClose={navigation.back} entries={chainEntries} loading={chainLoading} onSave={saveChainEntry} onClearAll={clearAllChains} /></LazyRouteBoundary>
      default:
        return null
    }
  }, [allowExternalAI, chainEntries, chainError, chainLoading, clearAllChains, clearData, completeCheckIn, completeQuick, completion, deleteJournalSession, destination, exportData, finishCheckIn, navigation, retryBaseSave, saveChainEntry, saveReflection, saveSessions, sessionCaptured, sessionSaveState, sessions, sessionsError, sessionsLoading, setExternalAI, setSaving, startRoute, theme])

  if (onboardingMode === 'initial') {
    return (
      <MotionConfig reducedMotion="user">
        <Onboarding
          mode="initial"
          onComplete={() => setOnboardingMode(null)}
          saveSessions={saveSessions}
          onSaveSessionsChange={setSaving}
        />
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <AppShell
        activeTab={activeTab}
        isOffline={isOffline}
        isBlocked={onboardingMode === 'replay'}
        showTabs={showTabs}
        showSettings={destination.name !== 'check-in' && destination.name !== 'reflection'}
        screenKey={`${destination.name}:${destination.name === 'check-in' ? destination.route : destination.name === 'session' ? destination.sessionId : ''}`}
        onTabChange={(tab) => navigation.reset({ name: tab })}
        onOpenSettings={() => navigation.navigate({ name: 'settings' })}
      >
        {content}
      </AppShell>
      {onboardingMode === 'replay' && (
        <Onboarding
          mode="replay"
          onComplete={() => setOnboardingMode(null)}
          saveSessions={saveSessions}
          onSaveSessionsChange={setSaving}
          onClose={() => setOnboardingMode(null)}
          returnFocusRef={onboardingReturnFocusRef}
        />
      )}
    </MotionConfig>
  )
}
