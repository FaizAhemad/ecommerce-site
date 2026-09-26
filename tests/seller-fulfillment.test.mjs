import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fulfillmentTransition, returnTransition, usesScopedFulfillment, canManageScopedFulfillment } from '../server/api/_lib/seller-fulfillment.ts'

test('shipment lifecycle cannot skip packing, reverse delivery or change financial status', () => {
  assert.equal(fulfillmentTransition('PENDING', 'PACKING'), true)
  assert.equal(fulfillmentTransition('PACKING', 'SHIPPED'), true)
  assert.equal(fulfillmentTransition('SHIPPED', 'DELIVERED'), true)
  for (const [from, to] of [['PENDING','DELIVERED'], ['DELIVERED','SHIPPED'], ['CANCELLED','PACKING'], ['PACKING','REFUNDED'], ['PENDING','CAPTURED']])
    assert.equal(fulfillmentTransition(from, to), false)
})

test('customers can withdraw pending returns but cannot approve or receive them', () => {
  assert.equal(returnTransition('REQUESTED', 'CANCELLED', true), true)
  for (const state of ['APPROVED','REJECTED','RECEIVED','REFUNDED'])
    assert.equal(returnTransition('REQUESTED', state, true), false)
  assert.equal(returnTransition('APPROVED', 'CANCELLED', true), false)
})

test('shop review requires approval before receipt and never implies refund', () => {
  assert.equal(returnTransition('REQUESTED', 'APPROVED', false), true)
  assert.equal(returnTransition('REQUESTED', 'REJECTED', false), true)
  assert.equal(returnTransition('APPROVED', 'RECEIVED', false), true)
  for (const [from, to] of [['REQUESTED','RECEIVED'], ['REJECTED','APPROVED'], ['RECEIVED','REFUNDED'], ['CANCELLED','APPROVED']])
    assert.equal(returnTransition(from, to, false), false)
})

test('platform-only commerce retains legacy handling; mixed platform items require admin', () => {
  const legacy = { isPlatform: true, hasExternalShop: false }
  const mixed = { isPlatform: true, hasExternalShop: true }
  const external = { isPlatform: false, hasExternalShop: true }
  assert.equal(usesScopedFulfillment(legacy), false)
  assert.equal(usesScopedFulfillment(mixed), true)
  for (const audience of ['admin', 'seller', 'customer'])
    assert.equal(canManageScopedFulfillment(legacy, audience), false)
  assert.equal(canManageScopedFulfillment(mixed, 'admin'), true)
  assert.equal(canManageScopedFulfillment(mixed, 'seller'), false)
  assert.equal(canManageScopedFulfillment(mixed, 'customer'), false)
  assert.equal(canManageScopedFulfillment(external, 'seller'), true)
  assert.equal(canManageScopedFulfillment(external, 'customer'), false)
})
