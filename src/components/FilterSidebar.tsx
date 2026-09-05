import { useState } from 'react'
import type { ProductSort } from '../api/storefront'

type FilterSidebarProps = {
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
  collapseLabel: string
  expandLabel: string
  onSearch: (value: string) => void
  onCategory: (value: string) => void
  onSort: (value: ProductSort) => void
  onClear: () => void
  selectedColors: readonly string[]
  minRating: number
  colorOptions: readonly string[]
  ratingLabel: string
  colorsLabel: string
  onColorToggle: (color: string) => void
  onRating: (rating: number) => void
}

export function FilterSidebar({ search, category, sort, categories, searchPlaceholder, allCategoriesLabel, sortLabel, newestSortLabel, priceLowSortLabel, priceHighSortLabel, clearLabel, collapseLabel, expandLabel, selectedColors, minRating, colorOptions, ratingLabel, colorsLabel, onSearch, onCategory, onSort, onClear, onColorToggle, onRating }: FilterSidebarProps) {
  const [expanded, setExpanded] = useState(() => !window.matchMedia('(max-width: 760px)').matches)
  const hasFilters = Boolean(search || category || sort !== 'newest' || selectedColors.length || minRating)
  return <aside className={expanded ? 'filter-sidebar expanded' : 'filter-sidebar'} aria-label="Catalog filters"><div className="filter-sidebar-heading"><p className="eyebrow">Filter</p><div className="filter-sidebar-actions">{hasFilters && <button className="clear-filters" type="button" onClick={onClear}>{clearLabel}</button>}<button className="filter-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? collapseLabel : expandLabel}</button></div></div>{expanded && <div className="filter-fields"><label className="filter-field">{searchPlaceholder}<input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder={searchPlaceholder} /></label><label className="filter-field">{allCategoriesLabel}<select value={category} onChange={(event) => onCategory(event.target.value)}><option value="">{allCategoriesLabel}</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label className="filter-field">{sortLabel}<select value={sort} onChange={(event) => onSort(event.target.value as ProductSort)}><option value="newest">{newestSortLabel}</option><option value="price-low">{priceLowSortLabel}</option><option value="price-high">{priceHighSortLabel}</option></select></label><fieldset className="filter-group"><legend>{ratingLabel}</legend>{[4, 3, 2].map((rating) => <label className="check-option" key={rating}><input type="radio" name="rating" checked={minRating === rating} onChange={() => onRating(rating)} /> <span>{rating}+ ★</span></label>)}</fieldset><fieldset className="filter-group"><legend>{colorsLabel}</legend>{colorOptions.map((color) => <label className="check-option" key={color}><input type="checkbox" checked={selectedColors.includes(color)} onChange={() => onColorToggle(color)} /> <span className={`color-swatch color-${color.toLowerCase()}`} /> <span>{color}</span></label>)}</fieldset></div>}</aside>
}
