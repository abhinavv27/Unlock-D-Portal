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
            manualStatus: state?.manualStatus || null,
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
        teamPasscode: '[HIDDEN]',
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

  updateStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.registration.findUnique({ where: { id: input.id } })
      if (!reg) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' })
      const progress = (reg.progressState as any) || {}
      await ctx.db.registration.update({
        where: { id: input.id },
        data: { progressState: { ...progress, manualStatus: input.status } },
      })
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

  getDemoQueue: adminProcedure.query(async ({ ctx }) => {
    const activeEvent = await ctx.db.event.findFirst({ where: { isActive: true } })
    if (!activeEvent) return { teams: [] }

    const registrations = await ctx.db.registration.findMany({
      where: { eventId: activeEvent.id },
      include: {
        submissions: {
          where: { submissionType: 'DEMO' },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { registeredAt: 'asc' },
    })

    const teams = registrations.map((reg) => {
      const progress = (reg.progressState as any) || {}
      const latestDemo = reg.submissions[0] || null
      return {
        id: reg.id,
        teamName: reg.teamName,
        unstopTeamId: reg.unstopTeamId,
        score: progress.score || 0,
        currentStage: progress.current_stage || 0,
        demoSubmission: latestDemo ? {
          id: latestDemo.id,
          status: latestDemo.status,
          payload: latestDemo.payload,
          submittedAt: latestDemo.submittedAt,
        } : null,
        meetLink: progress.meetLink || null,
        presentationStatus: progress.presentationStatus || 'NONE',
      }
    })

    return { teams }
  }),

  approveDemo: adminProcedure
    .input(z.object({
      registrationId: z.string(),
      meetLink: z.string().url('Must be a valid URL'),
    }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.registration.findUniqueOrThrow({ where: { id: input.registrationId } })
      const progress = (reg.progressState as any) || {}

      const demoSub = await ctx.db.submission.findFirst({
        where: { registrationId: input.registrationId, submissionType: 'DEMO', status: 'PENDING' },
      })
      if (demoSub) {
        await ctx.db.submission.update({
          where: { id: demoSub.id },
          data: { status: 'APPROVED' },
        })
      }

      await ctx.db.registration.update({
        where: { id: input.registrationId },
        data: {
          progressState: {
            ...progress,
            meetLink: input.meetLink,
            presentationStatus: 'QUEUED',
          },
        },
      })

      return { success: true }
    }),

  updatePresentationStatus: adminProcedure
    .input(z.object({
      registrationId: z.string(),
      status: z.enum(['QUEUED', 'ACTIVE', 'COMPLETED']),
    }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.registration.findUniqueOrThrow({ where: { id: input.registrationId } })
      const progress = (reg.progressState as any) || {}

      await ctx.db.registration.update({
        where: { id: input.registrationId },
        data: {
          progressState: {
            ...progress,
            presentationStatus: input.status,
          },
        },
      })

      return { success: true }
    }),

  callNextTeam: adminProcedure.mutation(async ({ ctx }) => {
    const currentActive = await ctx.db.registration.findFirst({
      where: {
        event: { isActive: true },
        progressState: {
          path: ['presentationStatus'],
          equals: 'ACTIVE',
        },
      },
    })
    if (currentActive) {
      const currentProgress = (currentActive.progressState as any) || {}
      await ctx.db.registration.update({
        where: { id: currentActive.id },
        data: {
          progressState: { ...currentProgress, presentationStatus: 'COMPLETED' },
        },
      })
    }

    const nextQueued = await ctx.db.registration.findFirst({
      where: {
        event: { isActive: true },
        progressState: {
          path: ['presentationStatus'],
          equals: 'QUEUED',
        },
      },
      orderBy: { registeredAt: 'asc' },
    })
    if (!nextQueued) {
      return { success: true, message: 'No teams in queue.' }
    }

    const nextProgress = (nextQueued.progressState as any) || {}
    await ctx.db.registration.update({
      where: { id: nextQueued.id },
      data: {
        progressState: { ...nextProgress, presentationStatus: 'ACTIVE' },
      },
    })

    return { success: true, teamName: nextQueued.teamName }
  }),
})
