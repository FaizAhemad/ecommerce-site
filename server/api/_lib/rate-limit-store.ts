import type { PrismaClient } from '@prisma/client'
import type { Counter } from './rate-limit.js'

export function createRateLimitStore(db: Pick<PrismaClient, '$queryRaw'>) {
  return async (key: string, limit: number, seconds: number): Promise<Counter> => {
    // PostgreSQL serializes conflicting updates. Counts are capped to prevent overflow;
    // rejected attempts do not extend the window. Use database time across instances.
    const [counter] = await db.$queryRaw<Counter[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt")
    VALUES (${key}, 1, CURRENT_TIMESTAMP + (${seconds} * INTERVAL '1 second'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."expiresAt" <= CURRENT_TIMESTAMP THEN 1
        ELSE LEAST("RateLimitBucket"."count" + 1, ${limit + 1}) END,
      "expiresAt" = CASE WHEN "RateLimitBucket"."expiresAt" <= CURRENT_TIMESTAMP
        THEN EXCLUDED."expiresAt" ELSE "RateLimitBucket"."expiresAt" END
    RETURNING "count", LEAST(${seconds}, GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - CURRENT_TIMESTAMP)))))::int AS "retryAfter"
    `
    if (!counter) throw new Error('Counter unavailable')
    return counter
  }
}
