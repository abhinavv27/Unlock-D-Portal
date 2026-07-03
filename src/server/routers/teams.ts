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
        description: z.string().optional().default(''),
        taskId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cleanGithub = input.githubUrl?.trim()
      const cleanDemo = input.liveDemoUrl?.trim()

      if (cleanGithub) {
        try {
          new URL(cleanGithub)
        } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please provide a valid GitHub URL.',
          })
        }
      }
      if (cleanDemo) {
        try {
          new URL(cleanDemo)
        } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please provide a valid Live Demo URL.',
          })
        }
      }

      // Check if we are updating an existing submission (resubmit/edit)
      const status = await getTeamStatus(ctx.team.id, ctx.db)
      const targetTaskId = input.taskId || status.allowedTaskId

      const existingSubmission = await ctx.db.submission.findFirst({
        where: {
          registrationId: ctx.team.id,
          taskId: targetTaskId,
        },
      })

      if (existingSubmission) {
        if (targetTaskId.startsWith('FEATURE-') || targetTaskId === 'FINAL-FEATURE') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Editing is not allowed for FEATURE submissions or the FINAL-FEATURE.',
          })
        }

        const result = await ctx.db.$transaction(async (tx) => {
          // Fetch existing evaluations to archive
          const prevEvaluations = await tx.evaluation.findMany({
            where: { submissionId: existingSubmission.id },
          })
          const archivedEvals = prevEvaluations.map((ev) => ({
            judgeId: ev.judgeId,
            totalScore: ev.totalScore,
            scoreBreakdown: ev.scoreBreakdown,
            feedback: ev.feedback,
            gradedAt: ev.gradedAt.toISOString(),
          }))

          // Clear old evaluations
          await tx.evaluation.deleteMany({
            where: { submissionId: existingSubmission.id },
          })

          const currentPayload = (existingSubmission.payload as any) || {}
          const editHistory = currentPayload.editHistory || []
          const newHistoryItem = {
            editedAt: new Date().toISOString(),
            previousGithub: currentPayload.github || '',
            previousLiveDemo: currentPayload.liveDemo || '',
            previousDescription: currentPayload.description || '',
            previousEvaluations: archivedEvals,
          }
          const updatedHistory = [...editHistory, newHistoryItem]

          // Update submission payload, status back to APPROVED/PENDING, and reset score
          const isFeature = targetTaskId.startsWith('FEATURE-')
          const updatedSub = await tx.submission.update({
            where: { id: existingSubmission.id },
            data: {
              status: isFeature ? 'APPROVED' : 'PENDING',
              averageScore: null,
              rejectionReason: null,
              payload: {
                github: cleanGithub || undefined,
                liveDemo: cleanDemo || undefined,
                description: input.description || undefined,
                submitted_at: currentPayload.submitted_at || new Date().toISOString(),
                editHistory: updatedHistory,
              },
            },
          })

          // Recalculate team total score
          const approvedSubs = await tx.submission.findMany({
            where: {
              registrationId: ctx.team.id,
              status: 'APPROVED',
              id: { not: existingSubmission.id },
            },
          })
          const cumulativeScore = approvedSubs.reduce((sum, s) => sum + (s.averageScore || 0), 0)
          const roundedCumulative = Math.round(cumulativeScore * 10) / 10

          const reg = await tx.registration.findUniqueOrThrow({
            where: { id: ctx.team.id },
          })
          const stateObj = (reg.progressState as any) || {}
          const updatedProgress = {
            ...stateObj,
            score: roundedCumulative,
            updated_at: new Date().toISOString(),
          }

          await tx.registration.update({
            where: { id: ctx.team.id },
            data: {
              totalScore: roundedCumulative,
              progressState: updatedProgress,
            },
          })

          return updatedSub
        }, { maxWait: 15000, timeout: 30000 })

        return {
          success: true,
          submission: result,
        }
      }

      // Creating a new submission
      if (status.allowedTaskId === 'WAITING_ROOM') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have reached the global ceiling for the current round. Please wait in the waiting room.',
        })
      }

      if (status.allowedTaskId === 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already completed all tasks for this event.',
        })
      }

      const isRound1 = status.allowedRound === 1
      const isRound3 = targetTaskId === 'ROUND-3'

      // Round 3 is a demo-only round — no URLs required
      if (!isRound3) {
        if (isRound1) {
          if (!cleanGithub || !cleanDemo) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Both GitHub repository and Drive video link are mandatory for Round 1.',
            })
          }
        } else {
          if (!cleanGithub && !cleanDemo) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'At least one URL (GitHub or Live Demo) must be provided.',
            })
          }
        }
      }

      const newSub = await ctx.db.$transaction(async (tx) => {
        const sub = await tx.submission.create({
          data: {
            registrationId: ctx.team.id,
            roundNumber: status.allowedRound,
            taskId: status.allowedTaskId,
            status: 'PENDING',
            submission_type: isRound3 ? 'DEMO' : 'COMMIT',
            payload: {
              github: cleanGithub || undefined,
              liveDemo: cleanDemo || undefined,
              description: input.description || undefined,
              submitted_at: new Date().toISOString(),
            },
          },
        })

        // Fetch new state engine status using transaction client
        const teamStatus = await getTeamStatus(ctx.team.id, tx as any)

        const reg = await tx.registration.findUniqueOrThrow({
          where: { id: ctx.team.id },
        })
        const stateObj = (reg.progressState as any) || {}
        const updatedProgress = {
          ...stateObj,
          current_stage: teamStatus.allowedRound,
          updated_at: new Date().toISOString(),
        }

        await tx.registration.update({
          where: { id: ctx.team.id },
          data: {
            progressState: updatedProgress,
          },
        })

        return sub
      }, { maxWait: 15000, timeout: 30000 })

      return {
        success: true,
        submission: newSub,
      }
    }),

  // Status query: Fetches team information and sequential submission history
  status: teamProcedure.query(async ({ ctx }) => {
    const statusResult = await getTeamStatus(ctx.team.id, ctx.db)

    if (statusResult.allowedTaskId === 'ROUND-3') {
      const existing = await ctx.db.submission.findFirst({
        where: {
          registrationId: ctx.team.id,
          taskId: 'ROUND-3',
        },
      })
      if (!existing) {
        await ctx.db.submission.create({
          data: {
            registrationId: ctx.team.id,
            roundNumber: 3,
            taskId: 'ROUND-3',
            status: 'APPROVED',
            submission_type: 'DEMO',
            payload: {
              github: '',
              liveDemo: '',
              description: 'Round 3 — Final Demonstration entry',
              submitted_at: new Date().toISOString(),
            },
          },
        })
      }
    }

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
    const inWaitingRoom = statusResult.inWaitingRoom
    const isEliminated = statusResult.isEliminated

    const progressState = {
      ...(rawTeam.progressState as any || {}),
      current_stage: statusResult.allowedRound,
      score: rawTeam.totalScore,
    }

    // Fetch DemoCall data if the team is in Round 3
    let demoCall = null
    if (statusResult.allowedTaskId === 'ROUND-3' || rawTeam.submissions.some((s: any) => s.taskId === 'ROUND-3')) {
      const r3Submission = rawTeam.submissions.find((s: any) => s.taskId === 'ROUND-3')
      if (r3Submission) {
        const dc = await ctx.db.demoCall.findUnique({
          where: { submissionId: r3Submission.id },
          include: {
            judge: { select: { id: true, username: true } },
          },
        })
        if (dc) {
          demoCall = {
            id: dc.id,
            status: dc.status,
            meetingLink: dc.meetingLink,
            calledAt: dc.calledAt,
            completedAt: dc.completedAt,
            judgeName: dc.judge.username,
          }
        }
      }
    }

    return {
      id: rawTeam.id,
      teamId: rawTeam.id,
      teamName: rawTeam.teamName,
      unstopTeamId: rawTeam.unstopTeamId,
      eventId: rawTeam.eventId,
      eventName: rawTeam.event.name,
      eventSlug: rawTeam.event.slug,
      eventType: rawTeam.event.eventType,
      event: rawTeam.event,
      progressState,
      submissions: mappedSubmissions,
      allowedTaskId: statusResult.allowedTaskId,
      allowedTaskName: statusResult.allowedTaskName,
      allowedTaskDescription: statusResult.allowedTaskDescription,
      allowedRound: statusResult.allowedRound,
      isPending: statusResult.isPending,
      highestState: statusResult.highestState,
      inWaitingRoom,
      isEliminated,
      eliminationReason: statusResult.eliminationReason,
      round1Score: statusResult.round1Score,
      round2Score: statusResult.round2Score,
      eventRound,
      demoCall,
    }
  }),
})
