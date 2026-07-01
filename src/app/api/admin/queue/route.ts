import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'
import { getCriteriaForRubric } from '@/lib/rubric'
import { getTeamStatus } from '@/lib/state-engine'

export async function GET(request: Request) {
  try {
    // 1. Validate staff authentication (requires ADMIN or JUDGE)
    const staff = await getStaffFromRequest(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Judge or Admin access required.' },
        { status: 401 }
      )
    }

    // Verify staff user exists in database
    const dbUser = await db.user.findUnique({
      where: { id: staff.userId }
    })
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff user not found in database. Please log in again.' },
        { status: 401 }
      )
    }

    // Fetch active event
    const activeEvent = await db.event.findFirst({
      where: { isActive: true },
    })
    const currentRound = activeEvent?.currentGlobalRound ?? 1

    // 2. Query submissions where status is PENDING or APPROVED, excluding those graded by the current judge
    const submissions = await db.submission.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        roundNumber: currentRound,
        evaluations: {
          none: {
            judgeId: staff.userId,
          },
        },
      },
      include: {
        registration: {
          include: {
            event: true,
          },
        },
        demoCall: true,
      },
      orderBy: {
        submittedAt: 'asc', // Oldest first for fair queue processing
      },
    })

    // Filter out submissions from eliminated teams
    const activeSubmissions = []
    for (const sub of submissions) {
      const statusResult = await getTeamStatus(sub.registrationId, db)
      if (statusResult.isEliminated) {
        continue
      }

      const eventConfig = (sub.registration.event.config as any) || {}
      const currentRound = sub.registration.event.currentGlobalRound ?? (eventConfig.currentRound !== undefined ? Number(eventConfig.currentRound) : 1)
      const progressState = (sub.registration.progressState as any) || {}
      const allowedRound = progressState.current_stage ?? 1
      if (allowedRound >= currentRound || sub.roundNumber === currentRound) {
        // Map registration select properties to keep response compatibility
        const { event, ...regRest } = sub.registration
        
        const roadmap = eventConfig?.roadmap || []
        const stepObj = roadmap.find((r: any) => r.task_id === sub.taskId)
        const rubricKeys = stepObj?.rubric || []
        
        const isFeature = sub.taskId.startsWith('FEATURE-')
        const isRound3 = sub.taskId === 'ROUND-3'
        const isRound3Eligible = isRound3 && sub.demoCall?.status === 'COMPLETED'

        if (rubricKeys.length > 0 || isFeature) {
          if (isRound3 && !isRound3Eligible) {
            continue
          }

          const criteria = getCriteriaForRubric(rubricKeys)

          const mappedSub = {
            ...sub,
            criteria,
            registration: {
              teamName: regRest.teamName,
              eventId: regRest.eventId,
              progressState: regRest.progressState,
            }
          }
          activeSubmissions.push(mappedSub)
        }
      }
    }

    return NextResponse.json({ submissions: activeSubmissions })
  } catch (error) {
    console.error('Admin queue fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
