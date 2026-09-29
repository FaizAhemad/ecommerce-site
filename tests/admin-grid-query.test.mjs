import assert from 'node:assert/strict'
import test from 'node:test'
import { AdminGridQueryError, parseAdminGridQuery } from '../server/api/_lib/admin-grid-query.ts'

const definition = {
  defaultSort: 'createdAt',
  sortFields: ['createdAt', 'name'],
  filters: {
    name: { type: 'text' },
    status: { type: 'enum', values: ['ACTIVE', 'ARCHIVED'] },
    price: { type: 'number' },
  },
}

function request(query) {
  return { query }
}

test('admin grid query applies bounded defaults and accepts server query controls', () => {
  assert.deepEqual(parseAdminGridQuery(request({}), definition), {
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: 'createdAt',
    sortDirection: 'desc',
    filters: {},
  })
  assert.deepEqual(parseAdminGridQuery(request({
    page: '3', pageSize: '25', search: ' lamp ', sortBy: 'name', sortDirection: 'asc',
    filter_name: 'light', filter_status: 'ACTIVE', filter_price: '12.50',
  }), definition), {
    page: 3,
    pageSize: 25,
    search: 'lamp',
    sortBy: 'name',
    sortDirection: 'asc',
    filters: { name: 'light', status: 'ACTIVE', price: '12.50' },
  })
})

test('admin grid query rejects unbounded or unsupported controls', () => {
  for (const query of [
    { page: '0' },
    { pageSize: '100' },
    { sortBy: 'email' },
    { sortDirection: 'random' },
    { filter_unknown: 'value' },
    { filter_status: 'PENDING' },
    { filter_price: '1e6' },
    { filter_name: ['one', 'two'] },
    { search: 'x'.repeat(121) },
  ]) {
    assert.throws(() => parseAdminGridQuery(request(query), definition), AdminGridQueryError)
  }
})
