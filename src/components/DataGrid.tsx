import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Search, X, ListFilter } from 'lucide-react'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { CircularProgress } from './mui/CircularProgress'
import { TableSortLabel } from './mui/TableSortLabel'
import { TablePagination } from './mui/TablePagination'
import { InputAdornment } from './mui/InputAdornment'
import { IconButton } from './mui/IconButton'
import { MenuItem } from './mui/MenuItem'
import { Paper } from './mui/Paper'
import { Stack } from './mui/Stack'
import { Table } from './mui/Table'
import { TableBody } from './mui/TableBody'
import { TableCell } from './mui/TableCell'
import { TableContainer } from './mui/TableContainer'
import { TableHead } from './mui/TableHead'
import { TableRow } from './mui/TableRow'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'

export type DataGridColumn<Row> = {
  id: string; header: string; cell: (row: Row) => ReactNode
  getFilterValue?: (row: Row) => string | number | null | undefined
  getSortValue?: (row: Row) => string | number | null | undefined
  filterable?: boolean; sortable?: boolean; sortKey?: string; filterPlaceholder?: string
  filterType?: 'text' | 'number'; filterStep?: number; minWidthClass?: string
  filterOptions?: { value: string; label: string }[]
}
export type DataGridQuery = { page: number; pageSize: number; search: string; filters: Record<string, string>; sortBy?: string; sortDirection?: 'asc' | 'desc' }
type Props<Row> = { rows: Row[]; totalRows: number; columns: DataGridColumn<Row>[]; getRowKey: (row: Row) => string; label: string; emptyMessage: string; isLoading?: boolean; onQueryChange: (query: DataGridQuery) => void; initialPageSize?: number }
type SortState = { columnId: string; direction: 'asc' | 'desc' } | null

type PaginationActionsProps = {
  count: number
  page: number
  rowsPerPage: number
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void
  disabled?: boolean
}

function GridPaginationActions({ count, page, rowsPerPage, onPageChange, disabled = false }: PaginationActionsProps) {
  const pageCount = Math.max(1, Math.ceil(count / rowsPerPage))
  const [pageDraft, setPageDraft] = useState(String(page + 1))
  useEffect(() => setPageDraft(String(page + 1)), [page])
  const jumpToDraft = () => {
    const requestedPage = Number(pageDraft)
    if (!pageDraft.trim() || !Number.isInteger(requestedPage)) {
      setPageDraft(String(page + 1))
      return
    }
    const nextPage = Math.max(0, Math.min(pageCount - 1, Math.floor(requestedPage) - 1))
    setPageDraft(String(nextPage + 1))
    if (nextPage !== page && !disabled) onPageChange(null, nextPage)
  }

  return <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
    <IconButton aria-label="First page" disabled={disabled || page <= 0} onClick={(event) => onPageChange(event, 0)} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}><ChevronsLeft size={18} /></IconButton>
    <IconButton aria-label="Previous page" disabled={disabled || page <= 0} onClick={(event) => onPageChange(event, page - 1)} size="small"><ChevronLeft size={18} /></IconButton>
    <TextField type="number" size="small" disabled={disabled} aria-label="Go to page" value={pageDraft} onChange={(event) => setPageDraft(event.target.value)} onBlur={jumpToDraft} onKeyDown={(event) => { if (event.key === 'Enter') { jumpToDraft(); event.currentTarget.blur() } }} slotProps={{ htmlInput: { min: 1, max: pageCount, inputMode: 'numeric', 'aria-label': 'Go to page' } }} sx={{ width: 70, flexShrink: 0, '& input': { textAlign: 'center', fontVariantNumeric: 'tabular-nums' } }} />
    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 46 }}>of {pageCount}</Typography>
    <IconButton aria-label="Next page" disabled={disabled || page >= pageCount - 1} onClick={(event) => onPageChange(event, page + 1)} size="small"><ChevronRight size={18} /></IconButton>
    <IconButton aria-label="Last page" disabled={disabled || page >= pageCount - 1} onClick={(event) => onPageChange(event, pageCount - 1)} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}><ChevronsRight size={18} /></IconButton>
  </Stack>
}

