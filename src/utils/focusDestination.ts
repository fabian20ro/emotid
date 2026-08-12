export function focusDestination(element: HTMLElement | null) {
  if (!element) return
  element.focus({ preventScroll: true })
  const bounds = element.getBoundingClientRect()
  const viewport = window.visualViewport
  const top = viewport?.offsetTop ?? 0
  const bottom = top + (viewport?.height ?? window.innerHeight)
  if (bounds.top < top || bounds.bottom > bottom) {
    element.scrollIntoView({ block: 'start', inline: 'nearest' })
  }
}
