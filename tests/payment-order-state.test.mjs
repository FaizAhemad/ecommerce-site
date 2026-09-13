import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Exercise real handlers with synthetic signed messages and an injected store. No .env/providers.
let revision = 0
async function invoke(kind, status, invalidSignature = false) {
  const fixture = { status, writes: 0 }
  globalThis.paymentStateFixture = {
    order: {
      findFirst: async () => ({
        id: 'order',
        status: fixture.status,
        payment: { providerOrderId: 'provider-order' },
      }),
      updateMany: async ({ where, data }) => {
        fixture.writes++
        if (where.status !== fixture.status) return { count: 0 }
        fixture.status = data.status
        return { count: 1 }
      },
    },
    payment: {
      update: async () => {
        fixture.writes++
        return { status: 'CAPTURED' }
      },
      updateMany: async () => {
        fixture.writes++
        return { count: 1 }
      },
    },
  }
  const file = kind === 'verify' ? 'payments/razorpay-verify.ts' : 'webhooks/razorpay.ts'
  let source = readFileSync(new URL(`../server/api/${file}`, import.meta.url), 'utf8')
    .replace("import { db } from '../_lib/db.js'", 'const db = globalThis.paymentStateFixture')
    .replace(
      "import { requireUser } from '../_lib/auth.js'",
      "const requireUser = async () => ({ id: 'synthetic-customer' })",
    )
    .replaceAll(
      "'../_lib/http.js'",
      JSON.stringify(new URL('../server/api/_lib/http.ts', import.meta.url).href),
    )
    .replace(/process\.env\.RAZORPAY_(KEY_SECRET|WEBHOOK_SECRET)/g, "'synthetic-signing-key'")
  source = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  }).outputText
  const handler = (
    await import(
      `data:text/javascript;base64,${Buffer.from(source + `\n// ${revision++}`).toString('base64')}`
    )
  ).default
  const signature = (text) =>
    createHmac('sha256', 'synthetic-signing-key').update(text).digest('hex')
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { order_id: 'provider-order', id: 'provider-payment' } } },
  })
  const request =
    kind === 'verify'
      ? {
          method: 'POST',
          body: {
            orderId: 'order',
            razorpayOrderId: 'provider-order',
            razorpayPaymentId: 'provider-payment',
            signature: signature('provider-order|provider-payment'),
          },
        }
      : { method: 'POST', body: payload, headers: { 'x-razorpay-signature': signature(payload) } }
  const response = {
    status(code) {
      fixture.httpStatus = code
      return this
    },
    json() {},
  }
  if (invalidSignature) {
    if (kind === 'verify') request.body.signature = 'invalid'
    else request.headers['x-razorpay-signature'] = 'invalid'
  }
  await handler(request, response)
  return fixture
}
for (const kind of ['verify', 'webhook']) {
  test(`${kind} rejects invalid signatures without database writes`, async () => {
    const result = await invoke(kind, 'PENDING', true)
    assert.equal(result.httpStatus, 400)
    assert.equal(result.status, 'PENDING')
    assert.equal(result.writes, 0)
  })
  for (const status of ['PENDING', 'CANCELLED', 'REFUNDED', 'SHIPPED']) {
    test(`${kind} capture confirms only pending orders and preserves ${status}`, async () => {
      const result = await invoke(kind, status)
      assert.equal(result.httpStatus, 200)
      assert.equal(result.status, status === 'PENDING' ? 'CONFIRMED' : status)
    })
  }
}
