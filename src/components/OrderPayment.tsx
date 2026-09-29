import { useEffect, useRef, useState } from 'react'
import { apiFetch, LONG_RUNNING_API_TIMEOUT_MS } from '../api/http'
import { loadRazorpay, type PaymentWidget, type PaymentResult, type PaymentFailure } from '../api/razorpay'
import { assertCurrentSession, sessionGeneration } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { CreditCard } from 'lucide-react'
export function OrderPayment({ orderId, onRefresh }: { orderId: string; onRefresh: () => void }) {
  const notify = useNotification(),
    lock = useRef(false),
    controller = useRef<AbortController | null>(null),
    widget = useRef<PaymentWidget | null>(null),
    verifying = useRef(false),
    dismissed = useRef(false)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState('')
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
    dismissed.current = false
    setPending(true)
    setFeedback('Opening secure payment...')
    const abort = new AbortController()
    controller.current = abort
    const generation = sessionGeneration()
    const release = () => {
      lock.current = false
      if (!abort.signal.aborted && generation === sessionGeneration()) setPending(false)
    }
    const fail = (error: unknown) => {
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        setFeedback(error instanceof Error ? error.message : 'Payment could not be confirmed. Refresh your order before paying again.')
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
        if (generation === sessionGeneration()) setFeedback('Verifying payment with the server...')
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
            payment?: { status?: string }
            orderStatus?: string
            error?: { message?: string }
          }
          if (!response.ok || body.verified !== true)
            throw new Error(
              body.error?.message ??
                'Payment is not confirmed. Check the order status before paying again.',
            )
          if (!abort.signal.aborted && generation === sessionGeneration()) {
            const terminalOrder = ['CANCELLED', 'REFUNDED'].includes(body.orderStatus ?? '')
            const message = body.payment?.status === 'CAPTURED'
              ? terminalOrder
                ? 'Payment was captured, but this order is no longer active. Do not pay again; contact customer care for help.'
                : 'Payment received and verified. Your order status has been updated.'
              : terminalOrder
                ? 'Payment is authorized but this order is no longer active. Do not pay again; contact customer care for help.'
                : 'Payment is authorized and awaiting capture. Your order is not confirmed yet. Refresh shortly, and do not pay again while this status is pending.'
            setFeedback(message)
            notify(message, body.payment?.status === 'CAPTURED' ? 'success' : 'info')
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
            if (verifying.current) {
              dismissed.current = true
            } else {
              if (!abort.signal.aborted && generation === sessionGeneration()) {
                setFeedback('Payment window closed. Refresh your order before paying again.')
                notify('Payment window closed. Check the order status before trying again.', 'info')
                onRefresh()
              }
              release()
            }
          },
        },
      })
      widget.current.on('payment.failed', (failure: PaymentFailure) => {
        if (verifying.current || abort.signal.aborted || generation !== sessionGeneration()) return
        verifying.current = true
        void (async () => {
          const paymentId = failure.error?.metadata?.payment_id
          const fallback = 'We could not confirm this payment attempt. Your order status has not changed. Refresh the order before trying again. If your bank shows a debit, wait for the status to update before retrying.'
          try {
            if (!paymentId) throw new Error(fallback)
            assertCurrentSession(generation)
            const response = await apiFetch('/api/payments/razorpay-failure', {
              method: 'POST',
              signal: abort.signal,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId, razorpayOrderId: body.paymentOrderId, razorpayPaymentId: paymentId }),
            })
            const result = await response.json() as { verified?: boolean; payment?: { status?: string }; orderStatus?: string; error?: { message?: string } }
            if (!response.ok || result.verified !== true)
              throw new Error(result.error?.message ?? fallback)
            if (abort.signal.aborted || generation !== sessionGeneration()) return
            const terminalOrder = ['CANCELLED', 'REFUNDED'].includes(result.orderStatus ?? '')
            const message = result.payment?.status === 'CAPTURED'
              ? terminalOrder
                ? 'Payment was captured, but this order is no longer active. Do not pay again; contact customer care for help.'
                : 'Payment received and verified. Your order status has been updated.'
              : result.payment?.status === 'AUTHORIZED'
                ? terminalOrder
                  ? 'Payment is authorized but this order is no longer active. Do not pay again; contact customer care for help.'
                  : 'Payment is authorized and awaiting capture. Your order is not confirmed yet. Refresh shortly, and do not pay again while this status is pending.'
                : 'This payment attempt could not be completed. Your order is still awaiting payment, so you may try again. If your bank shows a debit, check with your bank before retrying.'
            setFeedback(message)
            notify(message, result.payment?.status === 'CAPTURED' ? 'success' : 'info')
            onRefresh()
          } catch (error) {
            if (!abort.signal.aborted && generation === sessionGeneration()) {
              const message = error instanceof Error ? error.message : fallback
              setFeedback(message)
              notify(message, 'info')
              onRefresh()
            }
          } finally {
            verifying.current = false
            if (dismissed.current) release()
          }
        })()
      })
      widget.current.open()
    } catch (error) {
      fail(error)
    }
  }
  return (
    <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 sm:p-5">
      <p className="mb-3 text-sm leading-6 text-[var(--muted)]">Continue with Razorpay to pay for this order. Your order changes to paid only after the server confirms the payment.</p>
      <button className="primary-button flex w-full items-center justify-center gap-2" disabled={pending} onClick={() => void pay()}>
        <CreditCard aria-hidden="true" className="size-4" />
        {pending ? 'Payment in progress' : 'Continue to Razorpay'}
      </button>
      {feedback && <p className="mb-0 mt-3 rounded-lg bg-[var(--paper)] p-3 text-sm leading-6 text-[var(--ink)]" role="status" aria-live="polite">{feedback}</p>}
      <p className="mb-0 mt-3 text-xs leading-5 text-[var(--muted)]">
        If the payment window closes or the result is unclear, refresh this order before trying again.
      </p>
    </div>
  )
}
