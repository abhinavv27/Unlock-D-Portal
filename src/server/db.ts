import { PrismaClient } from '@prisma/client'

const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Background GC for Mentor Sessions (runs every 60 seconds)
// Cancels REQUESTED sessions older than 10 minutes to un-brick the queue.
const globalForGc = globalThis as unknown as {
  mentorGcInterval: NodeJS.Timeout | undefined
}

if (!globalForGc.mentorGcInterval) {
  globalForGc.mentorGcInterval = setInterval(async () => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const cancelled = await db.mentorSession.updateMany({
        where: {
          status: 'REQUESTED',
          requestedAt: { lt: tenMinutesAgo },
        },
        data: {
          status: 'CANCELLED',
          resolvedAt: new Date(),
        },
      })
      if (cancelled.count > 0) {
        console.log(`[Mentor GC] Auto-cancelled ${cancelled.count} ghosted REQUESTED sessions older than 10 minutes.`)
      }
    } catch (error) {
      console.error('[Mentor GC] Error sweeping ghosted sessions:', error)
    }
  }, 60000)
}

