import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { CircularProgress } from './mui/CircularProgress'
import { FormControl } from './mui/FormControl'
import { IconButton } from './mui/IconButton'
import { MenuItem } from './mui/MenuItem'
import { Paper } from './mui/Paper'
import { Select } from './mui/Select'
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
    if (!Number.isFinite(requestedPage)) {
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
    <TextField type="number" size="small" disabled={disabled} aria-label="Go to page" value={pageDraft} onChange={(event) => setPageDraft(event.target.value)} onBlur={jumpToDraft} onKeyDown={(event) => { if (event.key === 'Enter') { jumpToDraft(); event.currentTarget.blur() } }} slotProps={{ htmlInput: { min: 1, max: pageCount, inputMode: 'numeric', 'aria-label': 'Go to page' } }} sx={{ width: 76, '& input': { textAlign: 'center', fontVariantNumeric: 'tabular-nums' } }} />
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
  useEffect(() => {
    const timer = window.setTimeout(() => onQueryChange({ page: pageIndex + 1, pageSize, search: globalFilter.trim(), filters: activeFilters, ...(sort ? { sortBy: columns.find((column) => column.id === sort.columnId)?.sortKey ?? sort.columnId, sortDirection: sort.direction } : {}) }), 250)
    return () => window.clearTimeout(timer)
  }, [activeFilters, globalFilter, onQueryChange, pageIndex, pageSize, sort])
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const visiblePageIndex = Math.min(pageIndex, pageCount - 1)
  useEffect(() => { if (visiblePageIndex !== pageIndex) setPageIndex(visiblePageIndex) }, [pageIndex, visiblePageIndex])
  const clearFilters = () => { setGlobalFilter(''); setColumnFilters({}); setPageIndex(0) }
  const setColumnFilter = (columnId: string, value: string) => { setColumnFilters((current) => ({ ...current, [columnId]: value })); setPageIndex(0) }
  const toggleSort = (column: DataGridColumn<Row>) => {
    setPageIndex(0)
    setSort((current) => current?.columnId !== column.id ? { columnId: column.id, direction: 'asc' } : current.direction === 'asc' ? { columnId: column.id, direction: 'desc' } : null)
  }

  return <Paper component="section" aria-label={label} variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3, position: 'relative' }}>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'flex-end', borderBottom: 1, borderColor: 'divider', p: { xs: 2, sm: 2.5 } }}>
      {hasFilters && <Button variant="text" size="small" onClick={clearFilters}>Clear filters</Button>}
      <TextField type="search" size="small" label={`Search ${label.toLocaleLowerCase()}`} value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); setPageIndex(0) }} slotProps={{ htmlInput: { maxLength: 120 } }} sx={{ width: { xs: '100%', sm: 320, md: 400 }, maxWidth: '100%' }} />
    </Stack>
    <TableContainer component={Box} role="region" aria-label={`${label} results, scroll horizontally to view all columns`} tabIndex={0} aria-busy={isLoading} sx={{ overflowX: 'auto', overscrollBehaviorX: 'contain', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}>
      <Table aria-label={`${label} table`} sx={{ minWidth: 980 }}>
        <caption style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>{label}; use global search or column filters to narrow these records.</caption>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>{columns.map((column) => {
            const sortable = sortableColumns.includes(column)
            const direction = sort?.columnId === column.id ? sort.direction : null
            return <TableCell key={column.id} scope="col" aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'} sx={{ minWidth: column.minWidthClass?.match(/min-w-(\d+)/)?.[1] ? `${Number(column.minWidthClass.match(/min-w-(\d+)/)?.[1]) * 4}px` : undefined, whiteSpace: 'nowrap' }}>
              {sortable ? <Button variant="text" size="small" onClick={() => toggleSort(column)} sx={{ minHeight: 36, px: 0.5, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{column.header}{direction === 'asc' ? <ArrowUp size={14} /> : direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} opacity={0.6} />}</Button> : column.header}
            </TableCell>
          })}</TableRow>
          <TableRow sx={{ bgcolor: 'background.paper' }}>{columns.map((column) => {
            const filterable = filterableColumns.includes(column)
            return <TableCell key={`${column.id}-filter`} sx={{ verticalAlign: 'top' }}>
              {filterable && (column.filterOptions ? <TextField select size="small" fullWidth aria-label={`Filter ${column.header}`} value={columnFilters[column.id] ?? ''} onChange={(event) => setColumnFilter(column.id, event.target.value)} sx={{ minWidth: 110 }}>
                <MenuItem value="">All {column.header.toLocaleLowerCase()}</MenuItem>{column.filterOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField> : <TextField type={column.filterType === 'number' ? 'number' : 'search'} size="small" fullWidth slotProps={{ htmlInput: { step: column.filterType === 'number' ? column.filterStep ?? 1 : undefined, min: column.filterType === 'number' ? 0 : undefined, maxLength: column.filterType === 'text' ? 120 : undefined, 'aria-label': `Filter ${column.header}` } }} placeholder={column.filterPlaceholder ?? 'Filter…'} value={columnFilters[column.id] ?? ''} onChange={(event) => setColumnFilter(column.id, event.target.value)} sx={{ minWidth: 110 }} />)}
            </TableCell>
          })}</TableRow>
        </TableHead>
        <TableBody>
          {rows.length ? rows.map((row) => <TableRow hover key={getRowKey(row)}>{columns.map((column) => <TableCell key={column.id} sx={{ verticalAlign: 'middle' }}>{column.cell(row)}</TableCell>)}</TableRow>) : isLoading ? <TableRow><TableCell colSpan={columns.length} sx={{ height: 112 }} aria-hidden="true" /></TableRow> : <TableRow><TableCell colSpan={columns.length} sx={{ py: 7, textAlign: 'center' }}><Stack spacing={1} sx={{ alignItems: 'center' }}><Search aria-hidden="true" size={22} /><Typography sx={{ fontWeight: 600 }}>{hasFilters ? 'No matching records' : emptyMessage}</Typography>{hasFilters && <Typography variant="body2" color="text.secondary">Try adjusting your search or filters.</Typography>}</Stack></TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
    {isLoading && <Box sx={{ position: 'absolute', inset: '120px 0 64px', display: 'grid', placeItems: 'center', pointerEvents: 'none', bgcolor: 'rgba(255,254,250,.28)' }} role="status" aria-label="Loading grid results"><CircularProgress /><Typography sx={{ position: 'absolute', width: 1, height: 1, p: 0, m: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>Loading results</Typography></Box>}
    <Stack component="footer" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', px: { xs: 2, sm: 2.5 }, py: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>Rows per page:</Typography>
        <FormControl size="small" sx={{ minWidth: 76 }}>
          <Select value={pageSize} aria-label="Rows per page" onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0) }}>
            {[10, 25, 50].map((size) => <MenuItem key={size} value={size}>{size}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{totalRows ? `${visiblePageIndex * pageSize + 1}–${Math.min((visiblePageIndex + 1) * pageSize, totalRows)} of ${totalRows}` : '0 of 0'}</Typography>
        <GridPaginationActions count={totalRows} page={visiblePageIndex} rowsPerPage={pageSize} onPageChange={(_, nextPage) => setPageIndex(nextPage)} disabled={isLoading} />
      </Stack>
    </Stack>
  </Paper>
}
