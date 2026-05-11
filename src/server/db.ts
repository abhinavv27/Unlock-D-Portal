import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In Next.js build, process.env.DATABASE_URL might be missing.
// Provide a dummy connection string just for the build phase.
const connectionString = process.env.DATABASE_URL || 'postgres://dummy:dummy@localhost:5432/dummy'

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
