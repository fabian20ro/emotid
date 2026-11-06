type Invalidation = 'deleted' | 'upgrade' | null
let invalidation: Invalidation = null
const listeners = new Set<() => void>()

export function invalidateStorage(reason: Exclude<Invalidation, null>) {
  invalidation = reason
  listeners.forEach((listener) => listener())
}

export const getStorageInvalidation = () => invalidation
export function subscribeStorageInvalidation(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

const checks = new Set<() => Promise<unknown>>()
let channel: BroadcastChannel | undefined
let listening = false

export function watchStorage(check: () => Promise<unknown>) {
  checks.add(check)
  if (listening) return
  listening = true
  const recheck = () => {
    // Transactions also check the epoch, including when notifications are missed.
    for (const verify of checks) void verify().catch(() => {})
  }
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel('emot-id-storage-lifecycle')
      channel.onmessage = recheck
    } catch {
      // Optional acceleration only; foreground and transaction checks remain.
    }
  }
  window.addEventListener('focus', recheck)
  window.addEventListener('pageshow', recheck)
  document.addEventListener('visibilitychange', recheck)
}

export function announceErasure() {
  try { channel?.postMessage('erased') }
  catch { /* A notification failure must not change a committed clear's outcome. */ }
}
