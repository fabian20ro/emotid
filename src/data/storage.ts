const PREFIX = 'emot-id-'

const KEYS = {
  model: `${PREFIX}model`,
  language: `${PREFIX}language`,
  onboarded: `${PREFIX}onboarded`,
  saveSessions: `${PREFIX}save-sessions`,
  dimensionalAxisHintSeen: `${PREFIX}dimensional-axis-hint-seen`,
  allowExternalAI: `${PREFIX}allow-external-ai`,
  theme: `${PREFIX}theme`,
} as const

type StorageKey = keyof typeof KEYS

export interface PreferenceSnapshot {
  model: string | null
  language: 'ro' | 'en'
  saveSessions: boolean
  dimensionalAxisHintSeen: boolean
  allowExternalAI: boolean
  theme: 'light' | 'dark'
  dismissedHints: string[]
}

const PREFERENCE_KEYS: StorageKey[] = [
  'model',
  'language',
  'saveSessions',
  'dimensionalAxisHintSeen',
  'allowExternalAI',
  'theme',
]

const LEGACY_PREFERENCE_KEYS = [
  `${PREFIX}sound-muted`,
  `${PREFIX}daily-reminder-enabled`,
  `${PREFIX}daily-reminder-last-sent-at`,
  `${PREFIX}simple-language`,
] as const

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage
  }
  return null
}

function get(key: StorageKey): string | null {
  try {
    return getStorage()?.getItem(KEYS[key]) ?? null
  } catch {
    return null
  }
}

function set(key: StorageKey, value: string): void {
  try {
    getStorage()?.setItem(KEYS[key], value)
  } catch {
    // localStorage unavailable in private browsing
  }
}

function getPreferenceSnapshot(): PreferenceSnapshot {
  const local = getStorage()
  const dismissedHints: string[] = []
  if (local) {
    try {
      for (let index = 0; index < local.length; index++) {
        const key = local.key(index)
        if (key?.startsWith(`${PREFIX}hint-`) && local.getItem(key) === 'true') {
          dismissedHints.push(key.slice(`${PREFIX}hint-`.length))
        }
      }
    } catch {
      // localStorage unavailable
    }
  }
  return {
    model: get('model'),
    language: get('language') === 'ro' ? 'ro' : 'en',
    saveSessions: get('saveSessions') !== 'false',
    dimensionalAxisHintSeen: get('dimensionalAxisHintSeen') === 'true',
    allowExternalAI: get('allowExternalAI') !== 'false',
    theme: get('theme') === 'dark' ? 'dark' : 'light',
    dismissedHints: dismissedHints.sort(),
  }
}

function resetPreferences(): void {
  const local = getStorage()
  if (!local) return
  const keysToRemove: string[] = [
    ...PREFERENCE_KEYS.map((key) => KEYS[key]),
    ...LEGACY_PREFERENCE_KEYS,
  ]
  try {
    for (let index = 0; index < local.length; index++) {
      const key = local.key(index)
      if (key?.startsWith(`${PREFIX}hint-`)) keysToRemove.push(key)
    }
  } catch {
    // localStorage unavailable
  }
  for (const key of keysToRemove) {
    try {
      local.removeItem(key)
    } catch {
      // localStorage unavailable
    }
  }
}

function isHintDismissed(modelId: string): boolean {
  try {
    return getStorage()?.getItem(`${PREFIX}hint-${modelId}`) === 'true'
  } catch {
    return false
  }
}

function dismissHint(modelId: string): void {
  try {
    getStorage()?.setItem(`${PREFIX}hint-${modelId}`, 'true')
  } catch {
    // localStorage unavailable
  }
}

export const storage = {
  KEYS,
  get,
  set,
  getPreferenceSnapshot,
  resetPreferences,
  isHintDismissed,
  dismissHint,
} as const
