import { appConfig, products, type CatalogProduct } from '../config'

export type StorefrontProduct = CatalogProduct

export type ProductSort = 'newest' | 'price-low' | 'price-high'
export type ProductQuery = { cursor?: string; search?: string; category?: string; sort?: ProductSort; colors?: readonly string[]; minRating?: number }
export type ProductPage = { products: readonly StorefrontProduct[]; nextCursor: string | null }

export type StorefrontApiResponse = {
  identity: typeof appConfig.identity
  contact: typeof appConfig.contact
  localization: typeof appConfig.localization
  branding: typeof appConfig.branding
  features: typeof appConfig.features
  categories: typeof appConfig.categories
  facets: { categories: readonly string[]; colors: readonly string[]; ratings: readonly number[]; price: { min: number; max: number } }
  content: {
    ui: {
      loadingLabel: string
      unavailableLabel: string
      bagLabel: string
      bagItemLabel: string
      homeLabel: string
      copyrightPrefix: string
    }
    navigation: {
      shop: string
      support: string
    }
    hero: {
      eyebrow: string
      title: string
      description: string
      actionLabel: string
      artworkLabel: string
      artworkDescription: string
    }
    promotions: readonly { eyebrow: string; title: string; description: string; artwork: string }[]
    filterBenefits: { title: string; items: readonly string[] }
    collection: {
      eyebrow: string
      title: string
      description: string
      addToBagLabel: string
      ratingLabel: string
      reviewsLabel: string
      searchPlaceholder: string
      allCategoriesLabel: string
      noResultsLabel: string
      loadingMoreLabel: string
      catalogEndLabel: string
      catalogEndActionLabel: string
      sortLabel: string
      newestSortLabel: string
      priceLowSortLabel: string
      priceHighSortLabel: string
      clearFiltersLabel: string
      collapseFiltersLabel: string
      expandFiltersLabel: string
      colorsFilterLabel: string
      carouselPreviousLabel: string
      carouselNextLabel: string
    }
    story: {
      eyebrow: string
      title: string
      description: string
    }
    support: {
      title: string
      description: string
    }
    bag: {
      title: string
      emptyDescription: string
      continueShoppingLabel: string
    }
    detail: {
      imagesLabel: string
      videosLabel: string
      noMediaLabel: string
    }
    reviews: {
      title: string
      ratingLabel: string
      commentLabel: string
      commentPlaceholder: string
      submitLabel: string
      successLabel: string
    }
    policies: {
      privacyTitle: string
      returnsTitle: string
      missingContentLabel: string
      missingContentStatus: string
      missingContentAction: string
      backToHomeLabel: string
    }
    footer: {
      customerCareLabel: string
      policiesLabel: string
      privacyLabel: string
      returnsLabel: string
      copyrightYear: number
    }
  }
  products: readonly StorefrontProduct[]
}

