import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'

export async function GET(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let statusFilter: any = undefined
    if (status) {
      if (status.toUpperCase() === 'GRADED') {
        statusFilter = { in: ['APPROVED', 'REJECTED'] }
      } else {
        statusFilter = status.toUpperCase()
      }
    }

    const submissions = await db.submission.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      include: {
        registration: true,
        evaluations: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    // Assign dynamic @Transient teamName field to submissions before serialization
    const hydratedSubmissions = submissions.map((sub) => {
      const { registration, ...subRest } = sub
      return {
        ...subRest,
        teamName: registration.teamName, // dynamically assigns @Transient teamName
        registration: {
          id: registration.id,
          teamName: registration.teamName,
          unstopTeamId: registration.unstopTeamId,
          progressState: registration.progressState,
        },
      }
    })

    return NextResponse.json(hydratedSubmissions)
  } catch (error) {
    console.error('Fetch submissions error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
