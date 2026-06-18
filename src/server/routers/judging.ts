import { z } from 'zod'
import { createTRPCRouter, judgeProcedure, adminProcedure } from '@/server/trpc'

export const judgingRouter = createTRPCRouter({
  // Get all projects/teams for judging
  getProjects: judgeProcedure.query(async ({ ctx }) => {
    const registrations = await ctx.db.registration.findMany({
      include: { event: true }
    })
    return registrations.map(reg => ({
      id: reg.id,
      name: reg.teamName,
      tableNumber: reg.unstopTeamId,
      track: { name: reg.event.name },
      scores: [],
    }))
  }),

  // Get a single project/team detail
  getProject: judgeProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.registration.findUniqueOrThrow({
        where: { id: input.id },
        include: { event: true }
      })
      return {
        id: reg.id,
        name: reg.teamName,
        description: `Unstop Team ID: ${reg.unstopTeamId}`,
        tableNumber: reg.unstopTeamId,
        track: { name: reg.event.name },
        scores: [],
      }
    }),

  // Submit / update a score
  submitScore: judgeProcedure
    .input(z.object({
      projectId: z.string(),
      innovation: z.number().int().min(1).max(10),
      technical: z.number().int().min(1).max(10),
      presentation: z.number().int().min(1).max(10),
      impact: z.number().int().min(1).max(10),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async () => {
      return { success: true }
    }),

  // Admin: leaderboard mapping to registrations progress state score
  leaderboard: adminProcedure.query(async ({ ctx }) => {
    const registrations = await ctx.db.registration.findMany({
      include: {
        event: true,
        submissions: {
          where: { status: 'APPROVED' },
          select: {
            roundNumber: true,
            evaluations: {
              select: {
                totalScore: true,
              },
            },
          },
        },
      },
    })
    return registrations
      .map(reg => {
        const state = reg.progressState as any
        const score = state?.score || 0

        // Compute per-round score breakdown
        const roundMap: Record<number, number> = {}
        for (const sub of reg.submissions) {
          const round = sub.roundNumber
          if (round === undefined || round === null) continue
          const evals = sub.evaluations
          if (evals.length > 0) {
            const avgScore = evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length
            roundMap[round] = (roundMap[round] || 0) + Math.round(avgScore * 10) / 10
          }
        }

        return {
          id: reg.id,
          name: reg.teamName,
          description: `Unstop Team ID: ${reg.unstopTeamId}`,
          tableNumber: reg.unstopTeamId,
          track: { name: reg.event.name },
          judgeCount: 0,
          totalScore: score,
          roundBreakdown: roundMap,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)
  }),
})
