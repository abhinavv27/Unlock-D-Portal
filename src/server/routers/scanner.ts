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

const MEAL_TO_TYPE: Record<string, string> = {
  MEAL_FRIDAY_DINNER: 'FRIDAY_DINNER',
  MEAL_SATURDAY_BREAKFAST: 'SATURDAY_BREAKFAST',
  MEAL_SATURDAY_LUNCH: 'SATURDAY_LUNCH',
  MEAL_SATURDAY_DINNER: 'SATURDAY_DINNER',
  MEAL_SUNDAY_BREAKFAST: 'SUNDAY_BREAKFAST',
  MEAL_SUNDAY_LUNCH: 'SUNDAY_LUNCH',
}

export const scannerRouter = createTRPCRouter({
  // Validate a QR code and perform action
  scan: staffProcedure
    .input(z.object({
      qrCode: z.string().min(1),
      action: z.enum(['CHECK_IN', ...MEAL_ACTIONS]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { qrCode, action } = input
      const staffId = ctx.session!.user.id

      // Find application by QR code
      const application = await ctx.db.application.findUnique({
        where: { qrCode },
        include: { user: { select: { name: true, email: true } }, mealTickets: true },
      })

      if (!application) {
        await ctx.db.scanEvent.create({
          data: { staffId, qrCode, action, success: false, message: 'QR code not found' },
        })
        return { success: false, message: 'QR code not found.' }
      }

      if (application.status !== 'ACCEPTED') {
        await ctx.db.scanEvent.create({
          data: { staffId, qrCode, action, success: false, message: 'Not an accepted attendee' },
        })
        return { success: false, message: 'This person is not an accepted attendee.' }
      }

      // ─── CHECK_IN ──────────────────────────────────────────────────
      if (action === 'CHECK_IN') {
        if (application.checkedIn) {
          await ctx.db.scanEvent.create({
            data: { staffId, qrCode, action, success: false, message: 'Already checked in' },
          })
          return {
            success: false,
            message: `${application.firstName} ${application.lastName} already checked in at ${application.checkedInAt?.toLocaleTimeString()}.`,
            attendee: application,
          }
        }
        await ctx.db.application.update({
          where: { id: application.id },
          data: { checkedIn: true, checkedInAt: new Date() },
        })
        await ctx.db.scanEvent.create({
          data: { staffId, qrCode, action, success: true, message: 'Checked in successfully' },
        })
        return {
          success: true,
          message: `✓ ${application.firstName} ${application.lastName} checked in!`,
          attendee: application,
        }
      }

      // ─── MEAL SCAN ─────────────────────────────────────────────────
      const mealType = MEAL_TO_TYPE[action] as string
      const existingTicket = application.mealTickets.find(t => t.mealType === mealType)

      if (existingTicket?.redeemedAt) {
        await ctx.db.scanEvent.create({
          data: { staffId, qrCode, action, success: false, message: 'Meal already redeemed' },
        })
        return {
          success: false,
          message: `${application.firstName} ${application.lastName} already redeemed this meal.`,
          attendee: application,
        }
      }

      // Create or redeem meal ticket
      await ctx.db.mealTicket.upsert({
        where: { applicationId_mealType: { applicationId: application.id, mealType: mealType as any } },
        create: { applicationId: application.id, mealType: mealType as any, redeemedAt: new Date(), redeemedBy: staffId },
        update: { redeemedAt: new Date(), redeemedBy: staffId },
      })
      await ctx.db.scanEvent.create({
        data: { staffId, qrCode, action, success: true, message: 'Meal redeemed' },
      })
      return {
        success: true,
        message: `✓ Meal redeemed for ${application.firstName} ${application.lastName}!`,
        attendee: application,
      }
    }),

  // Recent scan events (for display on scanner page)
  recentScans: staffProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.scanEvent.findMany({
        where: { staffId: ctx.session!.user.id },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })
    }),
})
