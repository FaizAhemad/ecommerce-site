import { useMemo, useState } from 'react'
import { Check, ChevronDown, ListFilter, RotateCcw } from 'lucide-react'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { Drawer } from './mui/Drawer'
import { IconButton } from './mui/IconButton'
import { Typography } from './mui/Typography'
import CloseIcon from '@mui/icons-material/Close'
import type { ProductSort } from '../api/storefront'

type Props = {
  collapseLabel?: string
  expandLabel?: string
  onExpandedChange?: (expanded: boolean) => void
  search: string
  category: string
  sort: ProductSort
  categories: readonly string[]
  searchPlaceholder: string
  allCategoriesLabel: string
  sortLabel: string
  newestSortLabel: string
  priceLowSortLabel: string
  priceHighSortLabel: string
  clearLabel: string
  selectedColors: readonly string[]
  selectedRatings: readonly number[]
  colorOptions: readonly string[]
  colorValues?: Readonly<Record<string, string>>
  ratingLabel: string
  colorsLabel: string
  benefits?: { title: string; items: readonly string[] }
  onSearch: (v: string) => void
  onCategory: (v: string) => void
  onSort: (v: ProductSort) => void
  onClear: () => void
  onColorToggle: (v: string) => void
  onRating: (v: number) => void
}

export function FilterSidebar({
  search,
  category,
  sort,
  categories,
  searchPlaceholder,
  allCategoriesLabel,
  sortLabel,
  newestSortLabel,
  priceLowSortLabel,
  priceHighSortLabel,
  clearLabel,
  selectedColors,
  selectedRatings,
  colorOptions,
  colorValues = {},
  ratingLabel,
  colorsLabel,
  benefits = {
    title: 'Shopping with us',
    items: ['Thoughtfully selected goods', 'Support when you need it', 'Secure checkout'],
  },
  onSearch,
  onCategory,
  onSort,
  onClear,
  onColorToggle,
  onRating,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeFilterCount = useMemo(
    () =>
      [
        search.trim().length > 0,
        category.length > 0,
        sort !== 'newest',
        selectedColors.length > 0,
        selectedRatings.length > 0,
      ].filter(Boolean).length,
    [search, category, sort, selectedColors.length, selectedRatings.length],
  )

  const filterFields = (
    <div className="grid gap-6">
      <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        <span>{searchPlaceholder}</span>
        <input
          className="min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal normal-case tracking-normal text-[var(--ink)] outline-none transition focus-visible:border-[var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]/20"
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>

      <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        <span>{allCategoriesLabel}</span>
        <span className="relative">
          <select
            className="min-h-11 w-full appearance-none rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 pr-10 text-sm font-normal normal-case tracking-normal text-[var(--ink)] outline-none transition focus-visible:border-[var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]/20"
            value={category}
            onChange={(event) => onCategory(event.target.value)}
          >
            <option value="">{allCategoriesLabel}</option>
            {categories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
          />
        </span>
      </label>

      <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        <span>{sortLabel}</span>
        <span className="relative">
          <select
            className="min-h-11 w-full appearance-none rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 pr-10 text-sm font-normal normal-case tracking-normal text-[var(--ink)] outline-none transition focus-visible:border-[var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]/20"
            value={sort}
            onChange={(event) => onSort(event.target.value as ProductSort)}
          >
            <option value="newest">{newestSortLabel}</option>
            <option value="price-low">{priceLowSortLabel}</option>
            <option value="price-high">{priceHighSortLabel}</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
          />
        </span>
      </label>

      <fieldset className="grid gap-3 border-0 p-0">
        <legend className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          {ratingLabel}
        </legend>
        {[5, 4, 3, 2, 1].map((rating) => (
          <label
            className="flex min-h-8 cursor-pointer items-center gap-3 text-sm text-[var(--ink)]"
            key={rating}
          >
            <input
              className="size-4 accent-[var(--green)]"
              type="checkbox"
              name="rating"
              checked={selectedRatings.includes(rating)}
              onChange={() => onRating(rating)}
            />
            <span>{rating === 5 ? '5 stars' : `${rating} to under ${rating + 1} stars`}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="grid gap-3 border-0 border-t border-[var(--line)] p-0 pt-5">
        <legend className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          {colorsLabel}
        </legend>
        {colorOptions.map((color) => {
          const hex = colorValues[color]
          const validHex = /^#[\da-f]{6}$/i.test(hex ?? '')
          return (
            <label
              className="flex min-h-8 cursor-pointer items-center gap-3 text-sm text-[var(--ink)]"
              key={color}
            >
              <input
                className="size-4 accent-[var(--green)]"
                type="checkbox"
                checked={selectedColors.includes(color)}
                onChange={() => onColorToggle(color)}
              />
              <span
                className="size-4 shrink-0 rounded-full border border-[var(--line)]"
                aria-hidden="true"
                style={validHex ? { backgroundColor: hex } : undefined}
              />
              <span className="min-w-0 truncate">
                {color} {validHex ? hex.toUpperCase() : '(swatch unavailable)'}
              </span>
            </label>
          )
        })}
      </fieldset>

      <div className="border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em]">{benefits.title}</p>
        <ul className="grid gap-2">
          {benefits.items.map((item) => (
            <li className="flex items-start gap-2" key={item}>
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--green)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className="sticky top-6 hidden h-fit max-h-[calc(100svh-3rem)] overflow-y-auto border-r border-[var(--line)] pr-6 md:block"
        aria-label="Catalog filters"
      >
        <div className="mb-6 flex min-h-11 items-center justify-between border-b border-[var(--line)] pb-4">
          <div
            className="text-xs font-semibold uppercase leading-4 tracking-[0.1em] text-[var(--ink)]"
            role="heading"
            aria-level={2}
          >
            Filter
          </div>
          {activeFilterCount > 0 && (
            <button
              className="inline-flex min-h-11 items-center gap-1.5 rounded px-1.5 text-xs font-medium normal-case tracking-normal text-[var(--green)] hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              type="button"
              onClick={onClear}
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              {clearLabel}
            </button>
          )}
        </div>
        {filterFields}
      </aside>

      <div className="mb-5 flex items-center justify-between gap-3 md:hidden">
        <>
            <Button
              variant="outlined"
              startIcon={<ListFilter aria-hidden="true" className="size-4" />}
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-[var(--ink)] text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            slotProps={{ paper: { sx: { width: 'min(22rem, calc(100vw - 24px))', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' } } }}
            aria-labelledby="catalog-filter-title"
          >
            <Box component="header" sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5, py: 2.5, pr: 8, position: 'relative' }}>
              <Typography id="catalog-filter-title" variant="h6">Filters</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Refine the collection to find what you need.</Typography>
              <IconButton aria-label="Close filters" onClick={() => setDrawerOpen(false)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ minHeight: 0, flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>{filterFields}</Box>
            <Box component="footer" sx={{ display: 'flex', gap: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 2 }}>
              {activeFilterCount > 0 && (
                <Button variant="outlined" fullWidth onClick={onClear} startIcon={<RotateCcw aria-hidden="true" className="size-4" />}>
                  {clearLabel}
                </Button>
              )}
              <Button variant="contained" fullWidth onClick={() => setDrawerOpen(false)}>Done</Button>
            </Box>
          </Drawer>
        </>
        {activeFilterCount > 0 && (
          <button
            className="min-h-11 rounded px-2 text-xs font-medium uppercase tracking-wide text-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            type="button"
            onClick={onClear}
          >
            {clearLabel}
          </button>
        )}
      </div>
    </>
  )
}
