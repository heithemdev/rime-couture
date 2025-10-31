// /packages/db/src/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client'

/**
 * Create one PrismaClient per process (prod)
 * and a global singleton in dev to survive hot reloads.
 * Logs: warn+error in prod; add query log in dev when DEBUG_SQL is set.
 */
const isProd = process.env.NODE_ENV === 'production'
const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = isProd
  ? ['warn', 'error']
  : (process.env.DEBUG_SQL ? ['query', 'info', 'warn', 'error'] : ['info', 'warn', 'error'])

function makeClient() {
  return new PrismaClient({
    log,
    errorFormat: isProd ? 'minimal' : 'pretty',
  })
}

// Global cache for dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient =
  isProd ? makeClient() : (globalForPrisma.prisma ?? (globalForPrisma.prisma = makeClient()))

// Optional: eager connect for CLIs (uncomment if you want).
// await prisma.$connect()
