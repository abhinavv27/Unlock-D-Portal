import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getTeamFromRequest } from '@/lib/auth-utils'

export async function GET(request: Request) {
  try {
    // 1. Validate team session token
    const team = await getTeamFromRequest(request)
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid team session token required in headers.' },
        { status: 401 }
      )
    }

    // 2. Query team submissions and judges' evaluations
    const submissions = await db.submission.findMany({
      where: {
        registrationId: team.id,
      },
      include: {
        evaluation: {
          select: {
            scoreBreakdown: true,
            totalScore: true,
            feedback: true,
            gradedAt: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    // 3. Return team status, active event metadata, and submissions logs
    return NextResponse.json({
      teamId: team.id,
      teamName: team.teamName,
      eventId: team.eventId,
      eventName: team.event.name,
      eventSlug: team.event.slug,
      eventType: team.event.eventType,
      progressState: team.progressState,
      submissions,
    })
  } catch (error: any) {
    console.error('Get team status error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
