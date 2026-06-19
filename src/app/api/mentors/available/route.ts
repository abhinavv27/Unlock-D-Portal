import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateTeam, authenticateStaff } from '@/lib/jwt-auth'

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

    const availableMentors = await db.mentorProfile.findMany({
      where: {
        isActive: true,
        currentStatus: 'AVAILABLE',
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    })

    return NextResponse.json(availableMentors)
  } catch (error) {
    console.error('Fetch available mentors error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
