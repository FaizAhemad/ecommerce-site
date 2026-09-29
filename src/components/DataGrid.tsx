import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

export type DataGridColumn<Row> = {
  id: string
  header: string
  cell: (row: Row) => ReactNode
  getFilterValue?: (row: Row) => string | number | null | undefined
  getSortValue?: (row: Row) => string | number | null | undefined
  filterable?: boolean
  sortable?: boolean
  sortKey?: string
  filterPlaceholder?: string
  filterType?: 'text' | 'number'
  filterStep?: number
  minWidthClass?: string
  filterOptions?: { value: string; label: string }[]
}

export type DataGridQuery = {
  page: number
  pageSize: number
  search: string
  filters: Record<string, string>
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

type Props<Row> = {
  rows: Row[]
  totalRows: number
  columns: DataGridColumn<Row>[]
  getRowKey: (row: Row) => string
  label: string
  emptyMessage: string
  isLoading?: boolean
  onQueryChange: (query: DataGridQuery) => void
  initialPageSize?: number
}

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null

export function DataGrid<Row>({
  rows,
  totalRows,
  columns,
  getRowKey,
  label,
  emptyMessage,
  isLoading = false,
  onQueryChange,
  initialPageSize = 10,
}: Props<Row>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [columnFiltersVisible, setColumnFiltersVisible] = useState(true)
  const [sort, setSort] = useState<SortState>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const filterableColumns = useMemo(
    () => columns.filter((column) => column.filterable !== false && column.getFilterValue),
    [columns],
  )
  const sortableColumns = useMemo(
    () => columns.filter((column) => column.sortable !== false && (column.getSortValue || column.getFilterValue)),
    [columns],
  )
  const activeColumnFilterCount = filterableColumns.filter((column) => columnFilters[column.id]?.trim()).length
  const hasFilters = Boolean(globalFilter.trim() || activeColumnFilterCount)
  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(columnFilters).filter(([, value]) => value.trim())),
    [columnFilters],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onQueryChange({
        page: pageIndex + 1,
        pageSize,
        search: globalFilter.trim(),
        filters: activeFilters,
        ...(sort ? { sortBy: columns.find((column) => column.id === sort.columnId)?.sortKey ?? sort.columnId, sortDirection: sort.direction } : {}),
      })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [activeFilters, globalFilter, onQueryChange, pageIndex, pageSize, sort])

  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const visiblePageIndex = Math.min(pageIndex, pageCount - 1)
  const startIndex = totalRows ? visiblePageIndex * pageSize + 1 : 0
  const endIndex = Math.min((visiblePageIndex + 1) * pageSize, totalRows)

  useEffect(() => {
    if (visiblePageIndex !== pageIndex) setPageIndex(visiblePageIndex)
  }, [pageIndex, visiblePageIndex])

  const clearFilters = () => {
    setGlobalFilter('')
    setColumnFilters({})
    setPageIndex(0)
  }

  const setColumnFilter = (columnId: string, value: string) => {
    setColumnFilters((current) => ({ ...current, [columnId]: value }))
    setPageIndex(0)
  }

  const toggleSort = (column: DataGridColumn<Row>) => {
    setPageIndex(0)
    setSort((current) => {
      if (current?.columnId !== column.id) return { columnId: column.id, direction: 'asc' }
      if (current.direction === 'asc') return { columnId: column.id, direction: 'desc' }
      return null
    })
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(37,40,33,0.06)]" aria-label={label}>
      <div className="flex flex-col gap-4 border-b border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Search all {label.toLocaleLowerCase()}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
          <input
            className="min-h-12 w-full appearance-none rounded-xl border border-[var(--line)] bg-[var(--paper)] py-2 pl-11 pr-4 text-base text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:border-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            type="search"
            maxLength={120}
            value={globalFilter}
            onChange={(event) => { setGlobalFilter(event.target.value); setPageIndex(0) }}
            placeholder={`Search ${label.toLocaleLowerCase()}`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <p className="m-0 mr-1 rounded-full bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium text-[var(--muted)]" aria-live="polite" aria-atomic="true">
            {totalRows} {totalRows === 1 ? 'match' : 'matches'}
          </p>
          <button
            className="inline-flex min-h-11 appearance-none items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            type="button"
            aria-pressed={columnFiltersVisible}
            onClick={() => {
              if (columnFiltersVisible) {
                setColumnFilters({})
                setPageIndex(0)
              }
              setColumnFiltersVisible(!columnFiltersVisible)
            }}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {columnFiltersVisible ? 'Disable column filters' : 'Enable column filters'}
            {columnFiltersVisible && activeColumnFilterCount > 0 && <span className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-xs">{activeColumnFilterCount}</span>}
          </button>
          {hasFilters && (
            <button
              className="inline-flex min-h-11 appearance-none items-center rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-[var(--muted)] underline underline-offset-4 hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="h-1 overflow-hidden bg-transparent" role="status" aria-live="polite" aria-label={isLoading ? 'Updating results' : undefined}>
        <span className={`block h-full w-1/3 rounded-full bg-[var(--green)] transition-opacity motion-reduce:animate-none ${isLoading ? 'animate-[grid-progress_1.1s_ease-in-out_infinite] opacity-100' : 'opacity-0'}`} aria-hidden="true" />
        <span className="sr-only">{isLoading ? 'Updating results' : ''}</span>
      </div>

      <div className="relative overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]" role="region" aria-label={`${label} results, scroll horizontally to view all columns`} tabIndex={0} aria-busy={isLoading}>
        <table className="w-full min-w-[980px] border-collapse text-left text-sm text-[var(--ink)]">
          <caption className="sr-only">{label}; use global search or column filters to narrow these records.</caption>
          <thead className="bg-[var(--surface-raised)] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            <tr>
              {columns.map((column) => {
                const sortable = sortableColumns.includes(column)
                const direction = sort?.columnId === column.id ? sort.direction : null
                return (
                  <th key={column.id} className={`border-b border-[var(--line)] px-3 py-3 sm:px-4 ${column.minWidthClass ?? ''}`} scope="col" aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}>
                    {sortable ? (
                      <button
                        className="inline-flex min-h-10 appearance-none items-center gap-2 rounded-md border-0 bg-transparent p-0 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)] transition-colors hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                        type="button"
                        onClick={() => toggleSort(column)}
                      >
                        {column.header}
                        {direction === 'asc' ? <ArrowUp className="size-3.5" aria-hidden="true" /> : direction === 'desc' ? <ArrowDown className="size-3.5" aria-hidden="true" /> : <ArrowUpDown className="size-3.5 opacity-60" aria-hidden="true" />}
                        <span className="sr-only">{direction ? `Sorted ${direction}; activate to ${direction === 'asc' ? 'sort descending' : 'clear sorting'}` : 'Activate to sort ascending'}</span>
                      </button>
                    ) : column.header}
                  </th>
                )
              })}
            </tr>
            {columnFiltersVisible && (
              <tr className="bg-[var(--surface)] normal-case tracking-normal">
                {columns.map((column) => {
                  const filterable = filterableColumns.includes(column)
                  return (
                    <td key={`${column.id}-filter`} className={`border-b border-[var(--line)] px-3 py-2.5 align-top sm:px-4 ${column.minWidthClass ?? ''}`}>
                      {filterable && (column.filterOptions ? (
                        <div className="relative">
                          <select
                            className="min-h-11 w-full appearance-none rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2.5 pr-8 text-sm font-normal text-[var(--ink)] focus-visible:border-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                            aria-label={`Filter ${column.header}`}
                            value={columnFilters[column.id] ?? ''}
                            onChange={(event) => setColumnFilter(column.id, event.target.value)}
                          >
                            <option value="">All {column.header.toLocaleLowerCase()}</option>
                            {column.filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
                        </div>
                      ) : (
                        <input
                          className="min-h-11 w-full appearance-none rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:border-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                          type={column.filterType ?? 'search'}
                          step={column.filterType === 'number' ? column.filterStep ?? 1 : undefined}
                          min={column.filterType === 'number' ? 0 : undefined}
                          maxLength={column.filterType === 'text' ? 120 : undefined}
                          aria-label={`Filter ${column.header}`}
                          placeholder={column.filterPlaceholder ?? 'Filter…'}
                          value={columnFilters[column.id] ?? ''}
                          onChange={(event) => setColumnFilter(column.id, event.target.value)}
                        />
                      ))}
                    </td>
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.length ? rows.map((row) => (
              <tr key={getRowKey(row)} className="transition-colors hover:bg-[var(--surface-raised)]">
                {columns.map((column) => <td key={column.id} className={`px-3 py-4 align-middle sm:px-4 ${column.minWidthClass ?? ''}`}>{column.cell(row)}</td>)}
              </tr>
            )) : isLoading ? Array.from({ length: Math.min(pageSize, 6) }, (_, index) => (
              <tr key={`loading-${index}`} aria-hidden="true">
                {columns.map((column) => <td key={column.id} className={`px-3 py-4 sm:px-4 ${column.minWidthClass ?? ''}`}><span className="block h-4 animate-pulse rounded bg-[var(--skeleton-base)] motion-reduce:animate-none" /></td>)}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-[var(--muted)]" colSpan={columns.length}>
                  <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--muted)]" aria-hidden="true"><Search className="size-4" /></span>
                  <span className="block font-medium text-[var(--ink)]">{hasFilters ? 'No matching records' : emptyMessage}</span>
                  {hasFilters && <span className="mt-1 block">Try adjusting your search or filters.</span>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isLoading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-28 z-10 flex items-center justify-center bg-transparent" role="status" aria-label="Loading grid results">
            <span className="size-11 animate-spin rounded-full border-[3px] border-[var(--line)] border-t-[var(--green)] bg-[var(--surface)] shadow-md motion-reduce:animate-none" aria-hidden="true" />
            <span className="sr-only">Loading results</span>
          </div>
        )}
      </div>

      <footer className="flex flex-col gap-3 border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="m-0 text-sm text-[var(--muted)]" aria-live="polite">
          {totalRows ? `Showing ${startIndex}–${endIndex} of ${totalRows}` : 'Showing 0 records'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>Rows per page</span>
            <span className="relative">
              <select
                className="min-h-11 appearance-none rounded-lg border border-[var(--line)] bg-[var(--paper)] py-2 pl-3 pr-8 text-sm text-[var(--ink)] focus-visible:border-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0) }}
              >
                {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
            </span>
          </label>
          <div className="flex items-center gap-1">
            <button
              className="inline-flex size-11 appearance-none items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              aria-label="Previous page"
              disabled={visiblePageIndex === 0 || isLoading}
              onClick={() => setPageIndex((page) => Math.max(0, page - 1))}
            ><ChevronLeft className="size-4" aria-hidden="true" /></button>
            <span className="min-w-20 text-center text-sm tabular-nums text-[var(--ink)]">{visiblePageIndex + 1} / {pageCount}</span>
            <button
              className="inline-flex size-11 appearance-none items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              aria-label="Next page"
              disabled={visiblePageIndex >= pageCount - 1 || isLoading}
              onClick={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))}
            ><ChevronRight className="size-4" aria-hidden="true" /></button>
          </div>
        </div>
      </footer>
    </section>
  )
}
