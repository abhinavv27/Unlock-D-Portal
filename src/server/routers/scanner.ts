import { z } from 'zod'
import { createTRPCRouter, staffProcedure } from '@/server/trpc'

const MEAL_ACTIONS = [
  'MEAL_FRIDAY_DINNER',
  'MEAL_SATURDAY_BREAKFAST',
  'MEAL_SATURDAY_LUNCH',
  'MEAL_SATURDAY_DINNER',
  'MEAL_SUNDAY_BREAKFAST',
  'MEAL_SUNDAY_LUNCH',
] as const

export const scannerRouter = createTRPCRouter({
  // Validate a QR code and perform action
  scan: staffProcedure
    .input(z.object({
      qrCode: z.string().min(1),
      action: z.enum(['CHECK_IN', ...MEAL_ACTIONS]),
    }))
    .mutation(async () => {
      return {
        success: false,
        message: 'Scanner offline or database migrated.',
        attendee: null as { firstName: string; lastName: string } | null
      }
    }),

  // Recent scan events
  recentScans: staffProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async () => {
      return []
    }),
})
