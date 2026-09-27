import { useMemo } from 'react'
import { Check, ChevronDown, ListFilter, RotateCcw } from 'lucide-react'
import type { ProductSort } from '../api/storefront'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

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
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-raised)] px-4 text-sm font-medium text-[var(--ink)] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              type="button"
            >
              <ListFilter aria-hidden="true" className="size-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-[var(--ink)] text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent closeLabel="Close filters">
            <header className="border-b border-[var(--line)] px-5 pb-5 pr-16 pt-7">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription className="mt-2">
                Refine the collection to find what you need.
              </SheetDescription>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{filterFields}</div>
            <footer className="flex gap-3 border-t border-[var(--line)] bg-[var(--surface-raised)] p-4">
              {activeFilterCount > 0 && (
                <button
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--line)] px-4 text-sm font-medium text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                  type="button"
                  onClick={onClear}
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {clearLabel}
                </button>
              )}
              <SheetClose asChild>
                <button
                  className="min-h-11 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-white hover:bg-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                  type="button"
                >
                  Done
                </button>
              </SheetClose>
            </footer>
          </SheetContent>
        </Sheet>
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
