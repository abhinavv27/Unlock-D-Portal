import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff credentials required.' },
        { status: 401 }
      )
    }

    // Get all mentor profiles (including username)
    const mentors = await db.mentorProfile.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        user: {
          username: 'asc'
        }
      }
    })

    // Get all active mentor sessions (requested / accepted)
    const activeSessions = await db.mentorSession.findMany({
      where: {
        status: { in: ['REQUESTED', 'ACCEPTED'] }
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

    // Get all historically resolved / cancelled sessions
    const resolvedSessions = await db.mentorSession.findMany({
      where: {
        status: { in: ['RESOLVED', 'CANCELLED'] }
      },
      orderBy: { resolvedAt: 'desc' },
      take: 50,
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

    return NextResponse.json({
      mentors,
      activeSessions,
      resolvedSessions,
    })
  } catch (error) {
    console.error('Fetch admin mentorship data error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
