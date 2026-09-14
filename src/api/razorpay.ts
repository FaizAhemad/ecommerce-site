export type PaymentResult = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}
type Options = {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  handler: (result: PaymentResult) => void
  modal: { ondismiss: () => void }
}
export type PaymentWidget = {
  open: () => void
  close: () => void
  on: (event: string, callback: () => void) => void
}
type Constructor = new (options: Options) => PaymentWidget
declare global {
  interface Window {
    Razorpay?: Constructor
  }
}
let loading: Promise<Constructor> | undefined
export function loadRazorpay(): Promise<Constructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (loading) return loading
  loading = new Promise<Constructor>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(
      () => finish(new Error('Payment window took too long to load.')),
      30000,
    )
    function finish(error?: Error) {
      window.clearTimeout(timer)
      script.onload = null
      script.onerror = null
      if (error) {
        script.remove()
        reject(error)
      } else if (window.Razorpay) resolve(window.Razorpay)
      else {
        script.remove()
        reject(new Error('Payment window is unavailable.'))
      }
    }
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => finish()
    script.onerror = () => finish(new Error('Unable to load the payment window. Please try again.'))
    document.head.appendChild(script)
  }).catch((error) => {
    loading = undefined
    throw error
  })
  return loading
}
