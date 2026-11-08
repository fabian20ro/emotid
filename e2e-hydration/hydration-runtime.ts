import { createHydrationProbe, type HistoryStore } from './hydration-probe'

declare global {
  interface Window {
    __EMOTID_HYDRATION_PROBE__: ReturnType<typeof createHydrationProbe>
    __hydrationControl?: { hold?: HistoryStore; fail?: HistoryStore; release?: () => void }
  }
}

export const probe = createHydrationProbe()
window.__EMOTID_HYDRATION_PROBE__ = probe

export async function beforeRead(store: HistoryStore) {
  const control = window.__hydrationControl
  if (control?.fail === store) throw new Error('Synthetic hydration read failure')
  if (control?.hold === store) await new Promise<void>((resolve) => { control.release = resolve })
}
