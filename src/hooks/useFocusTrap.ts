import { useLayoutEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  active: boolean,
  onClose?: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
  returnFocusRef?: RefObject<HTMLElement | null>,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const restoreTimerRef = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)
  const initialFocusTargetRef = useRef(initialFocusRef)
  const explicitReturnFocusRef = useRef(returnFocusRef)

  useLayoutEffect(() => {
    onCloseRef.current = onClose
    initialFocusTargetRef.current = initialFocusRef
    explicitReturnFocusRef.current = returnFocusRef
  }, [initialFocusRef, onClose, returnFocusRef])

  useLayoutEffect(() => {
    if (!active) return

    if (restoreTimerRef.current !== null) {
      window.clearTimeout(restoreTimerRef.current)
      restoreTimerRef.current = null
    }

    const container = containerRef.current
    const activeElement = document.activeElement as HTMLElement | null
    if (!activeElement || !container?.contains(activeElement)) {
      previousFocusRef.current = explicitReturnFocusRef.current?.current ?? activeElement
    }
    const initialFocusTarget = initialFocusTargetRef.current?.current
    if (container) {
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(initialFocusTarget ?? firstFocusable)?.focus()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }

      if (e.key !== 'Tab' || !container) return

      const focusableEls = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusableEls.length === 0) return

      const firstEl = focusableEls[0]
      const lastEl = focusableEls[focusableEls.length - 1]
      const activeEl = document.activeElement as HTMLElement | null
      const isInsideTrap = activeEl ? container.contains(activeEl) : false

      if (!isInsideTrap) {
        e.preventDefault()
        if (e.shiftKey) lastEl.focus()
        else firstEl.focus()
        return
      }

      if (e.shiftKey && (activeEl === firstEl || activeEl === initialFocusTarget)) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && activeEl === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const previousFocus = previousFocusRef.current
      restoreTimerRef.current = window.setTimeout(() => {
        restoreTimerRef.current = null
        if (previousFocus?.isConnected) previousFocus.focus()
      }, 0)
    }
  }, [active])

  return containerRef
}
