import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as http from '../server/api/_lib/http.ts'
import { ProfileError } from '../server/api/_lib/profile.ts'
import { createCustomerMessage } from '../server/api/_lib/customer-messages.ts'
let revision = 0
function messageStore(verified = true) {
  let record = null
  return {
    user: {
      findUnique: async () => ({ id: 'customer', emailVerifiedAt: verified ? new Date() : null }),
    },
    customerMessage: {
      findUnique: async () => record,
      createMany: async ({ data }) => {
        if (record) return { count: 0 }
        record = { ...data }
        return { count: 1 }
      },
      update: async ({ data }) => (record = { ...record, ...data }),
    },
  }
}
const messageInput = {
  id: '11111111-1111-4111-8111-111111111111',
  recipientEmail: 'fixture@example.test',
  subject: 'Order update',
  body: 'Synthetic message',
}
test('admin message records before provider call and concurrent same-ID attempts send only once', async () => {
  const store = messageStore()
  let sent = 0
  const send = async () => {
    assert.ok(await store.customerMessage.findUnique())
    sent++
    return true
  }
  const result = await Promise.all([
    createCustomerMessage(store, 'admin', messageInput, send),
    createCustomerMessage(store, 'admin', messageInput, send),
  ])
  assert.equal(sent, 1)
  assert.equal(result[0].id, result[1].id)
  assert.equal((await createCustomerMessage(store, 'admin', messageInput, send)).status, 'ACCEPTED')
  assert.equal(sent, 1)
})
test('admin message failed email is saved as unconfirmed without automatic resend', async () => {
  const store = messageStore()
  let sent = 0
  const send = async () => {
    sent++
    throw new Error('Synthetic transport failure')
  }
  assert.equal(
    (await createCustomerMessage(store, 'admin', messageInput, send)).status,
    'UNCONFIRMED',
  )
  await createCustomerMessage(store, 'admin', messageInput, send)
  assert.equal(sent, 1)
})
test('admin messaging validates recipient and field bounds before invoking provider', async () => {
  let sent = 0
  const send = async () => {
    sent++
    return true
  }
  await assert.rejects(createCustomerMessage(messageStore(false), 'admin', messageInput, send), {
    status: 400,
  })
  for (const input of [
    { ...messageInput, id: 'bad' },
    { ...messageInput, subject: 'x\r\nheader' },
    { ...messageInput, body: 'x'.repeat(4001) },
    { ...messageInput, recipientEmail: 'invalid' },
  ])
    await assert.rejects(createCustomerMessage(messageStore(), 'admin', input, send), {
      status: 400,
    })
  assert.equal(sent, 0)
})
test('reusing an admin message ID cannot change content or reveal another sender record', async () => {
  const store = messageStore(),
    send = async () => false
  await createCustomerMessage(store, 'admin', messageInput, send)
  await assert.rejects(createCustomerMessage(store, 'other-admin', messageInput, send), {
    status: 409,
  })
  await assert.rejects(
    createCustomerMessage(store, 'admin', { ...messageInput, body: 'changed' }, send),
    { status: 409 },
  )
})
async function load(file, rewrite) {
  const js = ts
    .transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    .outputText.replace(
      /^import (.+?) from ['"]([^'"]+)['"];?$/gm,
      (line, binding, path) => rewrite(binding, path) ?? line,
    )
  return import(
    `data:text/javascript;base64,${Buffer.from(js + `\n//${revision++}`).toString('base64')}`
  )
}
const helper = await load('../server/api/_lib/support.ts', (binding, path) =>
  path === './profile.js'
    ? `import ${binding} from ${JSON.stringify(new URL('../server/api/_lib/profile.ts', import.meta.url).href)}`
    : undefined,
)
const input = {
  id: '11111111-1111-4111-8111-111111111111',
  subject: 'A question',
  body: 'Synthetic message',
}
function store() {
  let ticket = null
  const calls = []
  return {
    calls,
    $executeRaw: async (strings, ...args) => {
      calls.push({ sql: strings.join('?'), args })
      if (strings[0].startsWith('INSERT')) {
        if (ticket) return 0
        ticket = {
          id: args[0],
          userId: args[1],
          subject: args[2],
          body: args[3],
          emailStatus: 'PENDING',
        }
        return 1
      }
      ticket.emailStatus = args[0]
      return 1
    },
    $queryRaw: async (strings, ...args) => {
      calls.push({ sql: strings.join('?'), args })
      return ticket && ticket.id === args[0] && ticket.userId === args[1] ? [{ ...ticket }] : []
    },
  }
}
test('support validation bounds fields and email rendering escapes all HTML delimiters', () => {
  assert.equal(helper.supportInput(input).subject, input.subject)
  for (const body of [
    { ...input, id: 'bad' },
    { ...input, subject: '' },
    { ...input, body: 'x'.repeat(4001) },
  ])
    assert.throws(() => helper.supportInput(body), ProfileError)
  assert.equal(helper.escapeEmail(`<a x="'">&`), '&lt;a x=&quot;&#39;&quot;&gt;&amp;')
})
test('support saves once before notification and duplicate request IDs never resend', async () => {
  const db = store()
  let notices = 0
  const send = async () => {
    assert.ok(db.calls[0].sql.startsWith('INSERT'))
    notices++
    return true
  }
  const first = await helper.createSupportTicket(db, 'a', input, send)
  const second = await helper.createSupportTicket(db, 'a', input, send)
  assert.equal(first.id, second.id)
  assert.equal(notices, 1)
  assert.equal(first.emailStatus, 'ACCEPTED')
  assert.equal(db.calls[0].args[1], 'a')
})
test('mail failure retains a trackable ticket with unconfirmed email status', async () => {
  const ticket = await helper.createSupportTicket(store(), 'a', input, async () => {
    throw new Error('private provider content')
  })
  assert.equal(ticket.id, input.id)
  assert.equal(ticket.emailStatus, 'UNCONFIRMED')
})
test('foreign request IDs and altered duplicate drafts cannot expose or replace a ticket', async () => {
  const db = store()
  await helper.createSupportTicket(db, 'a', input, async () => true)
  await assert.rejects(
    helper.createSupportTicket(db, 'b', input, async () => true),
    (e) => e.status === 409,
  )
  await assert.rejects(
    helper.createSupportTicket(db, 'a', { ...input, body: 'altered' }, async () => true),
    (e) => e.status === 409,
  )
})
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
async function handlers() {
  const calls = []
  globalThis.supportFixture = {
    ...http,
    ...helper,
    ProfileError,
    requireUser: async () => ({ id: 'owner' }),
    requireAdmin: async (_req, res) => {
      res.status(403).json({})
      return null
    },
    sendTransactionalEmail: async () => true,
    db: {
      $queryRaw: async (strings, ...args) => {
        calls.push({ sql: strings.join('?'), args })
        return []
      },
      $executeRaw: async (strings, ...args) => {
        calls.push({ sql: strings.join('?'), args })
        return 0
      },
    },
  }
  return {
    ...(await load(
      '../server/api/support.ts',
      (binding) => `const ${binding}=globalThis.supportFixture`,
    )),
    calls,
  }
}
test('support reads enforce owner scope even when caller supplies admin or user flags', async () => {
  const h = await handlers(),
    result = response()
  await h.default({ method: 'GET', query: { supportAdmin: '1', userId: 'victim' } }, result)
  assert.equal(result.code, 200)
  assert.match(h.calls[0].sql, /WHERE "userId"=/)
  assert.equal(h.calls[0].args[0], 'owner')
  const admin = response()
  await h.adminSupport({ method: 'GET' }, admin)
  assert.equal(admin.code, 403)
  assert.equal(h.calls.length, 1)
})
test('customer cancellation scopes owner and current state and cannot mark requests resolved', async () => {
  const h = await handlers()
  let result = response()
  await h.default(
    {
      method: 'PATCH',
      body: { id: input.id, status: 'RESOLVED', expectedStatus: 'OPEN', resolution: 'done' },
    },
    result,
  )
  assert.equal(result.code, 403)
  assert.equal(h.calls.length, 0)
  result = response()
  await h.default(
    {
      method: 'PATCH',
      body: { id: input.id, status: 'CANCELLED', expectedStatus: 'OPEN', resolution: 'not needed' },
    },
    result,
  )
  assert.equal(result.code, 409)
  assert.match(h.calls[0].sql, /"userId"=/)
  assert.ok(h.calls[0].args.includes('owner'))
})
