import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateMediaUpload } from '../server/api/_lib/media.ts'

const dataUrl = (type, bytes) => `data:${type};base64,${bytes.toString('base64')}`
// Header fixtures exercise signature validation, not complete media decoding.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==', 'base64')
const fixtures = [
  ['image/png', 'png', png],
  ['image/jpeg', 'jpg', Buffer.from([255, 216, 255, 224, 0, 16])],
  ['image/gif', 'gif', Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(7)])],
  ['image/webp', 'webp', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(4)])],
  ['video/mp4', 'mp4', Buffer.from('000000186674797069736f6d0000000069736f6d6d703432', 'hex')],
  ['video/webm', 'webm', Buffer.from('1a45dfa39f428681', 'hex')],
]

test('supported media signatures retain bytes and produce canonical storage extensions', () => {
  for (const [type, extension, bytes] of fixtures) {
    const result = validateMediaUpload(dataUrl(type, bytes), type, 1000)
    assert.ok(result, type)
    assert.equal(result.contentType, type)
    assert.equal(result.extension, extension)
    assert.deepEqual(result.bytes, bytes)
  }
})

test('rejects HTML, SVG and scripts disguised as any supported type', () => {
  for (const [type] of fixtures) {
    for (const content of ['<script>alert(1)</script>', '<svg onload="alert(1)"></svg>', '<html>hello</html>']) {
      assert.equal(validateMediaUpload(dataUrl(type, Buffer.from(content)), type, 1000), null)
    }
  }
  assert.equal(validateMediaUpload(dataUrl('image/svg+xml', png), 'image/svg+xml', 1000), null)
  assert.equal(validateMediaUpload(dataUrl('text/html', png), 'text/html', 1000), null)
})

test('rejects disagreement between declaration, data URL and file bytes', () => {
  assert.equal(validateMediaUpload(dataUrl('image/png', png), 'image/jpeg', 1000), null)
  assert.equal(validateMediaUpload(dataUrl('image/jpeg', png), 'image/jpeg', 1000), null)
  assert.equal(validateMediaUpload(dataUrl('image/png', png), 'toString', 1000), null)
  assert.ok(validateMediaUpload(dataUrl('IMAGE/PNG', png), 'IMAGE/PNG', 1000))
})

test('rejects missing base64 marker, malformed encoding, empty and truncated media', () => {
  for (const data of ['data:image/png,hello', 'data:image/png;base64,', 'data:image/png;base64,%%%%', 'data:image/png;base64,AAAA=', 'data:image/png;base64,AB==']) {
    assert.equal(validateMediaUpload(data, 'image/png', 1000), null)
  }
  for (const [type, , bytes] of fixtures) {
    assert.equal(validateMediaUpload(dataUrl(type, bytes.subarray(0, 3)), type, 1000), null)
  }
})

test('enforces the decoded byte limit, including the exact boundary', () => {
  assert.ok(validateMediaUpload(dataUrl('image/png', png), 'image/png', png.length))
  assert.equal(validateMediaUpload(dataUrl('image/png', png), 'image/png', png.length - 1), null)
  assert.equal(validateMediaUpload(`data:image/png;base64,${'A'.repeat(10000)}`, 'image/png', 100), null)
})
