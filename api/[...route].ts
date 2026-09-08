import categories from '../server/api/categories.js'
import health from '../server/api/health.js'
import adminAnalytics from '../server/api/admin/analytics.js'
import adminAudit from '../server/api/admin/audit.js'
import adminCategories from '../server/api/admin/categories.js'
import adminCustomers from '../server/api/admin/customers.js'
import adminMessages from '../server/api/admin/messages.js'
import adminOrders from '../server/api/admin/orders.js'
import adminPayments from '../server/api/admin/payments.js'
import adminProducts from '../server/api/admin/products.js'
import adminReturns from '../server/api/admin/returns.js'
import adminSettings from '../server/api/admin/settings.js'
import adminUpload from '../server/api/admin/upload.js'
import adminProduct from '../server/api/admin/products/[id].js'
import authLogin from '../server/api/auth/login.js'
import authLogout from '../server/api/auth/logout.js'
import authMe from '../server/api/auth/me.js'
import authMobileRequest from '../server/api/auth/mobile-request.js'
import authMobileVerify from '../server/api/auth/mobile-verify.js'
import authPasswordResetRequest from '../server/api/auth/password-reset-request.js'
import authPasswordReset from '../server/api/auth/password-reset.js'
import authSignup from '../server/api/auth/signup.js'
import authVerifyEmail from '../server/api/auth/verify-email.js'
import cart from '../server/api/cart/index.js'
import newsletterSubscribe from '../server/api/newsletter/subscribe.js'
import orders from '../server/api/orders/index.js'
import order from '../server/api/orders/[id].js'
import orderTracking from '../server/api/orders/[id]/tracking.js'
import razorpayOrder from '../server/api/payments/razorpay-order.js'
import razorpayVerify from '../server/api/payments/razorpay-verify.js'
import products from '../server/api/products/index.js'
import product from '../server/api/products/[id].js'
import reviewUpload from '../server/api/products/[id]/review-upload.js'
import reviews from '../server/api/products/[id]/reviews.js'
import myReview from '../server/api/products/[id]/reviews/mine.js'
import razorpayWebhook from '../server/api/webhooks/razorpay.js'
import wishlist from '../server/api/wishlist/index.js'

type RequestLike = { method?: string; body?: unknown; query?: Record<string, string | string[] | undefined>; headers?: Record<string, string | string[] | undefined>; url?: string }
type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => unknown; setHeader?: (name: string, value: string) => void }
type Handler = (request: any, response: any) => unknown

const routes: Record<string, Handler> = {
  categories, health,
  'admin/analytics': adminAnalytics, 'admin/audit': adminAudit, 'admin/categories': adminCategories, 'admin/customers': adminCustomers, 'admin/messages': adminMessages, 'admin/orders': adminOrders, 'admin/payments': adminPayments, 'admin/products': adminProducts, 'admin/returns': adminReturns, 'admin/settings': adminSettings, 'admin/upload': adminUpload,
  'auth/login': authLogin, 'auth/logout': authLogout, 'auth/me': authMe, 'auth/mobile-request': authMobileRequest, 'auth/mobile-verify': authMobileVerify, 'auth/password-reset-request': authPasswordResetRequest, 'auth/password-reset': authPasswordReset, 'auth/signup': authSignup, 'auth/verify-email': authVerifyEmail,
  cart, 'newsletter/subscribe': newsletterSubscribe, orders, 'payments/razorpay-order': razorpayOrder, 'payments/razorpay-verify': razorpayVerify, products, 'webhooks/razorpay': razorpayWebhook, wishlist
}

function pathSegments(request: RequestLike) {
  const wildcard = request.query?.route
  if (wildcard) {
    const route = Array.isArray(wildcard) ? wildcard.join('/') : wildcard
    return route.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment))
  }
  const raw = request.url ?? ''
  const pathname = raw.startsWith('http') ? new URL(raw).pathname : raw.split('?')[0]
  return pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map((segment) => decodeURIComponent(segment))
}

function findRoute(segments: string[]) {
  const key = segments.join('/')
  if (routes[key]) return { handler: routes[key], query: {} }
  if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 3) return { handler: adminProduct, query: { id: segments[2] } }
  if (segments[0] === 'orders' && segments.length === 2) return { handler: order, query: { id: segments[1] } }
  if (segments[0] === 'orders' && segments[2] === 'tracking' && segments.length === 3) return { handler: orderTracking, query: { id: segments[1] } }
  if (segments[0] === 'products' && segments.length === 2) return { handler: product, query: { id: segments[1] } }
  if (segments[0] === 'products' && segments.length === 3 && segments[2] === 'review-upload') return { handler: reviewUpload, query: { id: segments[1] } }
  if (segments[0] === 'products' && segments.length === 3 && segments[2] === 'reviews') return { handler: reviews, query: { id: segments[1] } }
  if (segments[0] === 'products' && segments.length === 4 && segments[2] === 'reviews' && segments[3] === 'mine') return { handler: myReview, query: { id: segments[1] } }
  return null
}

export default async function handler(request: RequestLike, response: ResponseLike) {
  const match = findRoute(pathSegments(request))
  if (!match) return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.' } })
  return await match.handler({ ...request, query: { ...(request.query ?? {}), ...match.query } }, response)
}
