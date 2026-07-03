import { z } from 'zod'
import { createTRPCRouter, judgeProcedure, adminProcedure, publicProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'
import { getTeamStatus } from '@/lib/state-engine'
import { getMaxScoreForRubric } from '@/lib/rubric'

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

  // submitEvaluation mutation: Judges submit evaluation details for a PENDING submission
  submitEvaluation: judgeProcedure
    .input(z.object({
      submissionId: z.number().int(),
      scoreBreakdown: z.record(z.string(), z.number()),
      feedback: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch targeted submission
      const submission = await ctx.db.submission.findUnique({
        where: { id: input.submissionId },
      })
      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission not found.',
        })
      }

      // 2. Ensure status is exactly PENDING
      if (submission.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Submission is not in PENDING status.',
        })
      }

      // 3. Calculate totalScore mathematically in the backend
      const totalScore = Object.values(input.scoreBreakdown).reduce(
        (sum, val) => sum + (Number(val) || 0),
        0
      )

      // 4. Insert into the Evaluation table, catching unique constraint failures
      try {
        const evaluation = await ctx.db.evaluation.create({
          data: {
            submissionId: input.submissionId,
            judgeId: Number(ctx.session!.user.id),
            scoreBreakdown: input.scoreBreakdown,
            totalScore,
            feedback: input.feedback,
          },
        })
        return { success: true, evaluation }
      } catch (err: any) {
        if (err.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'You have already evaluated this submission.',
          })
        }
        throw err
      }
    }),

  // finalizeSubmission mutation: Admin aggregates evaluations and approves/rejects submission
  finalizeSubmission: adminProcedure
    .input(z.object({
      submissionId: z.number().int(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch submission, linked evaluations, and registration
      const submission = await ctx.db.submission.findUnique({
        where: { id: input.submissionId },
        include: {
          evaluations: true,
          registration: {
            include: {
              event: true,
            },
          },
        },
      })

      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission not found.',
        })
      }

      const evaluations = submission.evaluations
      if (evaluations.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot finalize submission with zero evaluations.',
        })
      }

      // 2. Calculate averageScore
      const totalScoreSum = evaluations.reduce((sum, e) => sum + e.totalScore, 0)
      const averageScore = Math.round((totalScoreSum / evaluations.length) * 10) / 10

      // 3. Calculate passing threshold dynamically as a percentage of the dynamic rubric max
      const eventConfig = submission.registration.event.config as any
      const roadmap = eventConfig?.roadmap || []
      const stepObj = roadmap.find((r: any) => r.task_id === submission.taskId)
      
      let rubric = stepObj?.rubric || ['functionality', 'code_quality']
      
      const maxScore = getMaxScoreForRubric(rubric)
      const passingThresholdPercent = eventConfig?.passing_threshold ?? 60
      const passingThresholdScore = (passingThresholdPercent / 100) * maxScore

      let finalStatus: 'APPROVED' | 'REJECTED' = 'APPROVED'
      let rejectionReason: string | null = null

      // For FEATURE tasks, always approve and skip cumulative score update
      const isFeatureTask = submission.taskId.startsWith('FEATURE-')
      if (isFeatureTask) {
        await ctx.db.submission.update({
          where: { id: input.submissionId },
          data: {
            status: 'APPROVED',
            averageScore,
            rejectionReason: null,
          },
        })
        return {
          success: true,
          status: 'APPROVED',
          averageScore,
        }
      }

      // 4. Update the submission and registration total score in a transaction
      await ctx.db.$transaction(async (tx) => {
        await tx.submission.update({
          where: { id: input.submissionId },
          data: {
            status: finalStatus,
            averageScore,
            rejectionReason,
          },
        })

        // Fetch new state engine status using transaction client
        const teamStatus = await getTeamStatus(submission.registrationId, tx as any)

        // Fetch cumulative totalScore for registration from all APPROVED submissions
        const approvedSubs = await tx.submission.findMany({
          where: {
            registrationId: submission.registrationId,
            status: 'APPROVED',
          },
        })
        const cumulativeScore = approvedSubs.reduce((sum, s) => sum + (s.averageScore || 0), 0)
        const roundedCumulative = Math.round(cumulativeScore * 10) / 10

        const stateObj = submission.registration.progressState as any || {}
        const updatedProgress = {
          ...stateObj,
          current_stage: teamStatus.allowedRound,
          score: roundedCumulative,
          updated_at: new Date().toISOString(),
        }

        await tx.registration.update({
          where: { id: submission.registrationId },
          data: {
            totalScore: roundedCumulative,
            progressState: updatedProgress,
          },
        })
      }, { maxWait: 15000, timeout: 30000 })

      return {
        success: true,
        status: finalStatus,
        averageScore,
      }
    }),

  // Admin: leaderboard mapping to registrations totalScore
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
      .map((reg) => {
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

        const roundScores = Object.values(roundMap)
        const calculatedAvgScore = roundScores.length > 0 
          ? Math.round((roundScores.reduce((sum, s) => sum + s, 0) / roundScores.length) * 10) / 10
          : 0

        return {
          id: reg.id,
          name: reg.teamName,
          description: `Unstop Team ID: ${reg.unstopTeamId}`,
          tableNumber: reg.unstopTeamId,
          track: { name: reg.event.name },
          judgeCount: 0,
          totalScore: reg.totalScore,
          avgScore: calculatedAvgScore,
          roundBreakdown: roundMap,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)
  }),

  // Public: leaderboard if enabled by admin
  publicLeaderboard: publicProcedure.query(async ({ ctx }) => {
    // 1. Fetch current active event to check if public leaderboard is visible
    const event = await ctx.db.event.findFirst({
      where: { isActive: true },
    })

    if (!event || !event.isLeaderboardVisible) {
      return { isVisible: false, data: [] }
    }

    let registrations = await ctx.db.registration.findMany({
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

    if (event.currentGlobalRound >= 3) {
      // Only keep the top 10 teams based on their totalScore
      registrations.sort((a, b) => b.totalScore - a.totalScore)
      registrations = registrations.slice(0, 10)
    }

    const leaderboardData = registrations
      .map((reg) => {
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

        const roundScores = Object.values(roundMap)
        const calculatedAvgScore = roundScores.length > 0 
          ? Math.round((roundScores.reduce((sum, s) => sum + s, 0) / roundScores.length) * 10) / 10
          : 0

        return {
          id: reg.id,
          name: reg.teamName,
          tableNumber: reg.unstopTeamId,
          track: { name: reg.event.name },
          totalScore: reg.totalScore,
          avgScore: calculatedAvgScore,
          roundBreakdown: roundMap,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)

    return { isVisible: true, data: leaderboardData }
  }),

  // Admin: toggle leaderboard visibility
  toggleLeaderboardVisibility: adminProcedure
    .input(z.object({ isVisible: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findFirst({
        where: { isActive: true },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active event found' })
      }

      await ctx.db.event.update({
        where: { id: event.id },
        data: { isLeaderboardVisible: input.isVisible },
      })

      return { success: true, isVisible: input.isVisible }
    }),

  // Admin: get leaderboard visibility
  getLeaderboardVisibility: adminProcedure.query(async ({ ctx }) => {
    const event = await ctx.db.event.findFirst({
      where: { isActive: true },
    })
    return { isVisible: event?.isLeaderboardVisible ?? false }
  }),
})
