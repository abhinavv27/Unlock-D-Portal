import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff, authenticateTeam } from '@/lib/jwt-auth'

export async function GET(request: Request) {
  try {
    const team = await authenticateTeam(request)
    const staff = !team ? await authenticateStaff(request) : null

    if (!team && !staff) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    if (team) {
      const sessions = await db.mentorSession.findMany({
        where: { registrationId: team.id },
        orderBy: { requestedAt: 'desc' },
        take: 10,
        include: {
          mentor: {
            select: {
              username: true,
            },
          },
        },
      })

      return NextResponse.json({ sessions })
    }

    const url = new URL(request.url)
    const isHistory = url.searchParams.get('history') === 'true'

    if (isHistory) {
      const sessions = await db.mentorSession.findMany({
        where: {
          mentorId: staff!.userId,
          status: { in: ['RESOLVED', 'CANCELLED'] },
        },
        orderBy: { resolvedAt: 'desc' },
        take: 30,
        include: {
          registration: {
            select: {
              teamName: true,
              unstopTeamId: true,
            },
          },
          mentor: {
            select: {
              username: true,
            },
          },
        },
      })
      return NextResponse.json({ sessions })
    }

    const sessions = await db.mentorSession.findMany({
      where: {
        OR: [
          { status: 'REQUESTED' },
          { status: 'ACCEPTED', mentorId: staff!.userId },
        ],
      },
      orderBy: { requestedAt: 'asc' },
      include: {
        registration: {
          select: {
            teamName: true,
            unstopTeamId: true,
          },
        },
        mentor: {
          select: {
            username: true,
          },
        },
      },
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Fetch mentor sessions error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
