import { useState } from 'react'

const PAGE_SIZE = 20

export function useHistoryPage(total: number) {
  const [requestedPage, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.max(0, Math.min(requestedPage, pages - 1))
  // Shrinking/cleared histories must not resurrect an obsolete page after new saves.
  if (page !== requestedPage) setPage(page)
  return { page, pages, total, start: page * PAGE_SIZE, end: Math.min((page + 1) * PAGE_SIZE, total), setPage }
}

export type HistoryPage = ReturnType<typeof useHistoryPage>
