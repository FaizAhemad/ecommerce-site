import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import ExcelJS from 'exceljs'
import { incoming, mediaExtension, safeName, validateConfig, verifySignature } from './core.mjs'
import { openStore } from './store.mjs'
import { groupProducts, exportVendor } from './workbook.mjs'
import { createReceiver } from './receiver.mjs'
import { downloadMedia } from './media.mjs'

const config = validateConfig({ phoneNumberId: '1234567890', vendors: [{ id: 'sports', name: 'Sports Shop', sender: '919000000001' }] })
const payload = (messages, phone = config.phoneNumberId) => ({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: phone }, messages } }] }] })
const message = (id, overrides = {}) => ({ id, from: config.vendors[0].sender, type: 'text', timestamp: '1700000000', text: { body: 'Product: Cricket bat\nCode: BAT1\nPrice: 149.50' }, ...overrides })
const row = (msg, seq = 1) => ({ id: msg.id, vendor: msg.vendorId, message: msg, seq, media_path: null, media_error: '' })

test('signatures require original bytes and intake ignores other numbers, senders and status updates', () => {
  const raw = Buffer.from(JSON.stringify(payload([message('one')])))
  const signature = `sha256=${createHmac('sha256', 'secret').update(raw).digest('hex')}`
  assert.equal(verifySignature(raw, signature, 'secret'), true)
  assert.equal(verifySignature(Buffer.concat([raw, Buffer.from(' ')]), signature, 'secret'), false)
  assert.equal(verifySignature(raw, 'sha256=bad', 'secret'), false)
  assert.equal(incoming(payload([message('one'), message('two', { from: '919000000002' })]), config).length, 1)
  assert.equal(incoming(payload([message('one')], '9999999'), config).length, 0)
  assert.deepEqual(incoming(payload([]), config), [])
})

test('durable inbox de-duplicates retries and keeps media failures for recovery', () => {
  const store = openStore(':memory:')
  try {
    const batch = incoming(payload([message('one')]), config)
    store.save(batch); store.save(batch)
    assert.equal(store.rows().length, 1)
    store.failed('one', 5)
    assert.equal(store.rows()[0].attempts, 5)
    store.retry()
    assert.equal(store.rows()[0].attempts, 0)
  } finally { store.db.close() }
})

test('out-of-order reply grouping works but does not cross vendors or infer proximity', () => {
  const [product, photo, unclear] = incoming(payload([message('one'), message('two', { type: 'image', image: { id: '123' }, context: { id: 'one' } }), message('three', { text: { body: 'Another great item' } })]), config)
  const foreign = { ...photo, id: 'foreign', vendorId: 'other' }
  const result = groupProducts([row(photo), row(foreign, 2), row(product, 3), row(unclear, 4)])
  assert.equal(result.products.length, 1)
  assert.equal(result.products[0].messages.length, 2)
  assert.equal(result.review.size, 2)
})

