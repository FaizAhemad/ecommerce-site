import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { validateConfig } from './core.mjs'
import { openStore } from './store.mjs'
import { createReceiver } from './receiver.mjs'
import { downloadMedia } from './media.mjs'
import { exportVendor } from './workbook.mjs'

const [configFile, outputDirectory] = process.argv.slice(2)
if (!configFile || !outputDirectory || !path.isAbsolute(outputDirectory)) {
  console.error('Usage: node run.mjs <vendors.json> <absolute output directory> [--retry-media]')
  process.exit(1)
}
const config = validateConfig(JSON.parse(await readFile(configFile, 'utf8')))
const settings = {
  appSecret: process.env.WHATSAPP_APP_SECRET,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  graphVersion: process.env.WHATSAPP_GRAPH_VERSION,
}
if (Object.values(settings).some((value) => !value) || !/^v\d+\.\d+$/.test(settings.graphVersion)) {
  console.error('Missing WhatsApp configuration. Follow README.md; never paste secrets into chat.')
  process.exit(1)
}
const root = path.resolve(outputDirectory)
const stateDirectory = path.join(root, '_state')
const mediaDirectory = path.join(stateDirectory, 'media')
await mkdir(mediaDirectory, { recursive: true })
const store = openStore(path.join(stateDirectory, 'inbox.sqlite'))
if (process.argv.includes('--retry-media')) store.retry()
let dirty = true, working = false
const receiver = createReceiver({ config, ...settings, save: (messages) => { store.save(messages); if (messages.length) dirty = true } })
const server = createServer(receiver)
server.requestTimeout = 30000
server.headersTimeout = 10000
server.maxHeadersCount = 40
// A trusted HTTPS tunnel must forward only this webhook to loopback. No files are served.
server.listen(8787, '127.0.0.1', () => console.log('WhatsApp intake listening on loopback port 8787. Waiting for signed vendor messages.'))
server.on('error', () => { console.error('Cannot start intake listener; check port 8787.'); process.exit(1) })

async function work() {
  if (working) return
  working = true
  try {
    const pending = store.rows().filter((row) => row.message.mediaId && !row.media_path && row.attempts < 5 && row.retry_at <= Date.now()).slice(0, 5)
    for (const row of pending) {
      try { store.downloaded(row.id, await downloadMedia(row.message, mediaDirectory, settings)) }
      catch { store.failed(row.id, row.attempts + 1); console.warn('Media job needs retry/review. See the vendor workbook; no message content is logged.') }
      dirty = true
    }
    if (dirty) {
      // Clear before awaits so new webhook arrivals remain dirty for the following cycle.
      dirty = false
      try {
        const rows = store.rows()
        for (const vendor of config.vendors) await exportVendor(root, vendor, rows)
      } catch {
        dirty = true
        console.warn('Workbook export pending. Close Excel if open and check folder permissions/disk space. Inbox is retained.')
      }
    }
  } finally { working = false }
}
setInterval(() => { void work().catch(() => { dirty = true; console.error('Worker failed; inbox retained for retry.') }) }, 5000)
await work()
