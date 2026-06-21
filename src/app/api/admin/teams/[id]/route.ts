import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    const registration = await db.registration.findUnique({
      where: { id },
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

    if (!registration) {
      return NextResponse.json(
        { error: 'Team registration not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: registration.id,
      unstopTeamId: registration.unstopTeamId,
      teamName: registration.teamName,
      teamPasscodeHash: registration.teamPasscodeHash,
      memberDetails: registration.memberDetails,
      progressState: registration.progressState,
      totalScore: registration.totalScore,
      registeredAt: registration.registeredAt,
      event: {
        id: registration.event.id,
        name: registration.event.name,
        slug: registration.event.slug,
      },
      submissions: registration.submissions,
    })
  } catch (error) {
    console.error('Team audit fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
