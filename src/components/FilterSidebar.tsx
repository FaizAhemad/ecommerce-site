import { useMemo, useState } from 'react'
import { Check, ListFilter, RotateCcw } from 'lucide-react'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { Checkbox } from './mui/Checkbox'
import { Divider } from './mui/Divider'
import { Drawer } from './mui/Drawer'
import { FormControlLabel } from './mui/FormControlLabel'
import { IconButton } from './mui/IconButton'
import { MenuItem } from './mui/MenuItem'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'
import CloseIcon from '@mui/icons-material/Close'
import type { ProductSort } from '../api/storefront'

type Props = {
  collapseLabel?: string; expandLabel?: string; onExpandedChange?: (expanded: boolean) => void
  search: string; category: string; sort: ProductSort; categories: readonly string[]
  searchPlaceholder: string; allCategoriesLabel: string; sortLabel: string
  newestSortLabel: string; priceLowSortLabel: string; priceHighSortLabel: string
  clearLabel: string; selectedColors: readonly string[]; selectedRatings: readonly number[]
  colorOptions: readonly string[]; colorValues?: Readonly<Record<string, string>>
  ratingLabel: string; colorsLabel: string
  benefits?: { title: string; items: readonly string[] }
  onSearch: (v: string) => void; onCategory: (v: string) => void; onSort: (v: ProductSort) => void
  onClear: () => void; onColorToggle: (v: string) => void; onRating: (v: number) => void
}

export function FilterSidebar({
  search, category, sort, categories, searchPlaceholder, allCategoriesLabel, sortLabel,
  newestSortLabel, priceLowSortLabel, priceHighSortLabel, clearLabel, selectedColors,
  selectedRatings, colorOptions, colorValues = {}, ratingLabel, colorsLabel,
  benefits = { title: 'Shopping with us', items: ['Thoughtfully selected goods', 'Support when you need it', 'Secure checkout'] },
  onSearch, onCategory, onSort, onClear, onColorToggle, onRating,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeFilterCount = useMemo(() => [search.trim().length > 0, category.length > 0, sort !== 'newest', selectedColors.length > 0, selectedRatings.length > 0].filter(Boolean).length,
    [search, category, sort, selectedColors.length, selectedRatings.length])
  const fields = (
    <Stack spacing={2.5}>
      <TextField size="small" label={searchPlaceholder} type="search" autoComplete="off" spellCheck={false} value={search} onChange={(event) => onSearch(event.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 44 } }} />
      <TextField size="small" select label={allCategoriesLabel} value={category} onChange={(event) => onCategory(event.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 44 } }}>
        <MenuItem value="">{allCategoriesLabel}</MenuItem>{categories.map((item) => <MenuItem value={item} key={item}>{item}</MenuItem>)}
      </TextField>
      <TextField size="small" select label={sortLabel} value={sort} onChange={(event) => onSort(event.target.value as ProductSort)} fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 44 } }}>
        <MenuItem value="newest">{newestSortLabel}</MenuItem><MenuItem value="price-low">{priceLowSortLabel}</MenuItem><MenuItem value="price-high">{priceHighSortLabel}</MenuItem>
      </TextField>
      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
        <Typography component="legend" variant="overline" color="text.secondary" sx={{ mb: 1 }}>{ratingLabel}</Typography>
        <Stack>{[5, 4, 3, 2, 1].map((rating) => <FormControlLabel key={rating} control={<Checkbox checked={selectedRatings.includes(rating)} onChange={() => onRating(rating)} />} label={rating === 5 ? '5 stars' : `${rating} to under ${rating + 1} stars`} />)}</Stack>
      </Box>
      {colorOptions.length > 0 && <>
        <Divider />
        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" variant="overline" color="text.secondary" sx={{ mb: 1 }}>{colorsLabel}</Typography>
          <Stack>{colorOptions.map((color) => {
            const hex = colorValues[color]
            const validHex = /^#[\da-f]{6}$/i.test(hex ?? '')
            return <FormControlLabel key={color} control={<Checkbox checked={selectedColors.includes(color)} onChange={() => onColorToggle(color)} />} label={<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box aria-hidden="true" sx={{ width: 16, height: 16, borderRadius: '50%', border: 1, borderColor: 'divider', bgcolor: validHex ? hex : 'transparent' }} /><Typography variant="body2">{color}{validHex ? ` ${hex.toUpperCase()}` : ' (swatch unavailable)'}</Typography></Stack>} />
          })}</Stack>
        </Box>
      </>}
      <Divider />
      <Box>
        <Typography variant="overline" color="text.secondary">{benefits.title}</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>{benefits.items.map((item) => <Stack key={item} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}><Check aria-hidden="true" size={16} color="var(--green)" /><Typography variant="body2" color="text.secondary">{item}</Typography></Stack>)}</Stack>
      </Box>
    </Stack>
  )
  return <>
    <Box component="aside" aria-label="Catalog filters" sx={{ position: 'sticky', top: 24, display: { xs: 'none', md: 'block' }, alignSelf: 'start', maxHeight: 'calc(100svh - 48px)', overflowY: 'auto', borderRight: 1, borderColor: 'divider', pr: 3 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography component="h2" variant="subtitle2">Filter</Typography>
        {activeFilterCount > 0 && <Button variant="text" size="small" onClick={onClear} startIcon={<RotateCcw size={15} />}>{clearLabel}</Button>}
      </Stack>{fields}
    </Box>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5, display: { xs: 'flex', md: 'none' } }}>
      <Button variant="outlined" startIcon={<ListFilter size={16} />} onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen}>Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Button>
      {activeFilterCount > 0 && <Button variant="text" size="small" onClick={onClear}>{clearLabel}</Button>}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} slotProps={{ paper: { sx: { width: 'min(22rem, calc(100vw - 24px))', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' } } }} aria-labelledby="catalog-filter-title">
        <Box component="header" sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5, py: 2.5, pr: 8, position: 'relative' }}><Typography id="catalog-filter-title" variant="h6">Filters</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Refine the collection to find what you need.</Typography><IconButton aria-label="Close filters" onClick={() => setDrawerOpen(false)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton></Box>
        <Box sx={{ minHeight: 0, flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>{fields}</Box>
        <Box component="footer" sx={{ display: 'flex', gap: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 2 }}>{activeFilterCount > 0 && <Button variant="outlined" fullWidth onClick={onClear} startIcon={<RotateCcw size={16} />}>{clearLabel}</Button>}<Button variant="contained" fullWidth onClick={() => setDrawerOpen(false)}>Done</Button></Box>
      </Drawer>
    </Stack>
  </>
}
