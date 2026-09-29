import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sessionLimits, sessionDeadline } from '../server/api/_lib/session-policy.ts'
test('customer and admin idle and absolute budgets', () => {
  assert.deepEqual(sessionLimits('CUSTOMER'), { idleMs: 1800000, absoluteMs: 43200000 })
  assert.deepEqual(sessionLimits('ADMIN'), { idleMs: 900000, absoluteMs: 43200000 })
})
test('legacy sessions cannot authenticate', () => {
  for (const role of ['ADMIN', 'CUSTOMER']) assert.equal(sessionDeadline({ createdAt: new Date(0), expiresAt: new Date(30 * 86400000), user: { role } }), 0)
})
test('exact idle and absolute expiry boundaries', () => {
  const session = { createdAt: new Date(0), expiresAt: new Date(900000), user: { role: 'ADMIN' } }
  assert.equal(sessionDeadline(session) > 899999, true)
  assert.equal(sessionDeadline(session) > 900000, false)
  assert.equal(sessionDeadline({ ...session, expiresAt: new Date(43200000) }), 43200000)
  assert.equal(sessionDeadline({ ...session, expiresAt: new Date(43200001) }), 0)
})
