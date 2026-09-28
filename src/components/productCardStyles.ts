export const productGridClass =
  'catalog-product-grid [--product-card-min-width:230px] grid grid-cols-2 gap-x-3.5 gap-y-6 md:grid-cols-[repeat(auto-fill,minmax(min(100%,var(--product-card-min-width)),1fr))] md:gap-x-5 md:gap-y-8'

export const productCardClass =
  'group flex h-full min-w-0 w-full max-w-[260px] flex-col self-stretch justify-self-center rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-raised)] p-2 shadow-[0_5px_18px_rgba(36,42,35,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(40,49,59,0.25)] hover:shadow-[0_11px_24px_rgba(36,42,35,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yellow)]'

export const productMediaClass =
  'relative aspect-square overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-[#d8e2d5]'

export const productInfoClass = 'grid grid-cols-1 items-start gap-1.5 px-2 pb-1 pt-3'

export const productTitleRowClass = 'flex min-h-11 items-start gap-1.5'

export const productTitleClass =
  'line-clamp-2 min-w-0 flex-1 [overflow-wrap:anywhere] font-sans text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[var(--green)] sm:text-base'

export const productWishlistClass =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--line)] bg-transparent text-[21px] leading-none text-[var(--muted)] transition-colors hover:border-[rgba(213,47,69,0.32)] hover:text-[#d52f45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:animate-pulse disabled:cursor-not-allowed'

export const productRatingClass =
  'mx-2 my-1 flex min-h-7 w-fit max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-[rgba(215,225,208,0.42)] px-2 py-1 font-sans text-[10px] leading-tight text-[var(--ink)]'

export const productSwatchesClass =
  'mx-2 my-0.5 flex min-h-6 items-center gap-2 pb-1'

export const productPrimaryActionClass =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-xl border border-[var(--line)] bg-[rgba(215,225,208,0.58)] px-4 font-sans text-sm font-semibold normal-case tracking-[0.01em] text-[var(--ink)] shadow-[0_2px_0_rgba(37,40,33,0.08)] transition-all duration-200 hover:-translate-y-px hover:bg-[rgba(215,225,208,0.78)] hover:shadow-[0_4px_10px_rgba(37,40,33,0.1)] active:translate-y-0 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none'

export const productAddButtonLayoutClass = 'mx-2 mt-auto mb-2 w-[calc(100%-1rem)]'

export const productAddButtonClass =
  `${productPrimaryActionClass} ${productAddButtonLayoutClass}`
