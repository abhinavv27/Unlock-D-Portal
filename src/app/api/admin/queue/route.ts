import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'

export async function GET(request: Request) {
  try {
    // 1. Validate staff authentication (requires ADMIN or JUDGE)
    const staff = getStaffFromRequest(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Judge or Administrator access required.' },
        { status: 401 }
      )
    }

    // 2. Query submissions where status is PENDING or APPROVED, excluding those graded by the current judge
    const submissions = await db.submission.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        evaluations: {
          none: {
            judgeId: staff.userId,
          },
        },
      },
      include: {
        registration: {
          select: {
            teamName: true,
            eventId: true,
            progressState: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc', // Oldest first for fair queue processing
      },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Admin queue fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
