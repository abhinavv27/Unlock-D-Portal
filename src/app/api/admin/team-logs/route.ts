import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'
import { getCriteriaForRubric } from '@/lib/rubric'

export async function GET(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const activeEvent = await db.event.findFirst({
      where: { isActive: true },
    })

    if (!activeEvent) {
      return NextResponse.json({ teams: [], currentGlobalRound: 1 })
    }

    const registrations = await db.registration.findMany({
      where: { eventId: activeEvent.id },
      orderBy: { totalScore: 'desc' },
      include: {
        event: true,
        submissions: {
          orderBy: { submittedAt: 'desc' },
          include: {
            evaluations: {
              include: {
                judge: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        },
      },
    })

    const teams = registrations.map((reg) => {
      const ps = reg.progressState as any
      return {
        id: reg.id,
        teamName: reg.teamName,
        unstopTeamId: reg.unstopTeamId,
        currentStage: ps?.current_stage ?? 0,
        totalScore: reg.totalScore,
        submissions: reg.submissions.map((sub) => {
          const eventConfig = (reg.event.config as any) || {}
          const roadmap = eventConfig?.roadmap || []
          const stepObj = roadmap.find((r: any) => r.task_id === sub.taskId)
          const rubricKeys = stepObj?.rubric || []
          const criteria = getCriteriaForRubric(rubricKeys)

          return {
            id: sub.id,
            roundNumber: sub.roundNumber,
            taskId: sub.taskId,
            status: sub.status,
            averageScore: sub.averageScore,
            submittedAt: sub.submittedAt,
            payload: sub.payload,
            submission_type: sub.submission_type,
            criteria,
            evaluations: sub.evaluations.map((ev) => ({
              id: ev.id,
              judgeId: ev.judgeId,
              judgeName: ev.judge.username,
              scoreBreakdown: ev.scoreBreakdown,
              totalScore: ev.totalScore,
              feedback: ev.feedback,
              gradedAt: ev.gradedAt,
            })),
          }
        }),
      }
    })

    return NextResponse.json({
      teams,
      currentGlobalRound: activeEvent.currentGlobalRound,
    })
  } catch (error) {
    console.error('Team logs fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
