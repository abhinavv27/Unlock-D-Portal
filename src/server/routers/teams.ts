import { z } from 'zod'
import { createTRPCRouter, teamProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'
import { getTeamStatus } from '@/lib/state-engine'

export const teamsRouter = createTRPCRouter({
  // Submit mutation: Teams upload progress for the allowed stage
  submit: teamProcedure
    .input(
      z.object({
        githubUrl: z.string().optional().or(z.literal('')),
        liveDemoUrl: z.string().optional().or(z.literal('')),
        description: z.string().max(1000).optional().default(''),
        submissionType: z.enum(['COMMIT', 'DEMO']).optional().default('COMMIT'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const status = await getTeamStatus(ctx.team.id, ctx.db)
      if (status.isPending) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A submission is already being evaluated.',
        })
      }

      const rawTeam = await ctx.db.registration.findUniqueOrThrow({
        where: { id: ctx.team.id },
        include: { event: true }
      })
      const eventConfig = (rawTeam.event.config as any) || {}
      const eventRound = eventConfig.currentRound !== undefined ? Number(eventConfig.currentRound) : 0
      if (status.allowedRound < eventRound) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Your team did not advance to the next round.',
        })
      } else if (status.allowedRound > eventRound) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The next round has not started yet.',
        })
      }

      const roundNumber = input.submissionType === 'DEMO' ? 2 : status.allowedRound

      if (input.submissionType === 'DEMO') {
        const cleanDemo = input.liveDemoUrl?.trim()
        if (!cleanDemo) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A demo/video URL is required for demo submissions.',
          })
        }
        try { new URL(cleanDemo) } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please provide a valid URL for your demo.',
          })
        }
        const submission = await ctx.db.submission.create({
          data: {
            registrationId: ctx.team.id,
            roundNumber,
            taskId: 'DEMO',
            submissionType: 'DEMO',
            status: 'PENDING',
            payload: {
              demoUrl: cleanDemo,
              description: input.description || undefined,
              submitted_at: new Date().toISOString(),
            },
          },
        })
        return { success: true, submission }
      }

      const cleanGithub = input.githubUrl?.trim();
      const cleanDemo = input.liveDemoUrl?.trim();

      if (!cleanGithub && !cleanDemo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'At least one URL (GitHub or Live Demo) must be provided.',
        })
      }

      if (cleanGithub) {
        try { new URL(cleanGithub) } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please provide a valid GitHub URL.',
          })
        }
      }
      if (cleanDemo) {
        try { new URL(cleanDemo) } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please provide a valid Live Demo URL.',
          })
        }
      }

      const submission = await ctx.db.submission.create({
        data: {
          registrationId: ctx.team.id,
          roundNumber,
          taskId: status.allowedTaskId,
          submissionType: 'COMMIT',
          status: 'PENDING',
          payload: {
            github: cleanGithub || undefined,
            liveDemo: cleanDemo || undefined,
            description: input.description || undefined,
            submitted_at: new Date().toISOString(),
          },
        },
      })

      return { success: true, submission }
    }),

  // Status query: Fetches team information and sequential submission history
  status: teamProcedure.query(async ({ ctx }) => {
    const statusResult = await getTeamStatus(ctx.team.id, ctx.db)

    const rawTeam = await ctx.db.registration.findUniqueOrThrow({
      where: { id: ctx.team.id },
      include: {
        event: true,
        submissions: {
          include: {
            evaluations: true,
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    })

    // Map submissions array to virtual evaluation objects (maintains client compatibility)
    const mappedSubmissions = rawTeam.submissions.map((sub: any) => {
      const { evaluations, ...rest } = sub
      let virtualEvaluation = null

      if (evaluations && evaluations.length > 0) {
        const count = evaluations.length
        const totalScoreSum = evaluations.reduce((sum: number, e: any) => sum + e.totalScore, 0)
        const averageTotalScore = Math.round((totalScoreSum / count) * 10) / 10

        const scoreBreakdownAverage: Record<string, number> = {}
        evaluations.forEach((evaluation: any) => {
          const breakdown = evaluation.scoreBreakdown as Record<string, number> || {}
          Object.entries(breakdown).forEach(([key, val]) => {
            scoreBreakdownAverage[key] = (scoreBreakdownAverage[key] || 0) + Number(val)
          })
        })
        Object.keys(scoreBreakdownAverage).forEach((key) => {
          scoreBreakdownAverage[key] = Math.round((scoreBreakdownAverage[key] / count) * 10) / 10
        })

        const feedbacks = evaluations
          .map((e: any) => e.feedback?.trim())
          .filter(Boolean)
        const consolidatedFeedback = feedbacks.join(' | ')

        const latestGradedAt = new Date(
          Math.max(...evaluations.map((e: any) => new Date(e.gradedAt).getTime()))
        )

        virtualEvaluation = {
          totalScore: averageTotalScore,
          scoreBreakdown: scoreBreakdownAverage,
          feedback: consolidatedFeedback,
          gradedAt: latestGradedAt,
        }
      }

      return {
        ...rest,
        evaluation: virtualEvaluation,
      }
    })

    const eventConfig = (rawTeam.event.config as any) || {}
    const eventRound = eventConfig.currentRound !== undefined ? Number(eventConfig.currentRound) : 0
    const inWaitingRoom = statusResult.allowedRound > eventRound
    const isEliminated = statusResult.allowedRound < eventRound

    const progressState = {
      ...(rawTeam.progressState as any || {}),
      current_stage: statusResult.allowedRound,
      score: (rawTeam.progressState as any)?.score || 0,
    }

    return {
      id: rawTeam.id,
      teamId: rawTeam.id,
      teamName: rawTeam.teamName,
      eventId: rawTeam.eventId,
      eventName: rawTeam.event.name,
      eventSlug: rawTeam.event.slug,
      eventType: rawTeam.event.eventType,
      event: rawTeam.event,
      progressState,
      submissions: mappedSubmissions,
      allowedTaskId: statusResult.allowedTaskId,
      allowedRound: statusResult.allowedRound,
      isPending: statusResult.isPending,
      highestRound: statusResult.highestRound,
      inWaitingRoom,
      isEliminated,
      eventRound,
    }
  }),
})
