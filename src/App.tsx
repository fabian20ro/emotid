import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { AppShell } from './components/AppShell'
import { StorageBoundary } from './components/StorageBoundary'
import { Onboarding } from './components/Onboarding'
import { LazyRouteBoundary } from './components/LazyRouteBoundary'
import { TodayScreen } from './screens/TodayScreen'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useSessionHistory } from './hooks/useSessionHistory'
import { useHistoryPage } from './hooks/useHistoryPage'
import { useChainAnalysis } from './hooks/useChainAnalysis'
import { useChainDraft } from './hooks/useChainDraft'
import { useLanguage } from './context/LanguageContext'
import { storage } from './data/storage'
import { exportStoredUserDataJSON } from './data/user-data'
import type { AnalysisResult, BaseEmotion } from './models/types'
import type { CheckInRoute, AppTab } from './navigation/types'
import { preloadCheckInFeature } from './features/check-in/registry'
import { useCheckInWorkflow } from './features/check-in/workflow/useCheckInWorkflow'
import { CheckInDraftContext } from './features/check-in/workflow/draft'

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
  return <StorageBoundary><AppContent /></StorageBoundary>
}

function AppContent() {
  const { setLanguage } = useLanguage()
  const navigation = useAppNavigation()
  const [onboardingMode, setOnboardingMode] = useState<'initial' | 'replay' | null>(() => storage.get('onboarded') !== 'true' ? 'initial' : null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const onboardingReturnFocusRef = useRef<HTMLElement | null>(null)

  const { sessions: storedSessions, loading: sessionsLoading, error: sessionsError, save: saveSession, remove: removeSession, clearAll: clearAllSessions } = useSessionHistory()
  const journalPagination = useHistoryPage(storedSessions.length)
  const { entries: chainEntries, loading: chainLoading, error: chainError, save: saveChainEntry, clearAll: clearAllChains, remove: removeChainEntry } = useChainAnalysis()
  const chainDraft = useChainDraft(saveChainEntry)
  const [saveSessions, setSaveSessions] = useState(() => storage.get('saveSessions') !== 'false')
  const [allowExternalAI, setAllowExternalAI] = useState(() => storage.get('allowExternalAI') !== 'false')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.get('theme') === 'dark' ? 'dark' : 'light')

  const showReflection = useCallback((sessionId: string) => {
    navigation.navigate({ name: 'reflection', sessionId })
  }, [navigation])

  const returnToday = useCallback(() => {
    navigation.reset({ name: 'today' })
  }, [navigation])

  const {
    state: checkInState,
    draft: checkInDraft,
    currentSession,
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

  const sessions = useMemo(() => storedSessions.map((session) => (
    saveSessions && currentSession?.id === session.id ? currentSession : session
  )), [currentSession, saveSessions, storedSessions])

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
    completeCheckIn('quick', 'quick-check-in', [selection], [result], 'new')
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
      const results = await Promise.allSettled([clearAllSessions(), clearAllChains()])
      chainDraft.reset()
      const failures = results.filter((result) => result.status === 'rejected')
      if (failures.length) throw new AggregateError(failures.map((result) => result.reason), 'Local data was not fully deleted')
    })
    storage.resetPreferences()
    setLanguage(navigator.language.startsWith('ro') ? 'ro' : 'en')
    setSaving(true)
    setExternalAI(true)
    setTheme('light')
  }, [chainDraft, clearAllChains, clearAllSessions, runExclusiveReset, setExternalAI, setLanguage, setSaving])

  const deleteJournalSession = useCallback(async (sessionId: string) => {
    await removeSession(sessionId)
    navigation.replace({ name: 'journal' })
  }, [navigation, removeSession])

  const destination = navigation.destination
  const staleReflection = destination.name === 'reflection' && (!completion || destination.sessionId !== currentSession?.id)
  useEffect(() => {
    if (staleReflection) navigation.replace({ name: 'today' })
  }, [navigation, staleReflection])
  const activeTab: AppTab | null = destination.name === 'today' || destination.name === 'explore' || destination.name === 'journal' ? destination.name : null
  const showTabs = destination.name === 'today' || destination.name === 'explore' || destination.name === 'journal' || destination.name === 'arrival'

  const content = useMemo(() => {
    switch (destination.name) {
      case 'today':
        return <TodayScreen sessions={sessions} sessionsLoading={sessionsLoading} sessionsError={sessionsError} saveSessions={saveSessions} onPlaceFeeling={() => startRoute('affect')} onHelpChoose={() => navigation.navigate({ name: 'arrival' })} onQuickComplete={completeQuick} onOpenJournal={() => navigation.reset({ name: 'journal' })} />
      case 'arrival':
      case 'check-in':
      case 'reflection':
        if (staleReflection) {
          return <TodayScreen sessions={sessions} sessionsLoading={sessionsLoading} sessionsError={sessionsError} saveSessions={saveSessions} onPlaceFeeling={() => startRoute('affect')} onHelpChoose={() => navigation.navigate({ name: 'arrival' })} onQuickComplete={completeQuick} onOpenJournal={() => navigation.reset({ name: 'journal' })} />
        }
        return (
          <LazyRouteBoundary>
            <CheckInFlowHost destination={destination} completion={completion} allowExternalAI={allowExternalAI} saveState={sessionSaveState} sessionCaptured={sessionCaptured} onBack={navigation.back} onReflectionViewChange={(view) => { if (destination.name === 'reflection') navigation.navigate({ ...destination, view }) }} onGuideStepChange={(guideStep) => navigation.replace({ name: 'arrival', guideStep })} onChoose={startRoute} onComplete={completeCheckIn} onRetryBaseSave={retryBaseSave} onSaveReflection={saveReflection} onFinish={finishCheckIn} />
          </LazyRouteBoundary>
        )
      case 'explore':
        return <LazyRouteBoundary><ExploreScreen onChoose={startRoute} onPractice={() => navigation.navigate({ name: 'granularity' })} /></LazyRouteBoundary>
      case 'journal':
        return <LazyRouteBoundary><JournalScreen pagination={journalPagination} sessions={sessions} loading={sessionsLoading} chainEntries={chainEntries} chainLoading={chainLoading} chainError={chainError} error={sessionsError} saveSessions={saveSessions} onOpenSession={(sessionId) => navigation.navigate({ name: 'session', sessionId })} onOpenChain={(view) => {
          if (!view && chainDraft.status === 'saved') chainDraft.reset()
          navigation.navigate({ name: 'chain', view })
        }} /></LazyRouteBoundary>
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
        return <LazyRouteBoundary><ChainAnalysis isOpen initialView={destination.view} onClose={navigation.back} entries={chainEntries} loading={chainLoading} draft={chainDraft} onClearAll={() => chainDraft.clearSaved(clearAllChains)} onDelete={removeChainEntry} /></LazyRouteBoundary>
      default:
        return null
    }
  }, [allowExternalAI, chainDraft, chainEntries, chainError, chainLoading, clearAllChains, clearData, completeCheckIn, completeQuick, completion, deleteJournalSession, destination, exportData, finishCheckIn, journalPagination, navigation, retryBaseSave, saveReflection, saveSessions, sessionCaptured, sessionSaveState, sessions, sessionsError, sessionsLoading, setExternalAI, setSaving, startRoute, theme, removeChainEntry, staleReflection])

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
        <CheckInDraftContext.Provider value={checkInDraft}>{content}</CheckInDraftContext.Provider>
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
