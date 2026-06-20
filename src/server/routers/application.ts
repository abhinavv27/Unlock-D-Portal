import { z } from 'zod'
import { createTRPCRouter, adminProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'
import { getTeamStatus } from '@/lib/state-engine'

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
      const activeEvent = await ctx.db.event.findFirst({
        where: { isActive: true }
      })
      const eventRound = activeEvent ? ((activeEvent.config as any)?.currentRound !== undefined ? Number((activeEvent.config as any).currentRound) : 0) : 0

      const applications = await Promise.all(
        registrations.map(async (reg) => {
          const state = reg.progressState as any
          const currentStage = state?.current_stage || 1
          const score = state?.score || 0

          const teamStatus = await getTeamStatus(reg.id, ctx.db)
          let teamRoundStatus = 'ACTIVE'
          if (teamStatus.allowedRound < eventRound) {
            teamRoundStatus = 'ELIMINATED'
          } else if (teamStatus.allowedRound > eventRound) {
            teamRoundStatus = 'WAITING_ROOM'
          }

          return {
            id: reg.id,
            firstName: reg.teamName,
            lastName: `(Passcode: [HIDDEN])`,
            university: reg.event.name,
            major: `Stage ${currentStage}`,
            totalScore: score,
            currentStage,
            status: teamRoundStatus,
            submittedAt: reg.registeredAt,
            user: {
              email: `Unstop Team: ${reg.unstopTeamId}`,
              image: null,
            }
          }
        })
      )

      return { applications, total, pages: Math.ceil(total / limit) }
    }),

  // Admin: get full team detail with submissions and evaluations
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.registration.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          event: true,
          submissions: {
            orderBy: { roundNumber: 'asc' },
            include: {
              evaluations: {
                include: {
                  judge: {
                    select: { username: true, systemRole: true }
                  }
                }
              }
            }
          }
        }
      })

      const state = reg.progressState as any

      return {
        id: reg.id,
        teamName: reg.teamName,
        unstopTeamId: reg.unstopTeamId,
        teamPasscode: reg.teamPasscodeHash.includes(':') ? '[Hashed]' : reg.teamPasscodeHash,
        memberDetails: reg.memberDetails,
        progressState: state,
        eventName: reg.event.name,
        eventConfig: reg.event.config,
        submissions: reg.submissions.map(sub => ({
          id: sub.id,
          roundNumber: sub.roundNumber,
          taskId: sub.taskId,
          status: sub.status,
          rejectionReason: sub.rejectionReason,
          payload: sub.payload,
          submittedAt: sub.submittedAt,
          evaluations: sub.evaluations.map(ev => ({
            id: ev.id,
            scoreBreakdown: ev.scoreBreakdown,
            totalScore: ev.totalScore,
            feedback: ev.feedback,
            gradedAt: ev.gradedAt,
            judgeName: ev.judge.username,
            judgeRole: ev.judge.systemRole,
          })),
        })),
      }
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

  removeTeam: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.registration.delete({ where: { id: input.id } })
      return { success: true }
    }),

  bulkRemoveTeams: adminProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.registration.deleteMany({ where: { id: { in: input.ids } } })
      return { success: true }
    }),

  getActiveEvent: adminProcedure.query(async ({ ctx }) => {
    const activeEvent = await ctx.db.event.findFirst({
      where: { isActive: true }
    })
    if (!activeEvent) return null

    const config = (activeEvent.config as any) || {}
    const currentRound = config.currentRound !== undefined ? Number(config.currentRound) : activeEvent.currentGlobalRound

    return {
      id: activeEvent.id,
      name: activeEvent.name,
      slug: activeEvent.slug,
      eventType: activeEvent.eventType,
      currentRound,
      stages: config.stages || []
    }
  }),

  startRound: adminProcedure
    .input(z.object({ round: z.number().int().min(0).max(3) }))
    .mutation(async ({ ctx, input }) => {
      const activeEvent = await ctx.db.event.findFirst({
        where: { isActive: true }
      })
      if (!activeEvent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active event found'
        })
      }

      const currentConfig = (activeEvent.config as any) || {}
      const updatedConfig = {
        ...currentConfig,
        currentRound: input.round
      }

      await ctx.db.event.update({
        where: { id: activeEvent.id },
        data: { 
          config: updatedConfig,
          currentGlobalRound: input.round
        }
      })

      return { success: true, currentRound: input.round }
    }),

  updateTeam: adminProcedure
    .input(z.object({
      id: z.string(),
      teamName: z.string().min(1),
      passcode: z.string().optional(),
      currentStage: z.number().int().min(0),
      score: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.registration.findUnique({
        where: { id: input.id },
      })
      if (!reg) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team registration not found.',
        })
      }

      const updateData: any = {
        teamName: input.teamName,
        totalScore: input.score,
      }

      if (input.passcode && input.passcode.trim() !== '') {
        updateData.teamPasscodeHash = input.passcode.trim()
      }

      const oldState = (reg.progressState as any) || {}
      updateData.progressState = {
        ...oldState,
        current_stage: input.currentStage,
        score: input.score,
        updated_at: new Date().toISOString(),
      }

      await ctx.db.registration.update({
        where: { id: input.id },
        data: updateData,
      })

      return { success: true }
    }),

  updateEvaluation: adminProcedure
    .input(z.object({
      evaluationId: z.number().int(),
      scoreBreakdown: z.record(z.string(), z.number()),
      feedback: z.string().max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const evaluation = await ctx.db.evaluation.findUnique({
        where: { id: input.evaluationId },
        include: {
          submission: {
            include: {
              registration: {
                include: {
                  event: true,
                },
              },
            },
          },
        },
      })

      if (!evaluation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Evaluation not found.',
        })
      }

      const numSubId = evaluation.submissionId
      const submission = evaluation.submission
      const registrationId = submission.registrationId

      // 1. Calculate total score
      const totalScore = Object.values(input.scoreBreakdown).reduce(
        (sum, val) => sum + (Number(val) || 0),
        0
      )

      // 2. Perform updates in transaction
      await ctx.db.$transaction(async (tx) => {
        // Log previous evaluation state to evaluation_audits
        await tx.evaluationAudit.create({
          data: {
            evaluationId: evaluation.id,
            oldScoreBreakdown: evaluation.scoreBreakdown as any,
            oldTotalScore: evaluation.totalScore,
            oldFeedback: evaluation.feedback,
          },
        })

        // Update the evaluation record
        await tx.evaluation.update({
          where: { id: input.evaluationId },
          data: {
            scoreBreakdown: input.scoreBreakdown,
            totalScore,
            feedback: input.feedback,
            gradedAt: new Date(),
          },
        })

        // Fetch all evaluations for this submission to calculate average
        const evaluations = await tx.evaluation.findMany({
          where: { submissionId: numSubId },
        })

        const totalScoreSum = evaluations.reduce((sum, e) => sum + e.totalScore, 0)
        const averageScore = Math.round((totalScoreSum / evaluations.length) * 10) / 10

        // Read passing_threshold from config
        const eventConfig = submission.registration.event.config as any
        const roadmap = eventConfig?.roadmap || []
        const stepObj = roadmap.find((r: any) => r.task_id === submission.taskId)
        const rubric = stepObj?.rubric || ['functionality', 'code_quality']
        const maxScore = rubric.length * 10
        const passingThresholdPercent = eventConfig?.passing_threshold ?? 60
        const passingThresholdScore = (passingThresholdPercent / 100) * maxScore

        let finalStatus: 'APPROVED' | 'REJECTED'
        let rejectionReason: string | null = null

        if (averageScore >= passingThresholdScore) {
          finalStatus = 'APPROVED'
        } else {
          finalStatus = 'REJECTED'
          rejectionReason = evaluations
            .map((e) => e.feedback?.trim())
            .filter(Boolean)
            .join(' | ')
        }

        await tx.submission.update({
          where: { id: numSubId },
          data: {
            status: 'APPROVED',
            averageScore,
            rejectionReason: null,
          },
        })

        // Fetch new state engine status using transaction client
        const teamStatus = await getTeamStatus(registrationId, tx as any)

        // Fetch cumulative totalScore from all APPROVED submissions
        const approvedSubs = await tx.submission.findMany({
          where: {
            registrationId,
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
          where: { id: registrationId },
          data: {
            totalScore: roundedCumulative,
            progressState: updatedProgress,
          },
        })
      })

      return { success: true }
    }),
})
