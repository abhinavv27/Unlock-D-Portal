import { z } from 'zod'
import { createTRPCRouter, adminProcedure } from '@/server/trpc'

export const applicationRouter = createTRPCRouter({
  // Admin: get all registered teams (mapped to old applications list)
  getAll: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const { search, page, limit } = input
      const where = {
        ...(search ? {
          OR: [
            { teamName: { contains: search, mode: 'insensitive' as const } },
            { unstopTeamId: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {}),
      }

      const [registrations, total] = await Promise.all([
        ctx.db.registration.findMany({
          where,
          include: { 
            event: {
              select: {
                name: true,
                eventType: true,
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { registeredAt: 'desc' },
        }),
        ctx.db.registration.count({ where }),
      ])

      // Map to old "application" structure so frontend client doesn't break
      const applications = registrations.map(reg => {
        const state = reg.progressState as any
        const currentStage = state?.current_stage || 1
        const score = state?.score || 0

        return {
          id: reg.id,
          firstName: reg.teamName,
          lastName: `(Passcode: ${reg.teamPasscode})`,
          university: reg.event.name,
          major: `Stage ${currentStage} // Score: ${score}`,
          status: 'ACCEPTED', // teams are registered and active
          submittedAt: reg.registeredAt,
          user: {
            email: `Unstop Team: ${reg.unstopTeamId}`,
            image: null,
          }
        }
      })

      return { applications, total, pages: Math.ceil(total / limit) }
    }),

  // Admin: pipeline stats mapping for quick counts on dashboard
  pipelineStats: adminProcedure.query(async ({ ctx }) => {
    const totalEvents = await ctx.db.event.count()
    const totalTeams = await ctx.db.registration.count()
    const totalSubmissions = await ctx.db.submission.count()
    const pendingSubmissions = await ctx.db.submission.count({ where: { status: 'PENDING' } })

    return {
      total: totalTeams,
      pending: pendingSubmissions,
      accepted: totalSubmissions - pendingSubmissions, // Graded submissions count
      under_review: totalEvents, // Mapped to total events count
      rejected: 0,
      waitlisted: 0,
    }
  }),

  // Add dummy mutations for client API backwards compatibility
  updateStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(() => {
      return { success: true }
    }),

  bulkUpdateStatus: adminProcedure
    .input(z.object({
      ids: z.array(z.string()),
      status: z.string(),
    }))
    .mutation(() => {
      return { success: true }
    }),
})
