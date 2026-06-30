import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateTeam } from '@/lib/jwt-auth'
import { getTeamStatus } from '@/lib/state-engine'
import { z } from 'zod'

const submitSchema = z.object({
  taskId: z.string().optional(),
  roundNumber: z.number().int().optional(),
  githubUrl: z.string().optional().or(z.literal('')),
  liveDemoUrl: z.string().optional().or(z.literal('')),
  description: z.string().max(1000).optional().default(''),
})

export async function POST(request: Request) {
  try {
    const team = await authenticateTeam(request)
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid team session required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters.' },
        { status: 400 }
      )
    }

    const { taskId: inputTaskId, githubUrl, liveDemoUrl, description } = parsed.data

    const cleanGithub = githubUrl?.trim()
    const cleanDemo = liveDemoUrl?.trim()

    if (cleanGithub) {
      try {
        new URL(cleanGithub)
      } catch {
        return NextResponse.json({ error: 'Invalid GitHub URL.' }, { status: 400 })
      }
    }
    if (cleanDemo) {
      try {
        new URL(cleanDemo)
      } catch {
        return NextResponse.json({ error: 'Invalid Live Demo URL.' }, { status: 400 })
      }
    }

    const status = await getTeamStatus(team.id, db)
    const targetTaskId = inputTaskId || status.allowedTaskId

    const existingSubmission = await db.submission.findFirst({
      where: {
        registrationId: team.id,
        taskId: targetTaskId,
      }
    })

    if (existingSubmission) {
      const result = await db.$transaction(async (tx) => {
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

        // Clear evaluations
        await tx.evaluation.deleteMany({
          where: { submissionId: existingSubmission.id }
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

        // Update submission payload, status back to APPROVED, and reset score
        const updatedSub = await tx.submission.update({
          where: { id: existingSubmission.id },
          data: {
            status: 'APPROVED',
            averageScore: null,
            rejectionReason: null,
            payload: {
              github: cleanGithub || undefined,
              liveDemo: cleanDemo || undefined,
              description: description || undefined,
              submitted_at: currentPayload.submitted_at || new Date().toISOString(),
              editHistory: updatedHistory,
            }
          }
        })

        // Recalculate team total score
        const approvedSubs = await tx.submission.findMany({
          where: {
            registrationId: team.id,
            status: 'APPROVED',
            id: { not: existingSubmission.id }
          }
        })
        const cumulativeScore = approvedSubs.reduce((sum, s) => sum + (s.averageScore || 0), 0)
        const roundedCumulative = Math.round(cumulativeScore * 10) / 10

        const reg = await tx.registration.findUniqueOrThrow({
          where: { id: team.id }
        })
        const stateObj = (reg.progressState as any) || {}
        const updatedProgress = {
          ...stateObj,
          score: roundedCumulative,
          updated_at: new Date().toISOString(),
        }

        await tx.registration.update({
          where: { id: team.id },
          data: {
            totalScore: roundedCumulative,
            progressState: updatedProgress,
          }
        })

        return updatedSub
      }, { maxWait: 15000, timeout: 30000 })

      return NextResponse.json({ success: true, submission: result })
    }

    // Creating new submission
    if (status.allowedTaskId === 'WAITING_ROOM') {
      return NextResponse.json({ error: 'You have reached the global ceiling.' }, { status: 400 })
    }
    if (status.allowedTaskId === 'COMPLETED') {
      return NextResponse.json({ error: 'Event completed.' }, { status: 400 })
    }

    const isRound1 = status.allowedRound === 1
    if (isRound1 && !cleanDemo) {
      return NextResponse.json({ error: 'Drive video link is mandatory for Stage 1.' }, { status: 400 })
    }
    if (!isRound1 && !cleanGithub && !cleanDemo) {
      return NextResponse.json({ error: 'At least one URL must be provided.' }, { status: 400 })
    }

    const newSub = await db.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: {
          registrationId: team.id,
          roundNumber: status.allowedRound,
          taskId: status.allowedTaskId,
          status: 'APPROVED',
          payload: {
            github: cleanGithub || undefined,
            liveDemo: cleanDemo || undefined,
            description: description || undefined,
            submitted_at: new Date().toISOString(),
          }
        }
      })

      // Fetch new state engine status using transaction client
      const teamStatus = await getTeamStatus(team.id, tx as any)

      const reg = await tx.registration.findUniqueOrThrow({
        where: { id: team.id }
      })
      const stateObj = (reg.progressState as any) || {}
      const updatedProgress = {
        ...stateObj,
        current_stage: teamStatus.allowedRound,
        updated_at: new Date().toISOString(),
      }

      await tx.registration.update({
        where: { id: team.id },
        data: {
          progressState: updatedProgress,
        }
      })

      return sub
    }, { maxWait: 15000, timeout: 30000 })

    return NextResponse.json({ success: true, submission: newSub })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
