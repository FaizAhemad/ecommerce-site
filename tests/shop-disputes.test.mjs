import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { disputeUpdate, publicDispute } from '../server/api/_lib/shop-disputes.ts'
const now = '2026-09-23T12:00:00.000Z'
const input = { action: 'support-open', requestId: '11111111-1111-4111-8111-111111111111', reason: 'Item arrived damaged', expectedVersion: 0 }

test('duplicate messages are idempotent and bound to author and exact content', () => {
  const first = disputeUpdate(null, input, 'customer', 'customer-a', now)
  assert.equal(disputeUpdate(first, input, 'customer', 'customer-a', now), first)
  assert.throws(() => disputeUpdate(first, input, 'seller', 'seller-a', now), { status: 409 })
  assert.throws(() => disputeUpdate(first, { ...input, reason: 'Different message' }, 'customer', 'customer-a', now), { status: 409 })
  assert.equal(publicDispute(first).messages[0].actorId, undefined)
})
test('only admin can resolve; stale decisions and closed-conversation replies fail', () => {
  const first = disputeUpdate(null, input, 'customer', 'customer-a', now)
  const decision = { ...input, action: 'support-resolve', requestId: '22222222-2222-4222-8222-222222222222', expectedVersion: 1 }
  assert.throws(() => disputeUpdate(first, decision, 'seller', 'seller-a', now), { status: 403 })
  assert.throws(() => disputeUpdate(first, { ...decision, expectedVersion: 0 }, 'admin', 'admin-a', now), { status: 409 })
  const resolved = disputeUpdate(first, decision, 'admin', 'admin-a', now)
  assert.equal(resolved.status, 'RESOLVED')
  assert.throws(() => disputeUpdate(resolved, { ...decision, action: 'support-reply', requestId: '33333333-3333-4333-8333-333333333333', expectedVersion: 2 }, 'customer', 'customer-a', now), { status: 409 })
})
test('seller can escalate without claiming a financial outcome', () => {
  const first = disputeUpdate(null, input, 'customer', 'customer-a', now)
  const next = disputeUpdate(first, { ...input, action: 'support-escalate', requestId: '22222222-2222-4222-8222-222222222222', expectedVersion: 1 }, 'seller', 'seller-a', now)
  assert.equal(next.status, 'ESCALATED')
  assert.deepEqual(Object.keys(next).sort(), ['messages', 'status', 'version'])
})
test('support destination stays server-only and reserved disputes cannot use Settings', () => {
  const api = readFileSync(new URL('../server/api/support.ts', import.meta.url), 'utf8')
  assert.match(api, /destination = process.env.SUPPORT_EMAIL/)
  assert.doesNotMatch(api, /json\(\{[^}]*destination/)
  const settings = readFileSync(new URL('../server/api/admin/settings.ts', import.meta.url), 'utf8')
  assert.match(settings, /'shop-dispute\.'/)
  const page = readFileSync(new URL('../src/pages/SupportPage.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(page, /SUPPORT_EMAIL|mailto:/)
})
