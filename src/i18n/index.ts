import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from './locales/en/common.json'
import cart from './locales/en/cart.json'
import products from './locales/en/products.json'
import wishlist from './locales/en/wishlist.json'
import hiCommon from './locales/hi/common.json'
import hiCart from './locales/hi/cart.json'
import hiProducts from './locales/hi/products.json'
import hiWishlist from './locales/hi/wishlist.json'
import mrCommon from './locales/mr/common.json'
import mrCart from './locales/mr/cart.json'
import mrProducts from './locales/mr/products.json'
import mrWishlist from './locales/mr/wishlist.json'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'hi', 'mr'],
  interpolation: { escapeValue: false },
  resources: { en: { common, cart, products, wishlist }, hi: { common: hiCommon, cart: hiCart, products: hiProducts, wishlist: hiWishlist }, mr: { common: mrCommon, cart: mrCart, products: mrProducts, wishlist: mrWishlist } },
})

export default i18n
