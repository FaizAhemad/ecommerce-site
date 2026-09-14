import { useState } from 'react'
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
  const [mobileExpanded, setMobileExpanded] = useState(false)
  return (
    <aside
      className="filter-sidebar expanded"
      data-mobile-expanded={mobileExpanded}
      aria-label="Catalog filters"
    >
      <div className="filter-sidebar-heading">
        <p className="eyebrow">Filter</p>
        <button
          className="mobile-filter-toggle secondary-button"
          type="button"
          aria-expanded={mobileExpanded}
          aria-controls="catalog-filter-fields"
          onClick={() => setMobileExpanded((value) => !value)}
        >
          {mobileExpanded ? 'Hide filters' : 'Show filters'}
        </button>
        {Boolean(
          search ||
          category ||
          sort !== 'newest' ||
          selectedColors.length ||
          selectedRatings.length,
        ) && (
          <button className="clear-filters" type="button" onClick={onClear}>
            {clearLabel}
          </button>
        )}
      </div>
      <div className="filter-fields" id="catalog-filter-fields">
        <label className="filter-field">
          {searchPlaceholder}
          <input
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        <label className="filter-field">
          {allCategoriesLabel}
          <select value={category} onChange={(e) => onCategory(e.target.value)}>
            <option value="">{allCategoriesLabel}</option>
            {categories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          {sortLabel}
          <select value={sort} onChange={(e) => onSort(e.target.value as ProductSort)}>
            <option value="newest">{newestSortLabel}</option>
            <option value="price-low">{priceLowSortLabel}</option>
            <option value="price-high">{priceHighSortLabel}</option>
          </select>
        </label>
        <fieldset className="filter-group">
          <legend>{ratingLabel}</legend>
          {[5, 4, 3, 2, 1].map((r) => (
            <label className="check-option" key={r}>
              <input
                type="checkbox"
                name="rating"
                checked={selectedRatings.includes(r)}
                onChange={() => onRating(r)}
              />
              <span>{r === 5 ? '5 stars' : `${r} to under ${r + 1} stars`}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="filter-group">
          <legend>{colorsLabel}</legend>
          {colorOptions.map((c) => (
            <label className="check-option" key={c}>
              <input
                type="checkbox"
                checked={selectedColors.includes(c)}
                onChange={() => onColorToggle(c)}
              />
              <span
                className="color-swatch"
                aria-hidden="true"
                style={
                  /^#[\da-f]{6}$/i.test(colorValues[c] ?? '')
                    ? { backgroundColor: colorValues[c] }
                    : undefined
                }
              />
              <span>
                {c}{' '}
                {/^#[\da-f]{6}$/i.test(colorValues[c] ?? '')
                  ? colorValues[c].toUpperCase()
                  : '(swatch unavailable)'}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="filter-benefits">
          <p>{benefits.title}</p>
          <ul>
            {benefits.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
