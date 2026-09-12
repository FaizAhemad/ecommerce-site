import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { createRateLimitStore } from '../server/api/_lib/rate-limit-store.ts'
import { loadEnvFile } from 'node:process'
import { existsSync } from 'node:fs'

if (!process.env.DATABASE_URL && existsSync('.env')) loadEnvFile('.env')

const db = new PrismaClient()
try {
  await db.$transaction(async tx => {
    // Session-local table shadows the production table and is dropped on commit.
    await tx.$executeRaw`CREATE TEMPORARY TABLE "RateLimitBucket" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" TIMESTAMPTZ(3) NOT NULL) ON COMMIT DROP`
    const consume = createRateLimitStore(tx)
    const counts = await Promise.all(Array.from({ length: 15 }, () => consume('test-ip', 10, 60)))
    assert.deepEqual(counts.map(row => row.count), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 11, 11, 11, 11])
    assert.ok(counts.every(row => row.retryAfter >= 59 && row.retryAfter <= 60))
    const other = await consume('another-ip', 10, 60)
    assert.equal(other.count, 1)
    const [before] = await tx.$queryRaw`SELECT "expiresAt" FROM "RateLimitBucket" WHERE "key" = 'test-ip'`
    await consume('test-ip', 10, 60)
    const [after] = await tx.$queryRaw`SELECT "expiresAt" FROM "RateLimitBucket" WHERE "key" = 'test-ip'`
    assert.equal(after.expiresAt.getTime(), before.expiresAt.getTime())
    await tx.$executeRaw`UPDATE "RateLimitBucket" SET "expiresAt" = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE "key" = 'test-ip'`
    assert.equal((await consume('test-ip', 10, 60)).count, 1)
  }, { timeout: 30_000 })
  console.log('PostgreSQL temporary-table checks passed: increments, saturation, isolation, expiry and recovery. Application records unchanged.')
} catch (error) {
  if (error instanceof assert.AssertionError) throw error
  console.error(`PostgreSQL check could not complete (${error?.code ?? error?.errorCode ?? 'connection/configuration error'}).`)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
