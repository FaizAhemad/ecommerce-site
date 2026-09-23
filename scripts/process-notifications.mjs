import { loadEnvFile } from 'node:process'
import { existsSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { processDueNotifications } from '../server/api/_lib/notification-queue.ts'

// Operational owner command; environment must be initialized before Prisma.
if (!process.env.DATABASE_URL && existsSync('.env')) loadEnvFile('.env')
const { PrismaClient } = await import('@prisma/client')
const db = new PrismaClient()
let stopping = false
process.on('SIGINT', () => { stopping = true })
process.on('SIGTERM', () => { stopping = true })
try {
  do {
    try {
      const result = await processDueNotifications(db, { apiKey: process.env.RESEND_API_KEY, from: process.env.RESEND_FROM_EMAIL, supportEmail: process.env.SUPPORT_EMAIL }, 10)
      console.log(JSON.stringify({ event: 'notification_queue_processed', ...result }))
    } catch { console.error('Notification processing failed; inspect safe admin history.'); process.exitCode = 1 }
    if (!process.argv.includes('--watch') || stopping) break
    await delay(30000)
  } while (!stopping)
} finally { await db.$disconnect() }