test('unsafe names and mismatched media cannot become executable attachments or paths', () => {
  assert(!/[<>:"/\\|?*]/.test(safeName('../../escape:bat')))
  assert(!/^con$/i.test(safeName('CON')))
  assert.throws(() => mediaExtension('image/jpeg', Buffer.from('<script>')))
  assert.equal(mediaExtension('image/jpeg', Buffer.from([255,216,255,0])), 'jpg')
})

test('receiver verifies before saving, acknowledges only persisted messages, and supports the challenge', async () => {
  let saves = 0
  const receiver = createReceiver({ config, appSecret: 'secret', verifyToken: 'verify', save: () => { saves++ } })
  const raw = Buffer.from(JSON.stringify(payload([message('one')])))
  const invoke = async (signature, method = 'POST', url = '/webhooks/whatsapp') => {
    const result = {}
    await receiver({ method, url, headers: { 'x-hub-signature-256': signature }, async *[Symbol.asyncIterator]() { yield raw } }, { writeHead(status) { result.status = status }, end(body) { result.body = body } })
    return result
  }
  assert.equal((await invoke('invalid')).status, 401)
  assert.equal(saves, 0)
  const signature = `sha256=${createHmac('sha256', 'secret').update(raw).digest('hex')}`
  assert.equal((await invoke(signature)).status, 200)
  assert.equal(saves, 1)
  assert.deepEqual(await invoke('', 'GET', '/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify&hub.challenge=123'), { status: 200, body: '123' })
})

test('media download rejects unexpected hosts before sending bearer credentials there', async () => {
  let calls = 0
  const fake = async () => { calls++; return new Response(JSON.stringify({ url: 'https://example.org/file', mime_type: 'image/jpeg' })) }
  await assert.rejects(downloadMedia({ mediaId: '123', type: 'image' }, '.', { graphVersion: 'v99.0', accessToken: 'fixture' }, fake))
  assert.equal(calls, 1)
})

test('a failed durable save is not acknowledged as successful intake', async () => {
  const raw = Buffer.from(JSON.stringify(payload([message('one')])))
  const signature = `sha256=${createHmac('sha256', 'secret').update(raw).digest('hex')}`
  const receiver = createReceiver({ config, appSecret: 'secret', verifyToken: 'verify', save: () => { throw new Error('synthetic disk failure') } })
  let status
  await receiver({ method: 'POST', url: '/webhooks/whatsapp', headers: { 'x-hub-signature-256': signature }, async *[Symbol.asyncIterator]() { yield raw } }, { writeHead(value) { status = value }, end() {} })
  assert.equal(status, 503)
})

test('duplicate product codes and invalid prices stay in review instead of changing earlier data', () => {
  const messages = incoming(payload([
    message('first'), message('second'), message('invalid', { text: { body: 'Product: Ball\nPrice: call us' } }),
  ]), config)
  const result = groupProducts(messages.map((msg, index) => row(msg, index)))
  assert.equal(result.products.length, 1)
  assert.equal(result.review.size, 2)
  assert.equal(result.products[0].source.id, 'first')
})

test('Excel exports vendor data, preserves literal text and gives images/videos matching numbered names', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gadgify-intake-test-'))
  try {
    const messages = incoming(payload([
      message('one', { text: { body: 'Product: Cricket bat\nCode: BAT1\nPrice: 149.50\nDescription: =HYPERLINK("bad")' } }),
      message('photo1', { type: 'image', image: { id: '123' }, context: { id: 'one' } }),
      message('photo2', { type: 'image', image: { id: '124' }, context: { id: 'one' } }),
      message('video', { type: 'video', video: { id: '125' }, context: { id: 'one' } }),
    ]), config)
    const rows = messages.map((msg, index) => row(msg, index + 1))
    await mkdir(path.join(root, '_state'))
    for (const record of rows.slice(1)) {
      record.media_path = path.join(root, '_state', `${record.id}.${record.message.type === 'image' ? 'jpg' : 'mp4'}`)
      await writeFile(record.media_path, 'synthetic bytes - not actual media')
    }
    await exportVendor(root, config.vendors[0], rows)
    const folder = path.join(root, 'Sports-Shop--sports')
    const book = new ExcelJS.Workbook()
    await book.xlsx.readFile(path.join(folder, 'products.xlsx'))
    assert.equal(book.worksheets.length, 3)
    const sheet = book.getWorksheet('Products')
    assert.equal(sheet.rowCount, 2)
    assert.equal(sheet.getCell('D2').value, '=HYPERLINK("bad")')
    assert.equal(sheet.getCell('G2').value, 149.5)
    assert.match(sheet.getCell('L2').value, /Cricket-bat-1\.jpg\n.*Cricket-bat-2\.jpg$/)
    assert.match(sheet.getCell('M2').value, /Cricket-bat-1\.mp4$/)
    assert.equal(sheet.views[0].state, 'frozen')
    assert.equal((await readFile(path.join(folder, sheet.getCell('M2').value))).toString(), 'synthetic bytes - not actual media')
    await exportVendor(root, config.vendors[0], rows)
    await book.xlsx.readFile(path.join(folder, 'products.xlsx'))
    assert.equal(book.getWorksheet('Products').rowCount, 2)
  } finally { await rm(root, { recursive: true, force: true }) }
})
