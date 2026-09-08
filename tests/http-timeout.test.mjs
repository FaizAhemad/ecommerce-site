import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiFetch, API_TIMEOUT_MS, LONG_RUNNING_API_TIMEOUT_MS, ApiTimeoutError } from '../src/api/http.ts'
import { fetchWithTimeout } from '../api/_lib/http.ts'

test('client timeout uses the 30 second default and typed timeout error', async () => {
  assert.equal(API_TIMEOUT_MS, 30_000)
  let scheduledFor = 0
  globalThis.window = {
    setTimeout: (callback, duration) => { scheduledFor = duration; callback(); return 1 },
    clearTimeout: () => undefined,
    fetch: async (_input, init) => { if (init.signal.aborted) throw new DOMException('Aborted', 'AbortError'); throw new Error('expected abort') },
  }
  await assert.rejects(apiFetch('/api/test'), error => error instanceof ApiTimeoutError)
  assert.equal(scheduledFor, API_TIMEOUT_MS)
})

test('client long-running requests use the 60 second override', async () => {
  assert.equal(LONG_RUNNING_API_TIMEOUT_MS, 60_000)
  let scheduledFor = 0
  globalThis.window.setTimeout = (callback, duration) => { scheduledFor = duration; callback(); return 1 }
  await assert.rejects(apiFetch('/api/upload', { timeoutMs: LONG_RUNNING_API_TIMEOUT_MS }), error => error instanceof ApiTimeoutError)
  assert.equal(scheduledFor, LONG_RUNNING_API_TIMEOUT_MS)
})

test('server provider timeout uses the same typed error and override', async () => {
  let scheduledFor = 0
  const originalSetTimeout = globalThis.setTimeout
  const originalFetch = globalThis.fetch
  globalThis.setTimeout = (callback, duration) => { scheduledFor = duration; callback(); return 1 }
  globalThis.fetch = async (_input, init) => { if (init.signal.aborted) throw new DOMException('Aborted', 'AbortError'); throw new Error('expected abort') }
  try {
    await assert.rejects(fetchWithTimeout('https://provider.test', { timeoutMs: LONG_RUNNING_API_TIMEOUT_MS }), /upstream request timed out/i)
    assert.equal(scheduledFor, LONG_RUNNING_API_TIMEOUT_MS)
  } finally {
    globalThis.setTimeout = originalSetTimeout
    globalThis.fetch = originalFetch
  }
})