export function DataGrid<Row>({ rows, totalRows, columns, getRowKey, label, emptyMessage, isLoading = false, onQueryChange, initialPageSize = 10 }: Props<Row>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<SortState>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const filterableColumns = useMemo(() => columns.filter((column) => column.filterable !== false && column.getFilterValue), [columns])
  const sortableColumns = useMemo(() => columns.filter((column) => column.sortable !== false && (column.getSortValue || column.getFilterValue)), [columns])
  const activeColumnFilterCount = filterableColumns.filter((column) => columnFilters[column.id]?.trim()).length
  const hasFilters = Boolean(globalFilter.trim() || activeColumnFilterCount)
  const activeFilters = useMemo(() => Object.fromEntries(Object.entries(columnFilters).filter(([, value]) => value.trim())), [columnFilters])
  const sortKey = sort ? columns.find((column) => column.id === sort.columnId)?.sortKey ?? sort.columnId : undefined
  useEffect(() => {
    const timer = window.setTimeout(() => onQueryChange({ page: pageIndex + 1, pageSize, search: globalFilter.trim(), filters: activeFilters, ...(sort ? { sortBy: sortKey, sortDirection: sort.direction } : {}) }), 250)
    return () => window.clearTimeout(timer)
  }, [activeFilters, globalFilter, onQueryChange, pageIndex, pageSize, sort, sortKey])
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const visiblePageIndex = isLoading ? pageIndex : Math.min(pageIndex, pageCount - 1)
  useEffect(() => { if (visiblePageIndex !== pageIndex) setPageIndex(visiblePageIndex) }, [pageIndex, visiblePageIndex])
  const clearFilters = () => { setGlobalFilter(''); setColumnFilters({}); setPageIndex(0) }
  const setColumnFilter = (columnId: string, value: string) => { setColumnFilters((current) => ({ ...current, [columnId]: value })); setPageIndex(0) }
  const toggleSort = (column: DataGridColumn<Row>) => {
    setPageIndex(0)
    setSort((current) => current?.columnId !== column.id ? { columnId: column.id, direction: 'asc' } : current.direction === 'asc' ? { columnId: column.id, direction: 'desc' } : null)
  }

  const frameRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLTableSectionElement>(null)
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const [bodyBounds, setBodyBounds] = useState({ top: 0, height: 0 })
  useLayoutEffect(() => {
    const measure = () => {
      const frame = frameRef.current?.getBoundingClientRect()
      const body = bodyRef.current?.getBoundingClientRect()
      if (frame && body) setBodyBounds({ top: body.top - frame.top, height: body.height })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    for (const element of [frameRef.current, headRef.current, bodyRef.current]) {
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [rows.length, columns.length, isLoading])

  return (
    <Paper component="section" aria-label={label} variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3, boxShadow: '0 4px 20px rgba(23,43,58,.04)' }}>
      <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'flex-end', borderBottom: 1, borderColor: 'divider', p: 2 }}>
        {hasFilters && <Button variant="text" size="small" startIcon={<X size={16} />} onClick={clearFilters}>Clear filters</Button>}
        <TextField
          type="search" size="small" placeholder={`Search ${label.toLocaleLowerCase()}`}
          value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); setPageIndex(0) }}
          slotProps={{
            htmlInput: { maxLength: 120, 'aria-label': `Search ${label.toLocaleLowerCase()}` },
            input: { startAdornment: <InputAdornment position="start"><Search size={18} aria-hidden="true" /></InputAdornment> },
          }}
          sx={{ width: { xs: '100%', sm: 320 }, maxWidth: '100%' }}
        />
      </Stack>
      <Box ref={frameRef} sx={{ position: 'relative' }}>
        <TableContainer component={Box} role="region" aria-label={`${label} results, scroll horizontally to view all columns`} tabIndex={0} aria-busy={isLoading} sx={{ border: 0, borderRadius: 0, overflowX: 'auto', overscrollBehaviorX: 'contain', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}>
          <Table aria-label={`${label} table`} sx={{ minWidth: Math.max(640, columns.length * 150), '& th, & td': { px: 2 }, '& tbody td': { py: 1.5, fontSize: 14 }, '& tbody tr:last-child td': { borderBottom: 0 } }}>
            <TableHead ref={headRef}>
              <TableRow>{columns.map((column) => {
                const sortable = sortableColumns.includes(column)
                const direction = sort?.columnId === column.id ? sort.direction : null
                const width = column.minWidthClass?.match(/min-w-(\d+)/)?.[1]
                return (
                  <TableCell key={column.id} scope="col" sortDirection={direction ?? false} sx={{ minWidth: width ? Number(width) * 4 : 150, py: 0.5, fontSize: 13, bgcolor: 'action.hover' }}>
                    {sortable ? <TableSortLabel active={Boolean(direction)} direction={direction ?? 'asc'} onClick={() => toggleSort(column)} aria-label={`Sort by ${column.header}`}>
                      {column.header}
                    </TableSortLabel> : column.header}
                  </TableCell>
                )
              })}</TableRow>
              <TableRow>{columns.map((column) => {
                const value = columnFilters[column.id] ?? ''
                const active = Boolean(value.trim())
                return (
                  <TableCell key={`${column.id}-filter`} sx={{ py: 1.25, bgcolor: 'background.paper !important', verticalAlign: 'top' }}>
                    {filterableColumns.includes(column) && (
                      <TextField
                        select={Boolean(column.filterOptions)} size="small" fullWidth
                        type={column.filterType === 'number' ? 'number' : 'text'}
                        value={value} onChange={(event) => setColumnFilter(column.id, event.target.value)}
                        placeholder={column.filterPlaceholder ?? (column.filterType === 'number' ? 'Equals' : 'Contains')}
                        slotProps={{
                          htmlInput: { maxLength: 120, step: column.filterStep ?? 1, min: column.filterType === 'number' ? 0 : undefined, 'aria-label': `Filter ${column.header}` },
                          select: { displayEmpty: true, inputProps: { 'aria-label': `Filter ${column.header}` } },
                          input: column.filterOptions ? undefined : {
                            startAdornment: <InputAdornment position="start"><ListFilter size={15} aria-hidden="true" /></InputAdornment>,
                          },
                        }}
                        sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: active ? 'action.selected' : 'background.paper' }, ...(active ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' } } : {}) }}
                      >
                        {column.filterOptions && [<MenuItem key="all" value=""><Typography component="span" variant="body2" color="text.secondary">All</Typography></MenuItem>, ...column.filterOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)]}
                      </TextField>
                    )}
                  </TableCell>
                )
              })}</TableRow>
            </TableHead>
            <TableBody ref={bodyRef}>
              {rows.length ? rows.map((row) => <TableRow hover key={getRowKey(row)}>{columns.map((column) => <TableCell key={column.id} sx={{ verticalAlign: 'middle' }}>{column.cell(row)}</TableCell>)}</TableRow>) : (
                <TableRow><TableCell colSpan={columns.length} sx={{ height: 240, textAlign: 'center' }}>
                  {!isLoading && <Stack spacing={1} sx={{ alignItems: 'center', py: 4 }}>
                    <Box sx={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: '50%', bgcolor: 'action.hover', color: 'primary.main' }}><Search aria-hidden="true" size={22} /></Box>
                    <Typography sx={{ fontWeight: 600 }}>{hasFilters ? 'No matching records' : emptyMessage}</Typography>
                    {hasFilters && <Typography variant="body2" color="text.secondary">Try adjusting your search or filters.</Typography>}
                  </Stack>}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {isLoading && <Box sx={{ position: 'absolute', top: bodyBounds.top, height: bodyBounds.height, left: 0, right: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', bgcolor: 'rgba(255,255,255,.35)' }} role="status" aria-label="Loading grid results">
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: '50%', display: 'flex', boxShadow: '0 4px 16px rgba(23,43,58,.12)' }}><CircularProgress size={28} aria-label="Loading results" /></Paper>
        </Box>}
      </Box>
      <TablePagination
        component="div" count={totalRows} page={visiblePageIndex} rowsPerPage={pageSize}
        rowsPerPageOptions={[10, 25, 50]} labelRowsPerPage="Rows per page:" disabled={isLoading}
        onPageChange={(_, page) => setPageIndex(page)}
        onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0) }}
        ActionsComponent={GridPaginationActions}
        slotProps={{ select: { inputProps: { 'aria-label': 'Rows per page' } }, displayedRows: { 'aria-live': 'polite' } }}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
    </Paper>
  )
}
