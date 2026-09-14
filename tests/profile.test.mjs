import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import {
  addressInput,
  profileInput,
  mutateAddress,
  ProfileError,
} from '../server/api/_lib/profile.ts'
import { rateLimitRule } from '../server/api/_lib/rate-limit.ts'
import { profileRequest } from '../src/api/profile.ts'
import { clearCsrfToken } from '../src/api/csrf.ts'
import { changeSession } from '../src/api/sessionScope.ts'
import * as http from '../server/api/_lib/http.ts'
import * as profile from '../server/api/_lib/profile.ts'

const draft = {
  name: 'Synthetic Customer',
  line1: 'Test street',
  city: 'Test city',
  state: 'Test state',
  postalCode: '123456',
  country: 'IN',
  phone: '+919999999999',
}
test('profile/address validation allowlists fields and rejects malformed/oversized inputs', () => {
  assert.deepEqual(profileInput({ name: ' Name ', phone: '', role: 'ADMIN', email: 'ignored' }), {
    name: 'Name',
    phone: null,
  })
  assert.equal(addressInput({ ...draft, userId: 'victim' }).userId, undefined)
  for (const input of [
    { ...draft, name: '' },
    { ...draft, city: 'a'.repeat(101) },
    { ...draft, country: 'abc' },
    { ...draft, phone: 'bad' },
    { ...draft, isDefault: 'true' },
    { ...draft, line1: 'bad\nline' },
  ])
    assert.throws(() => addressInput(input), ProfileError)
})
function store(initial = [], fail = false) {
  let rows = structuredClone(initial),
    tail = Promise.resolve()
  const matches = (r, w) => Object.entries(w).every(([k, v]) => v === undefined || r[k] === v)
  return {
    rows: () => rows,
    $transaction(action, config) {
      assert.equal(config.isolationLevel, 'Serializable')
      const job = tail.then(async () => {
        const state = structuredClone(rows)
        const tx = {
          address: {
            findFirst: async ({ where }) => state.find((r) => matches(r, where)) ?? null,
            count: async ({ where }) => state.filter((r) => matches(r, where)).length,
            updateMany: async ({ where, data }) => {
              const found = state.filter((r) => matches(r, where))
              found.forEach((r) => Object.assign(r, data))
              return { count: found.length }
            },
            deleteMany: async ({ where }) => {
              for (let i = state.length - 1; i >= 0; i--)
                if (matches(state[i], where)) state.splice(i, 1)
            },
            create: async ({ data }) =>
              state.push({ ...data, id: String(state.length + 1), _count: { orders: 0 } }),
            findMany: async ({ where }) => state.filter((r) => matches(r, where)),
          },
        }
        const result = await action(tx)
        if (fail) throw new Error('synthetic transaction failure')
        rows = state
        return result
      })
      tail = job.catch(() => {})
      return job
    },
  }
}
test('foreign and missing address IDs both reject without changing any defaults', async () => {
  for (const id of ['foreign', 'missing']) {
    const db = store([{ id: 'foreign', userId: 'b', isDefault: true, _count: { orders: 0 } }])
    await assert.rejects(
      mutateAddress(db, 'a', 'PATCH', { id, makeDefault: true }),
      (e) => e.status === 404,
    )
    assert.equal(db.rows()[0].isDefault, true)
  }
})
test('address creation/default switching/deletion preserves one default per owner', async () => {
  const db = store([{ id: 'other', userId: 'b', isDefault: true, _count: { orders: 0 } }])
  const first = await mutateAddress(db, 'a', 'POST', draft)
  assert.equal(first[0].isDefault, true)
  await mutateAddress(db, 'a', 'POST', { ...draft, isDefault: true })
  let owned = db.rows().filter((r) => r.userId === 'a')
  assert.equal(owned.filter((r) => r.isDefault).length, 1)
  await mutateAddress(db, 'a', 'DELETE', { id: owned.find((r) => r.isDefault).id })
  owned = db.rows().filter((r) => r.userId === 'a')
  assert.equal(owned.length, 1)
  assert.equal(owned[0].isDefault, true)
  assert.equal(db.rows().find((r) => r.userId === 'b').isDefault, true)
})
test('order-linked addresses protect history while allowing default selection', async () => {
  const db = store([
    { ...draft, id: 'linked', userId: 'a', isDefault: false, _count: { orders: 1 } },
  ])
  for (const method of ['PATCH', 'DELETE'])
    await assert.rejects(
      mutateAddress(db, 'a', method, { ...draft, id: 'linked' }),
      (e) => e.code === 'ADDRESS_IN_USE',
    )
  await mutateAddress(db, 'a', 'PATCH', { id: 'linked', makeDefault: true })
  assert.equal(db.rows()[0].isDefault, true)
})
test('failed transaction rolls back default changes; serialized concurrent creation keeps one default', async () => {
  const db = store(
    [{ ...draft, id: 'a1', userId: 'a', isDefault: true, _count: { orders: 0 } }],
    true,
  )
  await assert.rejects(mutateAddress(db, 'a', 'POST', { ...draft, isDefault: true }))
  assert.equal(db.rows().length, 1)
  assert.equal(db.rows()[0].isDefault, true)
  const concurrent = store()
  await Promise.all([
    mutateAddress(concurrent, 'a', 'POST', draft),
    mutateAddress(concurrent, 'a', 'POST', draft),
  ])
  assert.equal(concurrent.rows().filter((r) => r.isDefault).length, 1)
})
let revision = 0
async function load(file, rewrite) {
  const js = ts
    .transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    })
    .outputText.replace(
      /^import (.+?) from ['"]([^'"]+)['"];?$/gm,
      (line, binding, path) => rewrite(binding, path) ?? line,
    )
  return import(
    `data:text/javascript;base64,${Buffer.from(js + `\n//${revision++}`).toString('base64')}`
  )
}
function response() {
  return {
    status(code) {
      this.code = code
      return this
    },
    json(body) {
      this.body = body
    },
    setHeader() {},
  }
}
test('phone change requires password, invalidates only owner mobile tokens and never writes role/email', async () => {
  const writes = []
  globalThis.profileFixture = {
    ...http,
    ...profile,
    requireUser: async () => ({
      id: 'a',
      name: 'Name',
      phone: '1234567890',
      email: 'a@example.test',
      passwordHash: 'hash',
      updatedAt: new Date(0),
    }),
    verifyPassword: async (value) => value === 'correct',
    db: {
      $transaction: async (action) =>
        action({
          user: {
            updateMany: async (args) => {
              writes.push(args)
              return { count: 1 }
            },
          },
          verificationToken: { deleteMany: async (args) => writes.push(args) },
        }),
      user: {
        findUnique: async () => ({ name: 'Name', email: 'a@example.test', phone: '1234567891' }),
      },
      address: { findMany: async () => [] },
    },
  }
  const handler = (
    await load(
      '../server/api/profile.ts',
      (binding) => `const ${binding}=globalThis.profileFixture`,
    )
  ).default
  let result = response()
  await handler(
    { method: 'PATCH', body: { name: 'Name', phone: '1234567891', currentPassword: 'wrong' } },
    result,
  )
  assert.equal(result.code, 400)
  assert.equal(writes.length, 0)
  result = response()
  await handler(
    {
      method: 'PATCH',
      body: {
        name: 'Name',
        phone: '1234567891',
        currentPassword: 'correct',
        userId: 'b',
        role: 'ADMIN',
        email: 'evil',
      },
    },
    result,
  )
  assert.equal(result.code, 200)
  assert.equal(writes[0].where.id, 'a')
  assert.deepEqual(writes[0].data, { name: 'Name', phone: '1234567891', phoneVerifiedAt: null })
  assert.deepEqual(writes[1], { where: { userId: 'a', purpose: 'MOBILE_VERIFICATION' } })
  assert.equal(result.body.profile.passwordHash, undefined)
})
test('profile mutation limits include authenticated account quota', () => {
  for (const path of ['profile', 'addresses']) {
    assert.equal(rateLimitRule(path, 'PATCH').user, 20)
    assert.equal(rateLimitRule(path, 'GET'), null)
  }
})
test('profile client never replays rejected writes and account changes abort pending requests', async () => {
  clearCsrfToken()
  changeSession({ id: 'a', role: 'CUSTOMER' })
  let calls = 0
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch: async (url) => {
      if (url === '/api/auth/csrf') return Response.json({ csrfToken: 'a'.repeat(64) })
      calls++
      return Response.json({ error: { message: 'Address in use' } }, { status: 409 })
    },
  }
  await assert.rejects(
    profileRequest('addresses', 'DELETE', { id: 'a' }, new AbortController().signal),
    /Address in use/,
  )
  assert.equal(calls, 1)
  let started
  const ready = new Promise((resolve) => {
    started = resolve
  })
  window.fetch = async (url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      started()
    })
  const pending = profileRequest('profile', 'GET', null, new AbortController().signal)
  await ready
  changeSession({ id: 'b', role: 'CUSTOMER' })
  await assert.rejects(pending, (e) => e.name === 'AbortError')
})

