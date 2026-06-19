import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateTeam } from '@/lib/jwt-auth'
import { getTeamStatus } from '@/lib/state-engine'
import { z } from 'zod'

const submitSchema = z.object({
  taskId: z.string(),
  roundNumber: z.number().int(),
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
        { error: 'Required fields: "taskId", "roundNumber", and at least one URL.' },
        { status: 400 }
      )
    }

    const { taskId, roundNumber, githubUrl, liveDemoUrl, description } = parsed.data

    const status = await getTeamStatus(team.id, db)
    if (status.isPending) {
      return NextResponse.json(
        { error: 'A submission is already being evaluated.' },
        { status: 400 }
      )
    }

    // Security Check: Validates requested taskId and roundNumber strictly against TeamStatusResponse
    if (taskId !== status.allowedTaskId || roundNumber !== status.allowedRound) {
      return NextResponse.json(
        { error: 'Forbidden. Illegal progression attempt.' },
        { status: 403 }
      )
    }

    const cleanGithub = githubUrl?.trim()
    const cleanDemo = liveDemoUrl?.trim()

    const isRound1 = status.allowedRound === 1

    if (isRound1) {
      if (!cleanDemo) {
        return NextResponse.json(
          { error: 'Drive video link is mandatory for Stage 1.' },
          { status: 400 }
        )
      }
    } else {
      if (!cleanGithub && !cleanDemo) {
        return NextResponse.json(
          { error: 'At least one URL (GitHub or Live Demo) must be provided.' },
          { status: 400 }
        )
      }
    }

    const submission = await db.submission.create({
      data: {
        registrationId: team.id,
        roundNumber,
        taskId,
        status: 'PENDING',
        payload: {
          github: cleanGithub || undefined,
          liveDemo: cleanDemo || undefined,
          description: description || undefined,
          submitted_at: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({ success: true, submission })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