// Temporary local adapter. Replace this function with the HTTP client when the API is available.
export async function getStorefront(): Promise<StorefrontApiResponse> {
  return {
    ...appConfig,
    facets: { categories: [...new Set(products.map((product) => product.category))], colors: [...new Set(products.flatMap((product) => (product as CatalogProduct).colors ?? []))], ratings: [5, 4, 3, 2, 1], price: { min: Math.min(...products.map((product) => product.price)), max: Math.max(...products.map((product) => product.price)) } },
    content: {
      ui: {
        loadingLabel: 'Loading storefront',
        unavailableLabel: 'Storefront unavailable',
        bagLabel: 'Cart',
        bagItemLabel: 'items',
        homeLabel: 'home',
        copyrightPrefix: '©',
      },
      navigation: {
        shop: 'Shop',
        support: 'Support',
      },
      hero: {
        eyebrow: 'Thoughtfully sourced / everyday use',
        title: 'Objects with a quiet point of view.',
        description: 'Explore considered goods for slower mornings, clearer desks, and homes that feel like yours.',
        actionLabel: 'Explore the collection',
        artworkLabel: 'FORM / 01',
        artworkDescription: 'Still life of a cup, book, and ceramic vase',
      },
      promotions: [
        { eyebrow: 'Featured edit', title: 'Small details, better days.', description: 'Explore useful pieces selected for everyday rituals.', artwork: 'sage' },
        { eyebrow: 'New in the collection', title: 'Made to move with you.', description: 'Discover considered essentials for every part of your day.', artwork: 'clay' },
        { eyebrow: 'Seasonal favorites', title: 'A little more considered.', description: 'Find timeless shapes and quietly useful design.', artwork: 'oak' },
      ],
      filterBenefits: { title: 'Shopping with us', items: ['Thoughtfully selected goods', 'Support when you need it', 'Secure checkout'] },
      collection: {
        eyebrow: 'The collection',
        title: 'Made for the daily ritual',
        description: 'Small runs. Natural materials. Nothing extra.',
        addToBagLabel: 'Add to cart',
        ratingLabel: 'Rating',
        reviewsLabel: 'reviews',
        searchPlaceholder: 'Search the collection',
        allCategoriesLabel: 'All categories',
        noResultsLabel: 'No products match these filters.',
        loadingMoreLabel: 'Loading more products',
        catalogEndLabel: 'You have reached the end of the collection.',
        catalogEndActionLabel: 'Back to top',
        sortLabel: 'Sort products',
        newestSortLabel: 'Newest',
        priceLowSortLabel: 'Price: low to high',
        priceHighSortLabel: 'Price: high to low',
        clearFiltersLabel: 'Clear filters',
        collapseFiltersLabel: 'Collapse',
        expandFiltersLabel: 'Expand',
        colorsFilterLabel: 'Color',
        carouselPreviousLabel: 'Previous products',
        carouselNextLabel: 'Next products',
      },
      story: {
        eyebrow: 'A little more intentional',
        title: 'Good things earn their place.',
        description: 'We look for honest materials, useful shapes, and makers who care about the details you notice every day. Every item is chosen to be used, loved, and kept.',
      },
      support: {
        title: 'We are here to help.',
        description: 'Reach the configured support team through the available support channels. Business hours, FAQs, and order assistance can be supplied by the API when available.',
      },
      bag: {
        title: 'Your cart',
        emptyDescription: 'Your selected products will appear here.',
        continueShoppingLabel: 'Continue shopping',
      },
      detail: {
        imagesLabel: 'Product images',
        videosLabel: 'Product videos',
        noMediaLabel: 'Product media will appear here when supplied by the business.',
      },
      reviews: {
        title: 'Share your experience',
        ratingLabel: 'Your rating',
        commentLabel: 'Your review',
        commentPlaceholder: 'Tell other customers what you think about this product.',
        submitLabel: 'Submit review',
        successLabel: 'Thank you. Your review has been submitted for moderation.',
      },
      policies: {
        privacyTitle: 'Privacy Policy',
        returnsTitle: 'Return Policy',
        missingContentLabel: 'Business input required',
        missingContentStatus: 'Approved policy content has not been supplied.',
        missingContentAction: 'The business owner must provide and review the approved policy content before launch.',
        backToHomeLabel: 'Back to home',
      },
      footer: {
        customerCareLabel: 'Customer care',
        policiesLabel: 'Policies',
        privacyLabel: 'Privacy',
        returnsLabel: 'Returns',
        copyrightYear: 2026,
      },
    },
    products,
  }
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const normalizedSearch = query.search?.trim().toLowerCase()
  const filtered = products.filter((product) => {
    const matchesSearch = !normalizedSearch || `${product.name} ${product.category}`.toLowerCase().includes(normalizedSearch)
    const matchesCategory = !query.category || product.category === query.category
    const productColors = (product as CatalogProduct).colors
    const matchesColor = !query.colors?.length || query.colors.some((color) => productColors?.includes(color))
    const matchesRating = !query.minRating || product.rating >= query.minRating
    return matchesSearch && matchesCategory && matchesColor && matchesRating
  })
  const sorted = [...filtered].sort((left, right) => query.sort === 'price-low' ? left.price - right.price : query.sort === 'price-high' ? right.price - left.price : right.id.localeCompare(left.id))
  return { products: sorted, nextCursor: null }
}

export async function getProduct(id: string): Promise<StorefrontProduct | null> {
  return products.find((product) => product.id === id) ?? null
}
