import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateTeam } from '@/lib/jwt-auth'
import { z } from 'zod'

const requestSchema = z.object({
  issueDescription: z.string().min(5, 'Issue description must be at least 5 characters long.').max(1000),
})

export async function POST(request: Request) {
  try {
    const team = await authenticateTeam(request)
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized. Team login required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters.' },
        { status: 400 }
      )
    }

    const { issueDescription } = parsed.data

    // Validate that a team can only have 1 active request/session
    const activeSession = await db.mentorSession.findFirst({
      where: {
        registrationId: team.id,
        status: { in: ['REQUESTED', 'ACCEPTED'] },
      },
    })

    if (activeSession) {
      return NextResponse.json(
        { error: 'You already have an active mentor session request.' },
        { status: 400 }
      )
    }

    const newSession = await db.mentorSession.create({
      data: {
        registrationId: team.id,
        issueDescription,
        status: 'REQUESTED',
      },
    })

    return NextResponse.json({
      success: true,
      session: newSession,
    })
  } catch (error) {
    console.error('Create mentor session request error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
