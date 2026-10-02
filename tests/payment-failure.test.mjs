import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

globalThis.fetch = async () => {
  throw new Error('Network is forbidden in offline payment tests')
}

let revision = 0
async function invoke({ orderStatus = 'PENDING', paymentStatus = 'PENDING', providerPayment } = {}) {
  const fixture = {
    orderStatus,
    paymentStatus,
    writes: 0,
    providerPayment: providerPayment ?? {
      id: 'pay_attempt1', order_id: 'order_provider1', amount: 1250, currency: 'INR', status: 'failed',
    },
  }
  const db = {
    order: {
      findFirst: async ({ where }) => {
        assert.deepEqual(where, { id: 'order_db_1', userId: 'customer_1' })
        return {
          id: 'order_db_1', status: fixture.orderStatus, totalMinor: 1250, currency: 'INR',
          payment: { provider: 'RAZORPAY', providerOrderId: 'order_provider1', amountMinor: 1250, status: fixture.paymentStatus },
        }
      },
      updateMany: async ({ where, data }) => {
        fixture.writes++
        if (where.status && where.status !== fixture.orderStatus) return { count: 0 }
        fixture.orderStatus = data.status
        return { count: 1 }
      },
    },
    payment: {
      updateMany: async ({ where, data }) => {
        fixture.writes++
        if (where.orderId !== 'order_db_1' || where.providerOrderId !== 'order_provider1' || (where.amountMinor !== undefined && where.amountMinor !== 1250)) return { count: 0 }
        if (where.order?.status && fixture.orderStatus !== where.order.status) return { count: 0 }
        const allowed = where.status?.in
        if (allowed && !allowed.includes(fixture.paymentStatus)) return { count: 0 }
        if (where.status?.not === 'REFUNDED' && fixture.paymentStatus === 'REFUNDED') return { count: 0 }
        fixture.paymentStatus = data.status
        return { count: 1 }
      },
    },
    $executeRaw: async () => 0,
    $transaction: async (action) => action(db),
  }
  globalThis.paymentFailureTest = { db, fixture }
  let source = readFileSync(new URL('../server/api/payments/razorpay-failure.ts', import.meta.url), 'utf8')
    .replace("import { db } from '../_lib/db.js'", 'const db = globalThis.paymentFailureTest.db')
    .replace("import { requireUser } from '../_lib/auth.js'", "const requireUser = async () => ({ id: 'customer_1' })")
    .replace(
      /import\s*\{[^}]*\}\s*from ['"]\.\.\/\_lib\/payment-confirmation\.js['"]?/,
      `import { matchesAuthorizedPayment, matchesCapturedPayment, matchesFailedPayment, recordAuthorizedPayment, recordCapturedPayment, recordFailedPayment } from ${JSON.stringify(new URL('../server/api/_lib/payment-confirmation.ts', import.meta.url).href)}; const fetchPayment = async () => globalThis.paymentFailureTest.fixture.providerPayment`,
    )
    .replaceAll("'../_lib/http.js'", JSON.stringify(new URL('../server/api/_lib/http.ts', import.meta.url).href))
    .replace(/process\.env\.RAZORPAY_(KEY_SECRET|KEY_ID)/g, "'synthetic-key'")
  source = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  const handler = (await import(`data:text/javascript;base64,${Buffer.from(source + `\n// ${revision++}`).toString('base64')}`)).default
  const response = {
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    setHeader() {},
  }
  await handler({
    method: 'POST',
    body: { orderId: 'order_db_1', razorpayOrderId: 'order_provider1', razorpayPaymentId: 'pay_attempt1' },
  }, response)
  return { ...fixture, response }
}

test('verified failed attempt becomes Payment not completed while the order stays awaiting payment', async () => {
  const result = await invoke()
  assert.equal(result.response.statusCode, 200, JSON.stringify(result.response.body))
  assert.deepEqual(result.response.body.payment, { status: 'FAILED' })
  assert.equal(result.paymentStatus, 'FAILED')
  assert.equal(result.orderStatus, 'PENDING')
  assert.equal(result.writes, 1)
})

test('provider authorization remains pending and does not turn into a failed payment', async () => {
  const result = await invoke({ providerPayment: {
    id: 'pay_attempt1', order_id: 'order_provider1', amount: 1250, currency: 'INR', status: 'authorized',
  } })
  assert.equal(result.response.statusCode, 200)
  assert.equal(result.response.body.payment.status, 'AUTHORIZED')
  assert.equal(result.paymentStatus, 'AUTHORIZED')
  assert.equal(result.orderStatus, 'PENDING')
  assert.equal(result.writes, 1)
})

test('authorized attempt updates payment only and can later be replaced by a verified capture', async () => {
  const authorized = await invoke({ providerPayment: {
    id: 'pay_attempt1', order_id: 'order_provider1', amount: 1250, currency: 'INR', status: 'authorized',
  } })
  assert.equal(authorized.response.statusCode, 200)
  assert.equal(authorized.paymentStatus, 'AUTHORIZED')
  assert.equal(authorized.orderStatus, 'PENDING')
  const captured = await invoke({ paymentStatus: 'FAILED', providerPayment: {
    id: 'pay_attempt1', order_id: 'order_provider1', amount: 1250, currency: 'INR', status: 'captured',
  } })
  assert.equal(captured.response.statusCode, 200)
  assert.equal(captured.paymentStatus, 'CAPTURED')
  assert.equal(captured.orderStatus, 'CONFIRMED')
})

test('a failure callback reconciles a captured provider payment instead of downgrading it', async () => {
  const result = await invoke({ providerPayment: {
    id: 'pay_attempt1', order_id: 'order_provider1', amount: 1250, currency: 'INR', status: 'captured',
  } })
  assert.equal(result.response.statusCode, 200)
  assert.deepEqual(result.response.body.payment, { status: 'CAPTURED' })
  assert.equal(result.paymentStatus, 'CAPTURED')
  assert.equal(result.orderStatus, 'CONFIRMED')
  assert.equal(result.writes, 2)
})

test('mismatched provider identity/amount/currency and terminal orders never change status', async () => {
  for (const changed of [
    { id: 'pay_other' }, { order_id: 'order_other' }, { amount: 1251 }, { currency: 'USD' },
  ]) {
    const result = await invoke({ providerPayment: {
      id: 'pay_attempt1', order_id: 'order_provider1', amount: 1250, currency: 'INR', status: 'failed', ...changed,
    } })
    assert.equal(result.response.statusCode, 409)
    assert.equal(result.paymentStatus, 'PENDING')
    assert.equal(result.orderStatus, 'PENDING')
    assert.equal(result.writes, 0)
  }
  const terminal = await invoke({ orderStatus: 'CANCELLED' })
  assert.equal(terminal.response.statusCode, 200)
  assert.equal(terminal.paymentStatus, 'FAILED')
  assert.equal(terminal.orderStatus, 'CANCELLED')
  assert.equal(terminal.writes, 1)
  const refunded = await invoke({ orderStatus: 'REFUNDED', paymentStatus: 'REFUNDED' })
  assert.equal(refunded.response.statusCode, 409)
  assert.equal(refunded.paymentStatus, 'REFUNDED')
  assert.equal(refunded.orderStatus, 'REFUNDED')
  assert.equal(refunded.writes, 0)
})
