import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { AppShell } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { GranularityTraining } from './components/GranularityTraining'
import { ChainAnalysis } from './components/ChainAnalysis'
import { TodayScreen } from './screens/TodayScreen'
import { ArrivalScreen } from './screens/ArrivalScreen'
import { ModelCheckInScreen } from './screens/ModelCheckInScreen'
import { BodyCompassScreen } from './screens/BodyCompassScreen'
import { WordLadderScreen } from './screens/WordLadderScreen'
import { ReflectionScreen } from './screens/ReflectionScreen'
import { ExploreScreen } from './screens/ExploreScreen'
import { JournalScreen } from './screens/JournalScreen'
import { SessionDetailScreen } from './screens/SessionDetailScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { PrivacyDataScreen } from './screens/PrivacyDataScreen'
import { SupportScreen } from './screens/SupportScreen'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useSessionHistory } from './hooks/useSessionHistory'
import { useChainAnalysis } from './hooks/useChainAnalysis'
import { useLanguage } from './context/LanguageContext'
import { storage } from './data/storage'
import { exportStoredUserDataJSON } from './data/user-data'
import { addReflectionDetail, createSession } from './data/session'
import { getCrisisTier } from './models/distress'
import { escalateCrisisTier, hasTemporalCrisisPattern } from './data/temporal-crisis'
import type { AnalysisResult, BaseEmotion } from './models/types'
import type { CheckInCompletion, CheckInRoute, AppTab, ReflectionDetail, ReflectionSaveOutcome, SessionSaveState } from './navigation/types'
import type { Session } from './data/types'

