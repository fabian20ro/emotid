import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import type { HistoryPage } from '../hooks/useHistoryPage'
import { focusDestination } from '../utils/focusDestination'

export function HistoryPagination({ pagination, label, children }: { pagination: HistoryPage; label: string; children: ReactNode }) {
  const { page, pages, start, end, total } = pagination
  const { section } = useLanguage()
  const t = section('historyPagination')
  const summary = useRef<HTMLParagraphElement>(null)
  const previousPage = useRef(page)
  useLayoutEffect(() => {
    if (previousPage.current !== page) focusDestination(summary.current)
    previousPage.current = page
  }, [page])
  if (!total) return children
  return <>
    <nav className="history-pagination" aria-label={label}>
      <p ref={summary} tabIndex={-1} className="history-page-summary">
        {t.range.replace('{start}', String(start + 1)).replace('{end}', String(end)).replace('{total}', String(total))}
      </p>
      {pages > 1 && <PageControls pagination={pagination} />}
    </nav>
    {children}
    {pages > 1 && <nav className="history-pagination" aria-label={label}><PageControls pagination={pagination} /></nav>}
  </>
}

function PageControls({ pagination: { page, pages, setPage } }: { pagination: HistoryPage }) {
  const { section } = useLanguage()
  const t = section('historyPagination')
  const id = useId()
  return <div className="history-page-controls">
      {[
        { Icon: ChevronsLeft, name: t.first, target: 0, disabled: page === 0 },
        { Icon: ChevronLeft, name: t.previous, target: page - 1, disabled: page === 0 },
        { Icon: ChevronRight, name: t.next, target: page + 1, disabled: page === pages - 1 },
        { Icon: ChevronsRight, name: t.last, target: pages - 1, disabled: page === pages - 1 },
      ].map(({ Icon, name, target, disabled }) => <button key={name} type="button" className="icon-button"
        aria-label={name} title={name} disabled={disabled} onClick={() => setPage(target)}><Icon size={20} aria-hidden="true" /></button>)}
      <form onSubmit={(event) => {
        event.preventDefault()
        const next = Number(new FormData(event.currentTarget).get('page'))
        if (Number.isInteger(next) && next >= 1 && next <= pages) setPage(next - 1)
      }}>
        <label htmlFor={id}>{t.page}</label>
        <input key={page} id={id} name="page" type="number" inputMode="numeric" min={1} max={pages} step={1} required defaultValue={page + 1} />
        <span>{t.of.replace('{pages}', String(pages))}</span>
        <button type="submit" className="icon-button" aria-label={t.go} title={t.go}><ArrowRight size={20} aria-hidden="true" /></button>
      </form>
    </div>
}
