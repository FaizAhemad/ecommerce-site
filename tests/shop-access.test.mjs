import { test } from 'node:test'
import assert from 'node:assert/strict'
import { approvedShop, ownedShopProduct, ShopAccessError } from '../server/api/_lib/shop-access.ts'
test('missing, pending or unauthorized membership fails closed', async () => {
  const store = { $queryRaw: async () => [] }
  await assert.rejects(approvedShop(store, 'user-a', 'shop-b'), ShopAccessError)
  await assert.rejects(ownedShopProduct(store, 'user-a', 'shop-b', 'product-b'), ShopAccessError)
})
test('product query binds identity, shop and product separately and checks current membership', async () => {
  const store = { $queryRaw: async (strings, ...values) => {
    assert.deepEqual(values, ['product-a', 'shop-a', 'user-a'])
    const sql = strings.join('?')
    assert.match(sql, /m\."status" = 'ACTIVE'/)
    assert.match(sql, /s\."status" = 'APPROVED'/)
    assert.match(sql, /s\."isPlatform" = FALSE/)
    return [{ id: 'product-a', name: 'Mop', stock: 2, priceMinor: 10000, moderationStatus: 'DRAFT' }]
  } }
  assert.equal((await ownedShopProduct(store, 'user-a', 'shop-a', 'product-a')).id, 'product-a')
})
test('malformed scope is rejected before a query and database errors are not treated as access', async () => {
  const store = { $queryRaw: async () => { throw new Error('unavailable') } }
  await assert.rejects(approvedShop(store, '', 'shop'), ShopAccessError)
  await assert.rejects(approvedShop(store, 'user', 'shop'), /unavailable/)
})
