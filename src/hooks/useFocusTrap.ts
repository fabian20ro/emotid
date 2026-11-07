import { useLayoutEffect, useRef, type RefObject } from 'react'
import { focusDestination } from '../utils/focusDestination'

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
    const getFocusable = () => Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
      .filter((element) => !element.matches(':disabled') && !element.closest('[hidden], [inert]'))
    if (container) {
      focusDestination(initialFocusTarget ?? getFocusable()[0] ?? container)
    }

    // Disabling/removing the focused action must not leave focus behind the dialog.
    const observer = new MutationObserver(() => {
      const current = document.activeElement as HTMLElement | null
      if (container && (!current || !container.contains(current) || current.matches(':disabled') || current.closest('[hidden], [inert]'))) {
        focusDestination(getFocusable()[0] ?? container)
      }
    })
    if (container) observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'inert', 'tabindex'] })

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }

      if (e.key !== 'Tab' || !container) return

      e.preventDefault()
      const focusableEls = getFocusable()
      if (focusableEls.length === 0) {
        focusDestination(container)
        return
      }
      const index = focusableEls.indexOf(document.activeElement as HTMLElement)
      const next = index < 0 ? (e.shiftKey ? focusableEls.length - 1 : 0)
        : (index + (e.shiftKey ? -1 : 1) + focusableEls.length) % focusableEls.length
      focusDestination(focusableEls[next])
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      observer.disconnect()
      const previousFocus = previousFocusRef.current
      restoreTimerRef.current = window.setTimeout(() => {
        restoreTimerRef.current = null
        if (previousFocus?.isConnected) previousFocus.focus()
      }, 0)
    }
  }, [active])

  return containerRef
}
