// Re-export the Prisma singleton and helpers
export * from './prisma'

// Re-export Prisma types so other packages (web) don't need @prisma/client directly
export type { Prisma } from '@prisma/client'
