import { z } from 'zod'
import { createTRPCRouter, judgeProcedure, adminProcedure } from '@/server/trpc'

export const judgingRouter = createTRPCRouter({
  // Get all projects for judging
  getProjects: judgeProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      include: {
        track: true,
        scores: {
          where: { judgeId: ctx.session!.user.id },
          select: { overall: true },
        },
      },
      orderBy: { tableNumber: 'asc' },
    })
  }),

  // Get a single project detail
  getProject: judgeProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          track: true,
          scores: {
            where: { judgeId: ctx.session!.user.id },
          },
        },
      })
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
    .mutation(async ({ ctx, input }) => {
      const overall = (input.innovation + input.technical + input.presentation + input.impact) / 4
      return ctx.db.judgingScore.upsert({
        where: {
          judgeId_projectId: {
            judgeId: ctx.session!.user.id,
            projectId: input.projectId,
          },
        },
        create: {
          judgeId: ctx.session!.user.id,
          projectId: input.projectId,
          innovation: input.innovation,
          technical: input.technical,
          presentation: input.presentation,
          impact: input.impact,
          overall,
          notes: input.notes,
        },
        update: {
          innovation: input.innovation,
          technical: input.technical,
          presentation: input.presentation,
          impact: input.impact,
          overall,
          notes: input.notes,
        },
      })
    }),

  // Admin: leaderboard
  leaderboard: adminProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      include: {
        track: true,
        scores: {
          select: { overall: true, innovation: true, technical: true, presentation: true, impact: true },
        },
      },
    })
    return projects
      .map(p => ({
        ...p,
        avgScore: p.scores.length
          ? p.scores.reduce((s, x) => s + x.overall, 0) / p.scores.length
          : null,
        judgeCount: p.scores.length,
      }))
      .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
  }),
})
