import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { getCrisisTier } from './models/distress'
import { escalateCrisisTier, hasTemporalCrisisPattern } from './data/temporal-crisis'
import type { AnalysisResult, BaseEmotion } from './models/types'
import type { CheckInCompletion, CheckInRoute, AppTab, ReflectionDetail, ReflectionSaveOutcome } from './navigation/types'
import type { SerializedSelection, Session } from './data/types'

export default function App() {
  const { setLanguage } = useLanguage()
  const navigation = useAppNavigation()
  const [showOnboarding, setShowOnboarding] = useState(() => storage.get('onboarded') !== 'true')
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const [completion, setCompletion] = useState<CheckInCompletion | null>(null)
  const [reflectionSaved, setReflectionSaved] = useState(false)

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
    setReflectionSaved(false)
    navigation.navigate({ name: 'check-in', route })
  }, [navigation])

  const complete = useCallback((route: CheckInRoute, modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => {
    if (selections.length === 0 || results.length === 0) return
    const baseTier = getCrisisTier(results.map((result) => result.id))
    const crisisTier = escalateCrisisTier(baseTier, sessions)
    setCompletion({
      route,
      modelId,
      selections,
      results,
      crisisTier,
      temporalEscalation: hasTemporalCrisisPattern(sessions) && crisisTier !== baseTier,
    })
    setReflectionSaved(false)
    navigation.navigate({ name: 'reflection' })
  }, [navigation, sessions])

  const completeQuick = useCallback((selection: BaseEmotion, result: AnalysisResult) => {
    complete('quick', 'quick-check-in', [selection], [result])
  }, [complete])

  const saveReflection = useCallback(async (detail: ReflectionDetail): Promise<ReflectionSaveOutcome> => {
    if (!completion || !saveSessions) return 'not-saved'
    if (reflectionSaved) return 'saved'
    const serialized: SerializedSelection[] = completion.selections.map((selection) => {
      const item: SerializedSelection = { emotionId: selection.id, label: selection.label }
      if ('selectedSensation' in selection && 'selectedIntensity' in selection) {
        item.extras = {
          sensationType: (selection as BaseEmotion & { selectedSensation: string }).selectedSensation,
          intensity: (selection as BaseEmotion & { selectedIntensity: number }).selectedIntensity,
        }
      }
      return item
    })
    const session: Session = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      modelId: completion.modelId,
      entryRoute: completion.route,
      selections: serialized,
      results: completion.results,
      crisisTier: getCrisisTier(completion.results.map((result) => result.id)),
      reflectionAnswer: detail.reflectionAnswer,
      selectedNeed: detail.selectedNeed,
      nextStep: detail.nextStep,
    }
    await saveSession(session)
    setReflectionSaved(true)
    return 'saved'
  }, [completion, reflectionSaved, saveSession, saveSessions])

  const returnToday = useCallback(() => {
    setCompletion(null)
    setReflectionSaved(false)
    navigation.reset({ name: 'today' })
  }, [navigation])

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
          ? <ReflectionScreen completion={completion} allowExternalAI={allowExternalAI} onBack={navigation.back} onSave={saveReflection} onReturn={returnToday} />
          : <TodayScreen sessions={sessions} saveSessions={saveSessions} onStart={() => navigation.navigate({ name: 'arrival' })} onQuickComplete={completeQuick} onOpenJournal={() => navigation.reset({ name: 'journal' })} />
      case 'explore':
        return <ExploreScreen onChoose={startRoute} onPractice={() => navigation.navigate({ name: 'granularity' })} />
      case 'journal':
        return <JournalScreen sessions={sessions} loading={sessionsLoading} error={sessionsError} saveSessions={saveSessions} onOpenSession={(sessionId) => navigation.navigate({ name: 'session', sessionId })} onOpenChain={() => navigation.navigate({ name: 'chain' })} />
      case 'session':
        return <SessionDetailScreen session={sessions.find((session) => session.id === destination.sessionId)} onBack={navigation.back} />
      case 'settings':
        return <SettingsScreen theme={theme} onBack={navigation.back} onThemeChange={setTheme} onOpenPrivacy={() => navigation.navigate({ name: 'privacy' })} onOpenSupport={() => navigation.navigate({ name: 'support' })} />
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
  }, [allowExternalAI, chainEntries, chainLoading, clearAllChains, clearData, complete, completeQuick, completion, destination, exportData, navigation, returnToday, saveChainEntry, saveReflection, saveSessions, sessions, sessionsError, sessionsLoading, setExternalAI, setSaving, startRoute, theme])

  if (showOnboarding) {
    return (
      <MotionConfig reducedMotion="user">
        <Onboarding onComplete={() => setShowOnboarding(false)} />
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
