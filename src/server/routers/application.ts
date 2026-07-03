import { z } from 'zod'
import { createTRPCRouter, adminProcedure, strictAdminProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'
import { getTeamStatus } from '@/lib/state-engine'
import { getMaxScoreForRubric } from '@/lib/rubric'

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
          const score = reg.totalScore

          const teamStatus = await getTeamStatus(reg.id, ctx.db)
          let teamRoundStatus = 'ACTIVE'
          if (teamStatus.allowedTaskId === 'COMPLETED') {
            teamRoundStatus = 'COMPLETED'
          } else if (teamStatus.allowedRound < eventRound) {
            teamRoundStatus = 'ELIMINATED'
          } else if (teamStatus.allowedRound > eventRound) {
            teamRoundStatus = 'WAITING_ROOM'
          }

          const isJudge = ctx.session?.user?.role === 'JUDGE'
          return {
            id: reg.id,
            firstName: reg.teamName,
            lastName: isJudge ? `(Passcode: REDACTED)` : `(Passcode: ${reg.teamPasscodeHash})`,
            university: reg.event.name,
            major: `Stage ${currentStage}`,
            totalScore: score,
            currentStage,
            status: teamRoundStatus,
            submittedAt: reg.registeredAt,
            isBlocked: reg.isBlocked,
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

      const roundAverages: Record<number, number> = {}
      for (const round of [0, 1, 2, 3]) {
        const subs = reg.submissions.filter(s => s.roundNumber === round)
        if (subs.length > 0) {
          const avgScore = subs.reduce((sum, s) => sum + (s.averageScore || 0), 0) / subs.length
          roundAverages[round] = Math.round(avgScore * 10) / 10
        }
      }

      const isJudge = ctx.session?.user?.role === 'JUDGE'
      return {
        id: reg.id,
        teamName: reg.teamName,
        unstopTeamId: reg.unstopTeamId,
        teamPasscode: isJudge ? 'REDACTED' : reg.teamPasscodeHash,
        memberDetails: reg.memberDetails,
        progressState: state,
        eventName: reg.event.name,
        eventConfig: reg.event.config,
        currentGlobalRound: reg.event.currentGlobalRound,
        isBlocked: reg.isBlocked,
        submissions: reg.submissions.map(sub => ({
          id: sub.id,
          roundNumber: sub.roundNumber,
          taskId: sub.taskId,
          status: sub.status,
          rejectionReason: sub.rejectionReason,
          payload: sub.payload,
          submittedAt: sub.submittedAt,
          averageScore: sub.averageScore || 0,
          evaluations: sub.evaluations.map(ev => ({
            id: ev.id,
            scoreBreakdown: ev.scoreBreakdown,
            totalScore: ev.totalScore,
            feedback: ev.feedback,
            gradedAt: ev.gradedAt,
            judgeName: ev.judge.username,
            judgeRole: ev.judge.systemRole,
            judgeId: ev.judgeId,
          })),
        })),
        roundAverages,
      }
    }),

  // Admin: pipeline stats mapping for quick counts on dashboard
  pipelineStats: adminProcedure.query(async ({ ctx }) => {
    const totalEvents = await ctx.db.event.count()
    const totalTeams = await ctx.db.registration.count()

    const totalSubmissions = await ctx.db.submission.count()
    const pendingSubmissions = await ctx.db.submission.count({
      where: { status: 'PENDING' },
    })

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

  removeTeam: strictAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.registration.delete({ where: { id: input.id } })
      return { success: true }
    }),

  bulkRemoveTeams: strictAdminProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.registration.deleteMany({ where: { id: { in: input.ids } } })
      return { success: true }
    }),

  toggleBlockTeam: strictAdminProcedure
    .input(z.object({
      id: z.string(),
      isBlocked: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const registration = await ctx.db.registration.findUnique({
        where: { id: input.id }
      })
      if (!registration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team registration not found.'
        })
      }

      await ctx.db.registration.update({
        where: { id: input.id },
        data: { isBlocked: input.isBlocked }
      })

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

  startRound: strictAdminProcedure
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

      if (input.round === 3) {
        // Automatically create ROUND-3 submissions for top 10 leaderboard teams
        const topTeams = await ctx.db.registration.findMany({
          where: { eventId: activeEvent.id },
          orderBy: { totalScore: 'desc' },
          take: 10,
        })
        for (const team of topTeams) {
          const progressState = (team.progressState as any) || {}
          await ctx.db.registration.update({
            where: { id: team.id },
            data: {
              progressState: {
                ...progressState,
                current_stage: 3,
                updated_at: new Date().toISOString(),
              }
            }
          })

          const existing = await ctx.db.submission.findFirst({
            where: {
              registrationId: team.id,
              taskId: 'ROUND-3'
            }
          })
          if (!existing) {
            await ctx.db.submission.create({
              data: {
                registrationId: team.id,
                roundNumber: 3,
                taskId: 'ROUND-3',
                status: 'APPROVED',
                submission_type: 'DEMO',
                payload: {
                  github: '',
                  liveDemo: '',
                  description: 'Round 3 — Final Demonstration entry',
                  submitted_at: new Date().toISOString()
                }
              }
            })
          }
        }
      }

      return { success: true, currentRound: input.round }
    }),

  updateTeam: strictAdminProcedure
    .input(z.object({
      id: z.string(),
      teamName: z.string().min(1),
      passcode: z.string().optional(),
      currentStage: z.number().int().min(0),
      score: z.number().max(300, "Score cannot exceed 300 points"),
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
      feedback: z.string(),
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

      // If the current user has the JUDGE role, restrict their edits
      if (ctx.session?.user?.role === 'JUDGE') {
        if (evaluation.judgeId !== Number(ctx.session.user.id)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only edit your own grading.',
          })
        }
        
        const progressState = (evaluation.submission.registration.progressState as any) || {}
        const currentStage = progressState.current_stage ?? 1
        const submissionRound = evaluation.submission.roundNumber
        if (submissionRound < currentStage) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot edit grading after the round has ended.',
          })
        }
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
      await ctx.db.$transaction(
        async (tx) => {
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
          let rubric = stepObj?.rubric || ['functionality', 'code_quality']
          if (submission.taskId === 'FINAL-SUBMISSION') {
            rubric = [
              'feature_1_functionality', 'feature_1_code_quality',
              'feature_2_functionality', 'feature_2_code_quality',
              'feature_3_functionality', 'feature_3_code_quality',
              'feature_4_functionality', 'feature_4_code_quality',
              'feature_5_functionality', 'feature_5_code_quality'
            ]
          }
          
          const maxScore = getMaxScoreForRubric(rubric)
          const passingThresholdScore = stepObj?.threshold ?? ((eventConfig?.passing_threshold ?? 60) / 100) * maxScore

          let finalStatus: 'APPROVED' | 'REJECTED' = 'APPROVED'
          let rejectionReason: string | null = null

          await tx.submission.update({
            where: { id: numSubId },
            data: {
              status: finalStatus,
              averageScore,
              rejectionReason,
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
        },
        {
          maxWait: 15000,
          timeout: 30000,
        }
      )

      return { success: true }
    }),

  getDemoQueue: adminProcedure.query(async ({ ctx }) => {
    const activeEvent = await ctx.db.event.findFirst({ where: { isActive: true } })
    if (!activeEvent) return { teams: [] }

    const registrations = await ctx.db.registration.findMany({
      where: { eventId: activeEvent.id },
      include: {
        submissions: {
          where: { submission_type: 'DEMO' },
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

      // Find the PENDING demo submission and approve it
      const demoSub = await ctx.db.submission.findFirst({
        where: { registrationId: input.registrationId, submission_type: 'DEMO', status: 'PENDING' },
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
    // Mark any current ACTIVE team as COMPLETED
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

    // Find the next QUEUED team (ordered by registration time as proxy for approval order)
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

  updateDemoMeetingLink: adminProcedure
    .input(z.object({
      submissionId: z.number().int(),
      meetingLink: z.string().url('Must be a valid URL'),
    }))
    .mutation(async ({ ctx, input }) => {
      const demoCall = await ctx.db.demoCall.findUnique({
        where: { submissionId: input.submissionId },
      })

      if (!demoCall) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Demo call not found for this submission.',
        })
      }

      await ctx.db.demoCall.update({
        where: { submissionId: input.submissionId },
        data: {
          meetingLink: input.meetingLink,
          status: 'CALLED',
          calledAt: new Date(),
        },
      })

      return { success: true }
    }),

  getTeamActivityLogs: strictAdminProcedure
    .query(async ({ ctx }) => {
      const logs = await ctx.db.teamSessionLog.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
          registration: {
            select: {
              teamName: true,
            }
          }
        },
        take: 100,
      })
      return logs
    }),
})
