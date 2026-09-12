import { PrismaClient } from '@prisma/client'
import { loadEnvFile } from 'node:process'
import { existsSync } from 'node:fs'

if (!process.env.DATABASE_URL && existsSync('.env')) loadEnvFile('.env')

const db = new PrismaClient()
try {
  // Only expired abuse-control metadata is removed. Keep a 24-hour grace period.
  const result = await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } } })
  console.log(`Removed ${result.count} expired rate-limit buckets.`)
} finally {
  await db.$disconnect()
}
