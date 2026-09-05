export const appConfig = {
  identity: {
    appName: 'Field & Form',
    businessName: 'Field & Form',
    tagline: 'Useful objects, made to last.',
    mark: 'F',
  },
  contact: {
    supportEmail: 'support@example.com',
    phone: '+1 (000) 000-0000',
    social: { instagram: 'https://instagram.com', youtube: 'https://youtube.com', whatsapp: 'https://wa.me/10000000000', twitter: 'https://twitter.com', facebook: 'https://facebook.com' },
  },
  localization: {
    locale: 'en-IN',
    currency: 'INR',
  },
  branding: {
    primary: '#28313b',
    accent: '#c7d866',
  },
  features: {
    reviewsEnabled: true,
    returnsEnabled: true,
  },
  categories: ['Clothing', 'Sports', 'Home & Kitchen', 'Furniture', 'Footwear', 'Jewelry', 'Bags', 'Watches', 'Electronics', 'Toys'] as const,
} as const

export type ProductImage = { id: string; url: string; alt: string; isPrimary: boolean }
export type ProductVideo = { id: string; url: string; posterUrl?: string; alt: string }
export type CatalogProduct = {
  id: string
  name: string
  category: string
  price: number
  rating: number
  reviewCount: number
  tone: string
  badge: string
  colors?: readonly string[]
  media: { images: readonly ProductImage[]; videos: readonly ProductVideo[] }
}

const starterProducts = [
  {
    id: 'bag-01',
    name: 'Everyday Canvas Tote',
    category: 'Bags',
    price: 28,
    rating: 4.8,
    reviewCount: 124,
    tone: 'sage',
    badge: 'Best seller',
    media: { images: [{ id: 'bag-01-main', url: heroArt, alt: 'Everyday Canvas Tote', isPrimary: true }, { id: 'bag-01-detail', url: heroArt, alt: 'Everyday Canvas Tote detail', isPrimary: false }], videos: [] },
  },
  {
    id: 'bag-02',
    name: 'Compact Travel Crossbody',
    category: 'Bags',
    price: 42,
    rating: 4.6,
    reviewCount: 87,
    tone: 'rose',
    badge: 'New arrival',
    media: { images: [], videos: [] },
  },
  {
    id: 'toy-01',
    name: 'Wooden Stack-and-Balance Set',
    category: 'Toys',
    price: 24,
    rating: 4.9,
    reviewCount: 63,
    tone: 'clay',
    badge: 'Play favorite',
    media: { images: [], videos: [] },
  },
  {
    id: 'toy-02',
    name: 'Soft Build Block Set',
    category: 'Toys',
    price: 36,
    rating: 4.7,
    reviewCount: 41,
    tone: 'oak',
    badge: 'Screen-free play',
    media: { images: [], videos: [] },
  },
  {
    id: 'home-01',
    name: 'Extendable Mop Hanger',
    category: 'Home gadgets',
    price: 18,
    rating: 4.5,
    reviewCount: 96,
    tone: 'oak',
    badge: 'Space saver',
    media: { images: [], videos: [] },
  },
  {
    id: 'home-02',
    name: 'Multi-purpose Sink Caddy',
    category: 'Home gadgets',
    price: 16,
    rating: 4.4,
    reviewCount: 52,
    tone: 'sage',
    badge: 'Everyday essential',
    media: { images: [], videos: [] },
  },
  {
    id: 'home-03',
    name: 'Adjustable Drawer Organizer',
    category: 'Home gadgets',
    price: 22,
    rating: 4.6,
    reviewCount: 38,
    tone: 'clay',
    badge: 'Small-space pick',
    media: { images: [], videos: [] },
  },
  {
    id: 'home-04',
    name: 'Wool Loop Throw',
    category: 'Home gadgets',
    price: 58,
    rating: 4.8,
    reviewCount: 29,
    tone: 'oak',
    badge: 'Home comfort',
    media: { images: [], videos: [] },
  },
] satisfies readonly CatalogProduct[]

const fixtureColors = ['Black', 'White', 'Natural', 'Blue', 'Green', 'Rose', 'Brown'] as const

// Fixture volume for exercising the virtualized catalog. Production data will come from the API.
export const products = [...starterProducts, ...Array.from({ length: 16 }, (_, index) => {
  const source = starterProducts[index % starterProducts.length]
  return {
    ...source,
    id: `${source.id}-sample-${String(index + 1).padStart(3, '0')}`,
    name: `${appConfig.categories[index % appConfig.categories.length]} ${source.name} / Sample ${index + 1}`,
    category: appConfig.categories[index % appConfig.categories.length],
    price: source.price + (index % 7),
    colors: [fixtureColors[index % fixtureColors.length], fixtureColors[(index + 2) % fixtureColors.length]],
  }
})] satisfies readonly CatalogProduct[]
import heroArt from './assets/hero.png'