export default function App() {
  const { setLanguage } = useLanguage()
  const navigation = useAppNavigation()
  const [onboardingMode, setOnboardingMode] = useState<'initial' | 'replay' | null>(() => storage.get('onboarded') !== 'true' ? 'initial' : null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const [completion, setCompletion] = useState<CheckInCompletion | null>(null)
  const [sessionSaveState, setSessionSaveState] = useState<SessionSaveState>('disabled')
  const [sessionCaptured, setSessionCaptured] = useState(false)
  const activeSessionRef = useRef<Session | null>(null)
  const sessionWriteRef = useRef<Promise<void>>(Promise.resolve())
  const latestWriteRef = useRef<Promise<void> | null>(null)
  const latestBaseWriteRef = useRef<Promise<void> | null>(null)
  const completionInFlightRef = useRef(false)

  const { sessions, loading: sessionsLoading, error: sessionsError, save: saveSession, clearAll: clearAllSessions } = useSessionHistory()
  const { entries: chainEntries, loading: chainLoading, save: saveChainEntry, clearAll: clearAllChains } = useChainAnalysis()
  const [saveSessions, setSaveSessions] = useState(() => storage.get('saveSessions') !== 'false')
  const [allowExternalAI, setAllowExternalAI] = useState(() => storage.get('allowExternalAI') !== 'false')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.get('theme') === 'dark' ? 'dark' : 'light')

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
    setCompletion(null)
    activeSessionRef.current = null
    latestWriteRef.current = null
    latestBaseWriteRef.current = null
    setSessionCaptured(false)
    setSessionSaveState(saveSessions ? 'saved' : 'disabled')
    navigation.navigate({ name: 'check-in', route })
  }, [navigation, saveSessions])

  const queueSessionSave = useCallback((session: Session) => {
    const write = sessionWriteRef.current
      .catch(() => undefined)
      .then(() => saveSession(session))
    sessionWriteRef.current = write
    latestWriteRef.current = write
    return write
  }, [saveSession])

  const persistBaseSession = useCallback((session: Session) => {
    if (!saveSessions) {
      setSessionCaptured(false)
      setSessionSaveState('disabled')
      return
    }
    setSessionSaveState('saving')
    const write = queueSessionSave(session)
    latestBaseWriteRef.current = write
    void write.then(
      () => {
        if (latestBaseWriteRef.current !== write) return
        setSessionCaptured(true)
        if (latestWriteRef.current === write) setSessionSaveState('saved')
      },
      () => {
        if (latestBaseWriteRef.current === write) setSessionSaveState('error')
      },
    )
  }, [queueSessionSave, saveSessions])

  const complete = useCallback((route: CheckInRoute, modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => {
    if (selections.length === 0 || results.length === 0 || completionInFlightRef.current) return
    completionInFlightRef.current = true
    const baseTier = getCrisisTier(results.map((result) => result.id))
    const crisisTier = escalateCrisisTier(baseTier, sessions)
    const nextCompletion = {
      route,
      modelId,
      selections,
      results,
      crisisTier,
      temporalEscalation: hasTemporalCrisisPattern(sessions) && crisisTier !== baseTier,
    }
    const existing = activeSessionRef.current
    const session = createSession(nextCompletion, existing
      ? { id: existing.id, timestamp: existing.timestamp }
      : undefined)
    activeSessionRef.current = session
    setSessionCaptured(false)
    setCompletion(nextCompletion)
    persistBaseSession(session)
    navigation.navigate({ name: 'reflection' })
    window.setTimeout(() => {
      completionInFlightRef.current = false
    }, 0)
  }, [navigation, persistBaseSession, sessions])

  const completeQuick = useCallback((selection: BaseEmotion, result: AnalysisResult) => {
    complete('quick', 'quick-check-in', [selection], [result])
  }, [complete])

  const saveReflection = useCallback(async (detail: ReflectionDetail): Promise<ReflectionSaveOutcome> => {
    const session = activeSessionRef.current
    if (!session || !saveSessions) return 'not-saved'
    const updated = addReflectionDetail(session, detail)
    const write = queueSessionSave(updated)
    await write
    activeSessionRef.current = updated
    setSessionCaptured(true)
    if (latestWriteRef.current === write) setSessionSaveState('saved')
    return 'saved'
  }, [queueSessionSave, saveSessions])

  const retryBaseSave = useCallback(() => {
    if (activeSessionRef.current) persistBaseSession(activeSessionRef.current)
  }, [persistBaseSession])

  const returnToday = useCallback(() => {
    setCompletion(null)
    activeSessionRef.current = null
    latestWriteRef.current = null
    latestBaseWriteRef.current = null
    setSessionCaptured(false)
    setSessionSaveState(saveSessions ? 'saved' : 'disabled')
    navigation.reset({ name: 'today' })
  }, [navigation, saveSessions])

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
    await Promise.all([clearAllSessions(), clearAllChains()])
    storage.resetPreferences()
    setLanguage(navigator.language.startsWith('ro') ? 'ro' : 'en')
    setSaving(true)
    setExternalAI(true)
    setTheme('light')
  }, [clearAllChains, clearAllSessions, setExternalAI, setLanguage, setSaving])

  const destination = navigation.destination
  const activeTab: AppTab | null = destination.name === 'today' || destination.name === 'explore' || destination.name === 'journal' ? destination.name : null
  const showTabs = destination.name === 'today' || destination.name === 'explore' || destination.name === 'journal' || destination.name === 'arrival'

  const content = useMemo(() => {
    switch (destination.name) {
      case 'today':
        return <TodayScreen sessions={sessions} saveSessions={saveSessions} onStart={() => navigation.navigate({ name: 'arrival' })} onQuickComplete={completeQuick} onOpenJournal={() => navigation.reset({ name: 'journal' })} />
      case 'arrival':
        return <ArrivalScreen onBack={navigation.back} onChoose={startRoute} />
      case 'check-in':
        return destination.route === 'body'
          ? <BodyCompassScreen onBack={navigation.back} onComplete={(modelId, selections, results) => complete('body', modelId, selections, results)} />
          : destination.route === 'words'
            ? <WordLadderScreen onBack={navigation.back} onComplete={(modelId, selections, results) => complete('words', modelId, selections, results)} />
          : <ModelCheckInScreen route={destination.route} onBack={navigation.back} onComplete={(modelId, selections, results) => complete(destination.route, modelId, selections, results)} />
      case 'reflection':
        return completion
          ? <ReflectionScreen completion={completion} allowExternalAI={allowExternalAI} saveState={sessionSaveState} sessionCaptured={sessionCaptured} onBack={navigation.back} onRetryBaseSave={retryBaseSave} onSave={saveReflection} onReturn={returnToday} />
          : <TodayScreen sessions={sessions} saveSessions={saveSessions} onStart={() => navigation.navigate({ name: 'arrival' })} onQuickComplete={completeQuick} onOpenJournal={() => navigation.reset({ name: 'journal' })} />
      case 'explore':
        return <ExploreScreen onChoose={startRoute} onPractice={() => navigation.navigate({ name: 'granularity' })} />
      case 'journal':
        return <JournalScreen sessions={sessions} loading={sessionsLoading} error={sessionsError} saveSessions={saveSessions} onOpenSession={(sessionId) => navigation.navigate({ name: 'session', sessionId })} onOpenChain={() => navigation.navigate({ name: 'chain' })} />
      case 'session':
        return <SessionDetailScreen session={sessions.find((session) => session.id === destination.sessionId)} onBack={navigation.back} />
      case 'settings':
        return <SettingsScreen theme={theme} onBack={navigation.back} onThemeChange={setTheme} onOpenPrivacy={() => navigation.navigate({ name: 'privacy' })} onOpenSupport={() => navigation.navigate({ name: 'support' })} onReplayIntroduction={() => setOnboardingMode('replay')} />
      case 'privacy':
        return <PrivacyDataScreen saveSessions={saveSessions} allowExternalAI={allowExternalAI} onBack={navigation.back} onSaveSessionsChange={setSaving} onExternalAIChange={setExternalAI} onExport={exportData} onClear={clearData} />
      case 'support':
        return <SupportScreen onBack={navigation.back} />
      case 'granularity':
        return <GranularityTraining isOpen onClose={navigation.back} />
      case 'chain':
        return <ChainAnalysis isOpen onClose={navigation.back} entries={chainEntries} loading={chainLoading} onSave={saveChainEntry} onClearAll={clearAllChains} />
      default:
        return null
    }
  }, [allowExternalAI, chainEntries, chainLoading, clearAllChains, clearData, complete, completeQuick, completion, destination, exportData, navigation, retryBaseSave, returnToday, saveChainEntry, saveReflection, saveSessions, sessionCaptured, sessionSaveState, sessions, sessionsError, sessionsLoading, setExternalAI, setSaving, startRoute, theme])

  if (onboardingMode) {
    return (
      <MotionConfig reducedMotion="user">
        <Onboarding mode={onboardingMode} onComplete={() => setOnboardingMode(null)} onClose={onboardingMode === 'replay' ? () => setOnboardingMode(null) : undefined} />
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <AppShell
        activeTab={activeTab}
        isOffline={isOffline}
        showTabs={showTabs}
        showSettings={destination.name !== 'check-in' && destination.name !== 'reflection'}
        screenKey={`${destination.name}:${destination.name === 'check-in' ? destination.route : destination.name === 'session' ? destination.sessionId : ''}`}
        onTabChange={(tab) => navigation.reset({ name: tab })}
        onOpenSettings={() => navigation.navigate({ name: 'settings' })}
      >
        {content}
      </AppShell>
    </MotionConfig>
  )
}
