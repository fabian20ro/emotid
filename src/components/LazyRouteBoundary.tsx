import { Component, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface ErrorBoundaryProps {
  children: ReactNode
  copy: {
    errorTitle: string
    errorBody: string
    retry: string
  }
}

class RouteErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('emot-id: route chunk failed to load', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="screen route-load-state" data-testid="route-load-error">
          <h1 id="screen-title" className="screen-title" tabIndex={-1}>{this.props.copy.errorTitle}</h1>
          <p>{this.props.copy.errorBody}</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            <RotateCcw size={18} aria-hidden="true" />
            {this.props.copy.retry}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function RouteLoading() {
  const { section } = useLanguage()
  const t = section('routeLoading')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 180)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div
      className={`screen route-load-state${visible ? '' : ' is-pending'}`}
      data-testid="route-loading"
      role={visible ? 'status' : undefined}
      aria-live={visible ? 'polite' : undefined}
      aria-busy="true"
    >
      <h1 id="screen-title" className="screen-title">{t.title}</h1>
      <p>{t.body}</p>
    </div>
  )
}

export function LazyRouteBoundary({ children }: { children: ReactNode }) {
  const { section } = useLanguage()
  const t = section('routeLoading')
  return (
    <RouteErrorBoundary copy={t}>
      <Suspense fallback={<RouteLoading />}>{children}</Suspense>
    </RouteErrorBoundary>
  )
}