test('Profile page shares a synchronous write lock and reports failure without replacing data', async () => {
  const states = [],
    data = {
      profile: {
        name: 'Draft',
        email: 'a@example.test',
        phone: null,
        emailVerified: false,
        phoneVerified: false,
      },
      addresses: [],
    }
  let calls = 0,
    reject,
    updates = 0
  const forms = () => null
  globalThis.profilePageFixture = {
    useState: (value) => {
      const i = states.length
      states.push(value)
      return [
        value,
        (next) => {
          states[i] = next
        },
      ]
    },
    useRef: () => ({ current: null }),
    useEffect: () => {},
    useQuery: () => ({ data }),
    privateKey: () => ['private', 'a', 'profile'],
    getProfile: () => {},
    ProfileForms: forms,
    useNotification: () => () => {},
    queryClient: {
      cancelQueries: async () => {},
      setQueryData: () => {
        updates++
      },
    },
    profileRequest: () => {
      calls++
      return new Promise((_resolve, fail) => {
        reject = fail
      })
    },
  }
  const { ProfilePage } = await load('../src/pages/ProfilePage.tsx', (binding, path) =>
    path === 'react/jsx-runtime'
      ? `import ${binding} from ${JSON.stringify(import.meta.resolve(path))}`
      : `const ${binding}=globalThis.profilePageFixture`,
  )
  const tree = ProfilePage({ onNavigate: () => () => {} })
  const find = (node) =>
    Array.isArray(node)
      ? node.map(find).find(Boolean)
      : node && typeof node === 'object'
        ? node.type === forms
          ? node
          : find(node.props?.children)
        : undefined
  const save = find(tree).props.save
  const first = save('profile', 'PATCH', { name: 'Draft' })
  assert.equal(await save('addresses', 'POST', draft), false)
  await new Promise((done) => setImmediate(done))
  assert.equal(calls, 1)
  reject(new Error('Save failed'))
  assert.equal(await first, false)
  assert.equal(updates, 0)
  assert.equal(states[0], false)
  assert.equal(states[1], 'Save failed')
})
