import { useEffect, useRef, useState } from 'react'
import { apiFetch, LONG_RUNNING_API_TIMEOUT_MS } from '../api/http'
import { loadRazorpay, type PaymentWidget, type PaymentResult } from '../api/razorpay'
import { assertCurrentSession, sessionGeneration } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
export function OrderPayment({ orderId, onRefresh }: { orderId: string; onRefresh: () => void }) {
  const notify = useNotification(),
    lock = useRef(false),
    controller = useRef<AbortController | null>(null),
    widget = useRef<PaymentWidget | null>(null),
    verifying = useRef(false)
  const [pending, setPending] = useState(false)
  useEffect(
    () => () => {
      controller.current?.abort()
      widget.current?.close()
    },
    [],
  )
  async function pay() {
    if (lock.current) return
    lock.current = true
    setPending(true)
    const abort = new AbortController()
    controller.current = abort
    const generation = sessionGeneration()
    const release = () => {
      lock.current = false
      if (!abort.signal.aborted) setPending(false)
    }
    const fail = (error: unknown) => {
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        notify(
          error instanceof Error
            ? error
            : new Error('Payment could not be confirmed. Check your order status.'),
        )
        onRefresh()
      }
      release()
    }
    try {
      const Razorpay = await loadRazorpay()
      abort.signal.throwIfAborted()
      assertCurrentSession(generation)
      const response = await apiFetch('/api/payments/razorpay-order', {
        method: 'POST',
        signal: abort.signal,
        timeoutMs: LONG_RUNNING_API_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const body = (await response.json()) as {
        paymentOrderId?: string
        amount?: number
        currency?: string
        keyId?: string
        error?: { message?: string }
      }
      if (
        !response.ok ||
        !body.paymentOrderId ||
        !body.keyId ||
        !Number.isSafeInteger(body.amount) ||
        !body.currency
      )
        throw new Error(
          body.error?.message ?? 'Unable to start payment. Check your order before trying again.',
        )
      async function verify(result: PaymentResult) {
        if (verifying.current || abort.signal.aborted) return
        verifying.current = true
        try {
          assertCurrentSession(generation)
          const response = await apiFetch('/api/payments/razorpay-verify', {
            method: 'POST',
            signal: abort.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              razorpayOrderId: result.razorpay_order_id,
              razorpayPaymentId: result.razorpay_payment_id,
              signature: result.razorpay_signature,
            }),
          })
          const body = (await response.json()) as {
            verified?: boolean
            error?: { message?: string }
          }
          if (!response.ok || body.verified !== true)
            throw new Error(
              body.error?.message ??
                'Payment is not confirmed. Check the order status before paying again.',
            )
          if (!abort.signal.aborted) {
            notify('Payment confirmed.', 'success')
            onRefresh()
          }
          release()
        } catch (error) {
          fail(error)
        } finally {
          verifying.current = false
        }
      }
      widget.current = new Razorpay({
        key: body.keyId,
        amount: body.amount!,
        currency: body.currency,
        order_id: body.paymentOrderId,
        name: 'Gadgify',
        handler: (result) => void verify(result),
        modal: {
          ondismiss: () => {
            if (!verifying.current) {
              if (!abort.signal.aborted) {
                notify('Payment window closed. Check the order status before trying again.', 'info')
                onRefresh()
              }
              release()
            }
          },
        },
      })
      widget.current.on('payment.failed', () => {
        if (!abort.signal.aborted) {
          notify('Payment attempt failed. You can retry in the payment window or close it.')
          onRefresh()
        }
      })
      widget.current.open()
    } catch (error) {
      fail(error)
    }
  }
  return (
    <div>
      <button className="primary-button" disabled={pending} onClick={() => void pay()}>
        {pending ? 'Payment in progress…' : 'Pay with Razorpay'}
      </button>
      <p>
        Payment is complete only after confirmation. If interrupted, refresh this order before
        paying again.
      </p>
    </div>
  )
}
